import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniRemind",
  description: "Student productivity workspace for deadlines, sync, and updates."
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body>
        <div className="appShell">
          <Nav />
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
