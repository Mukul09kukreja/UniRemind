import Link from "next/link";

import { SectionCard } from "@/components/section-card";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const sourceCards = [
  { name: "Google Classroom", status: "Pending OAuth", note: "Assignments and due dates" },
  { name: "Google Calendar", status: "Pending OAuth", note: "Primary sync target" },
  { name: "Gmail", status: "Pending OAuth", note: "Clubs, Classes, Exams labeling" },
  { name: "WhatsApp", status: "Pending setup", note: "Deadline extraction from messages" }
];

export default function HomePage(): JSX.Element {
  return (
    <div className="grid" style={{ gap: "1rem" }}>
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="pageTitle">UniRemind Foundation Is Ready</h1>
          <p className="pageSubtitle">
            Phase 1 scaffold is complete. Sign in with Google to begin.
          </p>
        </div>
        <a
          href={`${apiBaseUrl}/api/auth/google/redirect`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "#2d6a4f",
            color: "#fff",
            borderRadius: "999px",
            padding: "0.65rem 1.4rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap",
            marginTop: "0.25rem"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity=".85"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff" opacity=".7"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity=".9"/>
          </svg>
          Sign in with Google
        </a>
      </header>

      <div className="grid gridCols3">
        <SectionCard title="Upcoming Deadlines" subtitle="Placeholder summary">
          <p className="statValue">0</p>
          <p>Connect Google Calendar and Classroom to populate this automatically.</p>
        </SectionCard>
        <SectionCard title="Unsorted Emails" subtitle="Placeholder summary">
          <p className="statValue">0</p>
          <p>Gmail categorization logic will surface Clubs, Classes, and Exams here.</p>
        </SectionCard>
        <SectionCard title="Automation Actions" subtitle="Placeholder summary">
          <p className="statValue">0</p>
          <p>Activity logs from backend jobs will appear once sync workers are enabled.</p>
        </SectionCard>
      </div>

      <SectionCard title="Connections Snapshot" subtitle="Initial status for integrations">
        <ul className="list">
          {sourceCards.map((source) => (
            <li className="listItem" key={source.name}>
              <strong>{source.name}</strong> <span className="pill">{source.status}</span>
              <div>{source.note}</div>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Next Actions">
        <p>Sign in with Google above, then visit your <Link href="/dashboard">Dashboard</Link> or <Link href="/settings">Settings</Link>.</p>
      </SectionCard>
    </div>
  );
}