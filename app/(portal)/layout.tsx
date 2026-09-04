import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui";
import { hasSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasSession())) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
