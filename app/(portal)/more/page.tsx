"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, ScreenTitle } from "@/components/ui";

const links = [
  { href: "/people", title: "People", body: "Members, companies and anonymous givers." },
  { href: "/budget", title: "Budget", body: "Set a number against each building category." },
  { href: "/guide", title: "What to collect", body: "The ministry building-campaign template behind this portal." },
  { href: "/settings", title: "Settings", body: "Church name, USD$ and ZWG$ goals, and PIN." },
];

export default function MorePage() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "logout" }),
    });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div>
      <ScreenTitle title="More" subtitle="Setup, people and the campaign template." />
      <div className="space-y-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card>
              <h3 className="font-semibold text-[var(--purple-deep)]">{l.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{l.body}</p>
            </Card>
          </Link>
        ))}
        <button type="button" onClick={() => void logout()} className="w-full">
          <Card>
            <h3 className="font-semibold text-red-800">Sign out</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Lock the books on this device.</p>
          </Card>
        </button>
      </div>
    </div>
  );
}
