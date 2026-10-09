"use client";

import { Bell, ChevronLeft, ChevronRight, LogOut, Search, Settings, User as UserIcon } from "lucide-react";
import { useState } from "react";

import Avatar from "@/components/ui/Avatar";
import type { User } from "@/lib/types";

/** Zoom Workplace top bar: logo, search, notifications and the profile menu (placeholders: no auth) */
export default function TopNav({ user }: { user: User | null }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 px-3">
      <div className="flex flex-col leading-none">
        <span className="text-[11px] font-semibold tracking-tight">zoom</span>
        <span className="text-lg font-semibold tracking-tight">Workplace</span>
      </div>

      <div className="ml-6 hidden items-center gap-1 text-zoom-muted md:flex">
        <ChevronLeft className="h-5 w-5 opacity-50" />
        <ChevronRight className="h-5 w-5 opacity-50" />
      </div>

      <div className="mx-auto hidden w-full max-w-xl items-center justify-center gap-2 rounded-lg bg-zoom-surface-2 px-3 py-1.5 sm:flex">
        <Search className="h-4 w-4 text-zoom-muted" />
        <input
          placeholder="Search"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zoom-muted"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:ml-0">
        <button
          title="Notifications"
          className="rounded-md p-2 text-zoom-muted hover:bg-white/10 hover:text-white"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Profile menu"
            className="rounded-full p-0.5 hover:ring-2 hover:ring-white/20"
          >
            {user ? <Avatar name={user.name} /> : <div className="h-8 w-8 rounded-full bg-zoom-surface-2" />}
          </button>

          {menuOpen && user && (
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-zoom-border bg-zoom-surface py-2 shadow-xl">
              <div className="flex items-center gap-3 px-4 pb-3">
                <Avatar name={user.name} className="h-10 w-10 text-base" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-zoom-muted">{user.email}</p>
                </div>
              </div>
              <div className="border-t border-zoom-border pt-2">
                <MenuItem icon={<UserIcon className="h-4 w-4" />} label="Profile" />
                <MenuItem icon={<Settings className="h-4 w-4" />} label="Settings" />
                <MenuItem icon={<LogOut className="h-4 w-4" />} label="Sign out" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Placeholder menu entries: there is no auth or profile page in this app
function MenuItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-white/5">
      {icon}
      {label}
    </button>
  );
}
