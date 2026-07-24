import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  if (process.env.BETTER_AUTH_SECRET && process.env.DATABASE_URL) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/sign-in");
  }
  return <AppShell>{children}</AppShell>;
}
