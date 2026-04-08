"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" }
];

export function Nav(): JSX.Element {
  const pathname = usePathname();

  return (
    <header className="topNav">
      <div className="navInner">
        <Link className="brand" href="/">
          UniRemind
        </Link>
        <nav className="navLinks">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "navLink navLinkActive" : "navLink"}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
