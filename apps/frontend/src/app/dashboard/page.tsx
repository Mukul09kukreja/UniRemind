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
  meta: {
    limit: number;
    offset: number;
    total: number;
  };
};

type AlertsResponse = {
  success: boolean;
  alerts: Array<{
    id: string;
    severity: "critical" | "high" | "medium";
    message: string;
    dueAt: string | null;
  }>;
};

export default function DashboardPage(): JSX.Element {
  const [summary, setSummary] = useState<SummaryResponse["summary"] | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingResponse["upcoming"]>([]);
  const [alerts, setAlerts] = useState<AlertsResponse["alerts"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const [summaryRes, upcomingRes, alertsRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/dashboard/summary?days=30`, {
            credentials: "include"
          }),
          fetch(`${apiBaseUrl}/api/dashboard/upcoming?limit=10&offset=0`, {
            credentials: "include"
          }),
          fetch(`${apiBaseUrl}/api/dashboard/alerts?windowHours=48&limit=5`, {
            credentials: "include"
          })
        ]);

        if (!summaryRes.ok || !upcomingRes.ok || !alertsRes.ok) {
          throw new Error("Unable to fetch dashboard data. Please sign in again.");
        }

        const summaryData = (await summaryRes.json()) as SummaryResponse;
        const upcomingData = (await upcomingRes.json()) as UpcomingResponse;
        const alertsData = (await alertsRes.json()) as AlertsResponse;

        setSummary(summaryData.summary);
        setUpcoming(upcomingData.upcoming);
        setAlerts(alertsData.alerts);
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

      <SectionCard title="High Priority Alerts" subtitle="Urgency + sync health alerts">
        <ul className="list">
          {!loading && alerts.length === 0 ? (
            <li className="listItem">No alerts right now.</li>
          ) : (
            alerts.map((alert) => (
              <li className="listItem" key={alert.id}>
                <strong>[{alert.severity.toUpperCase()}]</strong> {alert.message}
                {alert.dueAt ? ` — due ${new Date(alert.dueAt).toLocaleString()}` : ""}
              </li>
            ))
          )}
        </ul>
      </SectionCard>
    </div>
  );
}
