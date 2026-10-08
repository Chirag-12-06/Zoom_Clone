"use client";

import { useEffect, useState } from "react";

import { formatLongDate, formatTime } from "@/lib/format";

export default function ClockCard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id); // stop the timer when the component unmounts
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 px-6 py-8 text-white">
      {/* The server-rendered time can differ from the browser's by a second; tell React that's expected */}
      <p className="text-5xl font-semibold" suppressHydrationWarning>
        {formatTime(now)}
      </p>
      <p className="mt-1 text-sm text-slate-300" suppressHydrationWarning>
        {formatLongDate(now)}
      </p>
    </div>
  );
}
