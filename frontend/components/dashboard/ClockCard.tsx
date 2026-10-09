"use client";

import { useEffect, useState } from "react";

import { formatLongDate, formatTime } from "@/lib/format";

/** The big centred clock at the top of Zoom's home screen */
export default function ClockCard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id); // stop the timer when the component unmounts
  }, []);

  return (
    <div className="text-center">
      {/* The server-rendered time can differ from the browser's by a second; tell React that's expected */}
      <p className="text-5xl font-bold tracking-tight sm:text-6xl" suppressHydrationWarning>
        {formatTime(now)}
      </p>
      <p className="mt-2 text-zoom-muted sm:text-lg" suppressHydrationWarning>
        {formatLongDate(now)}
      </p>
    </div>
  );
}
