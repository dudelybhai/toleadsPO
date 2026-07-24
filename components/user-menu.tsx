"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();

  if (!session) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        TS
      </div>
    );
  }

  const initials = session.user.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Open account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
        onClick={() => setOpen((current) => !current)}
      >
        {initials || "TS"}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-64 rounded-lg border bg-white p-2 shadow-lg">
          <div className="border-b px-3 py-2">
            <div className="truncate text-sm font-medium">{session.user.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {session.user.email}
            </div>
            <div className="mt-1 text-xs capitalize text-muted-foreground">
              {session.user.role}
            </div>
          </div>
          <button
            type="button"
            className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-secondary"
            onClick={async () => {
              await authClient.signOut();
              router.push("/sign-in");
              router.refresh();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
