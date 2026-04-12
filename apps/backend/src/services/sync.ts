import { prisma } from "../lib/prisma.js";
import { googleApiGet, googleApiPost } from "../lib/google-api.js";

type ClassroomCoursesResponse = {
  courses?: Array<{ id?: string }>;
};

type CourseworkItem = {
  id?: string;
  title?: string;
  alternateLink?: string;
  dueDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  dueTime?: {
    hours?: number;
    minutes?: number;
  };
};

type ClassroomCourseworkResponse = {
  courseWork?: CourseworkItem[];
};

type GmailListResponse = {
  messages?: Array<{ id?: string }>;
};

type GmailMessageResponse = {
  id?: string;
  snippet?: string;
  payload?: {
    headers?: Array<{ name?: string; value?: string }>;
  };
};

function dueDateToIso(item: CourseworkItem): string | null {
  if (!item.dueDate?.year || !item.dueDate?.month || !item.dueDate?.day) {
    return null;
  }

  const hour = item.dueTime?.hours ?? 23;
  const minute = item.dueTime?.minutes ?? 59;

  return new Date(Date.UTC(item.dueDate.year, item.dueDate.month - 1, item.dueDate.day, hour, minute)).toISOString();
}

function checksumForClasswork(item: CourseworkItem): string {
  return JSON.stringify({
    title: item.title,
    dueDate: item.dueDate,
    dueTime: item.dueTime,
    link: item.alternateLink
  });
}

function classifyMessage(subject: string, snippet: string): "DEADLINE" | "ANNOUNCEMENT" | "GENERAL" {
  const haystack = `${subject} ${snippet}`.toLowerCase();

  if (/(deadline|due|submission|assignment|quiz|exam)/.test(haystack)) {
    return "DEADLINE";
  }

  if (/(announcement|notice|update|reminder)/.test(haystack)) {
    return "ANNOUNCEMENT";
  }

  return "GENERAL";
}

export async function pollClassroomAssignments(userId: string): Promise<{ courses: number; assignments: number }> {
  const coursesRes = await googleApiGet<ClassroomCoursesResponse>(
    userId,
    "https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE"
  );

  const courses = coursesRes.courses ?? [];
  let assignmentCount = 0;

  for (const course of courses) {
    if (!course.id) {
      continue;
    }

    const courseworkRes = await googleApiGet<ClassroomCourseworkResponse>(
      userId,
      `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`
    );

    for (const item of courseworkRes.courseWork ?? []) {
      if (!item.id) {
        continue;
      }

      assignmentCount += 1;
      await prisma.eventMapping.upsert({
        where: {
          userId_sourceType_sourceExternalId: {
            userId,
            sourceType: "CLASSROOM",
            sourceExternalId: `${course.id}:${item.id}`
          }
        },
        update: {
          checksum: checksumForClasswork(item),
          lastSeenAt: new Date()
        },
        create: {
          userId,
          sourceType: "CLASSROOM",
          sourceExternalId: `${course.id}:${item.id}`,
          calendarEventId: "pending-sync",
          checksum: checksumForClasswork(item),
          lastSeenAt: new Date()
        }
      });

      const dueIso = dueDateToIso(item);
      if (dueIso) {
        await prisma.activityLog.create({
          data: {
            userId,
            action: "classroom.assignment_polled",
            details: {
              courseId: course.id,
              assignmentId: item.id,
              title: item.title,
              dueAt: dueIso,
              link: item.alternateLink
            }
          }
        });
      }
    }
  }

  return {
    courses: courses.length,
    assignments: assignmentCount
  };
}

export async function syncClassroomAssignmentsToCalendar(userId: string): Promise<{ created: number }> {
  const classroomMappings = await prisma.eventMapping.findMany({
    where: {
      userId,
      sourceType: "CLASSROOM",
      calendarEventId: "pending-sync"
    },
    orderBy: {
      createdAt: "asc"
    },
    take: 50
  });

  let created = 0;

  for (const mapping of classroomMappings) {
    const [courseId, assignmentId] = mapping.sourceExternalId.split(":");
    const item = await googleApiGet<CourseworkItem>(
      userId,
      `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${assignmentId}`
    );

    const dueDate = dueDateToIso(item);
    if (!dueDate) {
      continue;
    }

    const calendarEvent = await googleApiPost<{ id?: string }>(
      userId,
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        summary: item.title ?? "Classroom assignment",
        description: item.alternateLink ?? "Synced from Google Classroom",
        end: { dateTime: dueDate },
        start: {
          dateTime: new Date(new Date(dueDate).getTime() - 30 * 60 * 1000).toISOString()
        }
      }
    );

    if (!calendarEvent.id) {
      continue;
    }

    created += 1;
    await prisma.eventMapping.update({
      where: { id: mapping.id },
      data: { calendarEventId: calendarEvent.id }
    });
  }

  await prisma.activityLog.create({
    data: {
      userId,
      action: "calendar.classroom_sync",
      details: {
        created
      }
    }
  });

  return { created };
}

export async function classifyRecentGmail(userId: string): Promise<{ processed: number }> {
  const listRes = await googleApiGet<GmailListResponse>(
    userId,
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=newer_than:14d"
  );

  let processed = 0;

  for (const message of listRes.messages ?? []) {
    if (!message.id) {
      continue;
    }

    const fullMessage = await googleApiGet<GmailMessageResponse>(
      userId,
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=Subject`
    );

    const subject =
      fullMessage.payload?.headers?.find((header) => header.name?.toLowerCase() === "subject")?.value ?? "";

    const label = classifyMessage(subject, fullMessage.snippet ?? "");
    processed += 1;

    await prisma.activityLog.create({
      data: {
        userId,
        action: "gmail.message_classified",
        details: {
          messageId: fullMessage.id,
          subject,
          snippet: fullMessage.snippet,
          label
        }
      }
    });
  }

  return { processed };
}
