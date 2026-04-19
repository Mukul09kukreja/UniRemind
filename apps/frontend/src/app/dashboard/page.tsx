"use client";

import { useEffect, useMemo, useState } from "react";

import { SectionCard } from "@/components/section-card";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type SummaryResponse = {
  success: boolean;
  summary: {
    emailCategories: {
      DEADLINE: number;
      ANNOUNCEMENT: number;
      GENERAL: number;
    };
    highPriorityAlerts: number;
  };
};

type UpcomingResponse = {
  success: boolean;
  upcoming: Array<{
    title: string;
    dueAt: string;
    source: string;
    courseId: string | null;
  }>;
};

export default function DashboardPage(): JSX.Element {
  const [summary, setSummary] = useState<SummaryResponse["summary"] | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingResponse["upcoming"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const [summaryRes, upcomingRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/dashboard/summary`, {
            credentials: "include"
          }),
          fetch(`${apiBaseUrl}/api/dashboard/upcoming`, {
            credentials: "include"
          })
        ]);

        if (!summaryRes.ok || !upcomingRes.ok) {
          throw new Error("Unable to fetch dashboard data. Please sign in again.");
        }

        const summaryData = (await summaryRes.json()) as SummaryResponse;
        const upcomingData = (await upcomingRes.json()) as UpcomingResponse;

        setSummary(summaryData.summary);
        setUpcoming(upcomingData.upcoming);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Unknown dashboard error");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboardData();
  }, []);

  const categoryCards = useMemo(
    () => [
      { label: "Deadlines", count: summary?.emailCategories.DEADLINE ?? 0 },
      { label: "Announcements", count: summary?.emailCategories.ANNOUNCEMENT ?? 0 },
      { label: "General", count: summary?.emailCategories.GENERAL ?? 0 }
    ],
    [summary]
  );

  return (
    <div className="grid" style={{ gap: "1rem" }}>
      <header>
        <h1 className="pageTitle">Dashboard</h1>
        <p className="pageSubtitle">Live sync snapshot across Gmail and Classroom sources.</p>
      </header>

      {error ? <p className="pageSubtitle">{error}</p> : null}

      <div className="grid gridCols3">
        {categoryCards.map((item) => (
          <SectionCard key={item.label} title={item.label} subtitle="Email category count (last 30 days)">
            <p className="statValue">{loading ? "..." : item.count}</p>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Upcoming Deadline Stream" subtitle="Next 10 upcoming items from Classroom polling logs">
        <ul className="list">
          {!loading && upcoming.length === 0 ? (
            <li className="listItem">No upcoming assignments found yet.</li>
          ) : (
            upcoming.map((entry) => (
              <li className="listItem" key={`${entry.title}-${entry.dueAt}`}>
                <strong>{entry.title}</strong> — {new Date(entry.dueAt).toLocaleString()} ({entry.source})
              </li>
            ))
          )}
        </ul>
      </SectionCard>

      <SectionCard title="High Priority Alerts" subtitle="Background sync runner errors in the last 30 days">
        <ul className="list">
          <li className="listItem">
            {loading ? "Loading alerts..." : `${summary?.highPriorityAlerts ?? 0} runner alerts detected.`}
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
