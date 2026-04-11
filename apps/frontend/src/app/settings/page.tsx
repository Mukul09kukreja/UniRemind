"use client";

import { SectionCard } from "@/components/section-card";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const connections = [
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
          Connect your Google account to enable Classroom, Calendar, and Gmail sync.
        </p>
      </header>

      <SectionCard title="Google Account" subtitle="Sign in to create your UniRemind session">
        <a
          href={`${apiBaseUrl}/api/auth/google/redirect`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "#2d6a4f",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            padding: "0.65rem 1.4rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: "pointer",
            textDecoration: "none",
            marginBottom: "1rem"
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

        <ul className="list">
          {connections.map((connection) => (
            <li className="listItem" key={connection.name}>
              <strong>{connection.name}</strong>{" "}
              <span className="pill">{connection.state}</span>
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