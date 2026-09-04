"use client";

import Link from "next/link";
import { Card, ScreenTitle } from "@/components/ui";

const actions = [
  {
    href: "/capture/pledge",
    title: "Pledge",
    body: "Someone promised to give. This is not cash yet.",
  },
  {
    href: "/capture/cash",
    title: "Cash in",
    body: "Money received: offering, EFT, pledge payment, grant.",
  },
  {
    href: "/capture/inkind",
    title: "In-kind",
    body: "Bricks, cement, labour, chairs — anything that is not money.",
  },
  {
    href: "/capture/expense",
    title: "Spend",
    body: "A bill, supplier, or cash paid out on the build.",
  },
];

export default function CapturePage() {
  return (
    <div>
      <ScreenTitle
        title="Capture"
        subtitle="Use these four buttons on site. Keep it short — the detail can wait for later."
      />
      <div className="space-y-3">
        {actions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="transition active:scale-[0.99]">
              <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--purple-deep)]">
                {a.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{a.body}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
