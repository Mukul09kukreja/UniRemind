import type { PropsWithChildren } from "react";

type SectionCardProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
}>;

export function SectionCard({ title, subtitle, children }: SectionCardProps): JSX.Element {
  return (
    <section className="sectionCard">
      <div className="sectionHeader">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}
