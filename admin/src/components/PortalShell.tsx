"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getStoredUser, getToken } from "@/lib/api";
import type { User } from "@/lib/types";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    ),
  },
  {
    href: "/questions",
    label: "Questions",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
      />
    ),
  },
  {
    href: "/digests",
    label: "Digests",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5"
      />
    ),
  },
  {
    href: "/mix",
    label: "Content Mix",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
      />
    ),
  },
  {
    href: "/schools",
    label: "Schools",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
      />
    ),
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-black text-white shadow-md shadow-indigo-200">
        Q
      </div>
      <div className="leading-tight">
        <div className="text-base font-bold tracking-tight text-slate-800">
          Quiz<span className="text-indigo-600">Quest</span>
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Content Portal
        </div>
      </div>
    </div>
  );
}

export default function PortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth state is read from localStorage only after mount. Reading it during
  // render (e.g. via useSyncExternalStore with a null server snapshot) makes
  // the hydration render see token=null on full page loads, and the guard
  // effect below would bounce a signed-in user to /login before React swaps
  // in the client snapshot.
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    setToken(getToken());
    setUser(getStoredUser());
  }, []);

  // Client-side auth guard: no token → back to login (undefined = still reading).
  useEffect(() => {
    if (token === null) router.replace("/login");
  }, [token, router]);

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
    router.replace("/login");
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            <svg
              className={`h-5 w-5 ${active ? "text-indigo-600" : "text-slate-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              {item.icon}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const userChip = user && (
    <div className="flex items-center gap-3 rounded-xl bg-slate-100/80 px-3 py-2.5">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
        style={{ backgroundColor: user.avatar?.bg || "#7C3AED" }}
      >
        <span>{user.avatar?.emoji || "🙂"}</span>
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-sm font-semibold text-slate-700">
          {user.name || user.phone}
        </div>
        <div className="text-xs capitalize text-slate-400">{user.role}</div>
      </div>
      <button
        onClick={logout}
        title="Log out"
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-600"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
          />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-6 py-6">
          <Logo />
        </div>
        {nav}
        <div className="p-3">{userChip}</div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[61px] z-20 border-b border-slate-200 bg-white pb-3 shadow-lg lg:hidden">
          <div className="py-3">{nav}</div>
          <div className="px-3">{userChip}</div>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
