import Link from "next/link";

/** Centered white card on a grey page, used by /join and /j/[code] */
export default function JoinCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-zoom-bg px-4 py-16">
      <Link href="/" className="mb-8 text-3xl font-bold tracking-tight text-white">
        zoom
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-zoom-border bg-zoom-surface p-6 shadow-xl">
        <h1 className="mb-5 text-xl font-semibold">{title}</h1>
        {children}
      </div>
      <Link href="/" className="mt-6 text-sm text-zoom-muted hover:text-white">
        Back to home
      </Link>
    </main>
  );
}
