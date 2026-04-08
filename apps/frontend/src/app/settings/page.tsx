import { SectionCard } from "@/components/section-card";

const connections = [
  { name: "Google Account", state: "Disconnected" },
  { name: "Google Classroom API", state: "Disconnected" },
  { name: "Google Calendar API", state: "Disconnected" },
  { name: "Gmail API", state: "Disconnected" },
  { name: "WhatsApp Connector", state: "Not configured" }
];

export default function SettingsPage(): JSX.Element {
  return (
    <div className="grid" style={{ gap: "1rem" }}>
      <header>
        <h1 className="pageTitle">Settings</h1>
        <p className="pageSubtitle">
          Manage connections, sync preferences, and sorting rules here once auth endpoints are
          implemented.
        </p>
      </header>

      <SectionCard title="Connections" subtitle="OAuth and external service status">
        <ul className="list">
          {connections.map((connection) => (
            <li className="listItem" key={connection.name}>
              <strong>{connection.name}</strong> <span className="pill">{connection.state}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Email Sorting Rules" subtitle="Starter placeholders">
        <ul className="list">
          <li className="listItem">Clubs: sender contains club domain or subject contains club name.</li>
          <li className="listItem">Classes: sender is instructor or LMS notifications.</li>
          <li className="listItem">Exams: subject contains exam, midterm, final, or quiz.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
