import Link from "next/link";

import { SectionCard } from "@/components/section-card";

const sourceCards = [
  { name: "Google Classroom", status: "Pending OAuth", note: "Assignments and due dates" },
  { name: "Google Calendar", status: "Pending OAuth", note: "Primary sync target" },
  { name: "Gmail", status: "Pending OAuth", note: "Clubs, Classes, Exams labeling" },
  { name: "WhatsApp", status: "Pending setup", note: "Deadline extraction from messages" }
];

export default function HomePage(): JSX.Element {
  return (
    <div className="grid" style={{ gap: "1rem" }}>
      <header>
        <h1 className="pageTitle">UniRemind Foundation Is Ready</h1>
        <p className="pageSubtitle">
          Phase 1 scaffold is complete. Continue with OAuth and service integrations in Phase 2 and
          Phase 3.
        </p>
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
        <p>
          Start by configuring environment files, then implement Google OAuth in backend APIs and
          connect settings UI.
        </p>
        <p>
          Jump to <Link href="/dashboard">Dashboard</Link> or <Link href="/settings">Settings</Link>.
        </p>
      </SectionCard>
    </div>
  );
}
