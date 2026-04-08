export type DeadlineCategory = "clubs" | "classes" | "exams" | "general";
export type ExtractionActionType = "create" | "update";

export type DeadlineExtraction = {
  title: string;
  date: string;
  time?: string;
  category: DeadlineCategory;
  action_type: ExtractionActionType;
};

export type EventMappingRecord = {
  sourceType: "CLASSROOM" | "WHATSAPP" | "GMAIL" | "MANUAL";
  sourceExternalId: string;
  calendarEventId: string;
};

export type EmailCategory = "Clubs" | "Classes" | "Exams";
