"use client";

import { ChevronDown, LogOut, Search, Settings, User as UserIcon } from "lucide-react";
import { useState } from "react";

import Avatar from "@/components/ui/Avatar";
import type { User } from "@/lib/types";

const TABS = ["Home", "Meetings", "Team Chat", "Contacts"];

export default function TopNav({ user }: { user: User | null }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-4">
      <span className="text-2xl font-bold tracking-tight text-zoom-blue">zoom</span>

      <nav className="hidden items-center gap-1 md:flex">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === "Home" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="ml-auto hidden max-w-xs flex-1 items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 sm:flex">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          placeholder="Search"
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      <button title="Settings" className="ml-auto rounded-md p-2 text-gray-500 hover:bg-gray-100 sm:ml-0">
        <Settings className="h-5 w-5" />
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-1 rounded-md p-1 hover:bg-gray-100"
        >
          {user ? <Avatar name={user.name} /> : <div className="h-8 w-8 rounded-full bg-gray-200" />}
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>

        {menuOpen && user && (
          <div className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
            <div className="flex items-center gap-3 px-4 pb-3">
              <Avatar name={user.name} className="h-10 w-10 text-base" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-2">
              <MenuItem icon={<UserIcon className="h-4 w-4" />} label="Profile" />
              <MenuItem icon={<Settings className="h-4 w-4" />} label="Settings" />
              <MenuItem icon={<LogOut className="h-4 w-4" />} label="Sign out" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Placeholder menu entries: there is no auth or profile page in this app
function MenuItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
      {icon}
      {label}
    </button>
  );
}
