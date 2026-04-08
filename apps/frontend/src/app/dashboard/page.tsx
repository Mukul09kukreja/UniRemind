import { SectionCard } from "@/components/section-card";

const upcoming = [
  "No synced events yet. Connect Calendar and Classroom.",
  "WhatsApp parser worker not configured.",
  "Conflict checker not active."
];

const categorizedEmails = [
  { label: "Clubs", count: 0 },
  { label: "Classes", count: 0 },
  { label: "Exams", count: 0 }
];

export default function DashboardPage(): JSX.Element {
  return (
    <div className="grid" style={{ gap: "1rem" }}>
      <header>
        <h1 className="pageTitle">Dashboard</h1>
        <p className="pageSubtitle">
          This screen is ready for live data once integrations and background jobs are connected.
        </p>
      </header>

      <div className="grid gridCols3">
        {categorizedEmails.map((item) => (
          <SectionCard key={item.label} title={item.label} subtitle="Email category count">
            <p className="statValue">{item.count}</p>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Upcoming Deadline Stream" subtitle="Unified feed from all sources">
        <ul className="list">
          {upcoming.map((entry) => (
            <li className="listItem" key={entry}>
              {entry}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="High Priority Alerts" subtitle="Conflict and urgency notifications">
        <ul className="list">
          <li className="listItem">No alerts right now.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
