import { SectionCard } from "@/components/section-card";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const connections = [
  { name: "Google Account", state: "Connect with OAuth" },
  { name: "Google Classroom API", state: "Scopes requested" },
  { name: "Google Calendar API", state: "Scopes requested" },
  { name: "Gmail API", state: "Scopes requested" },
  { name: "WhatsApp Connector", state: "Not configured" }
];

export default function SettingsPage(): JSX.Element {
  return (
    <div className="grid" style={{ gap: "1rem" }}>
      <header>
        <h1 className="pageTitle">Settings</h1>
        <p className="pageSubtitle">
          Phase 2 authentication is available. Connect Google to create an authenticated session for
          UniRemind.
        </p>
      </header>

      <SectionCard title="Connections" subtitle="OAuth and external service status">
        <p>
          <a href={`${apiBaseUrl}/api/auth/google/redirect`}>Connect Google Account</a>
        </p>
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
