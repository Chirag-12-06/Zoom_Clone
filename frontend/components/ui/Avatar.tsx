const COLORS = ["bg-blue-600", "bg-emerald-600", "bg-purple-600", "bg-rose-600", "bg-amber-600", "bg-cyan-600"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Same name always gets the same color */
function colorFor(name: string): string {
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return COLORS[sum % COLORS.length];
}

type AvatarProps = {
  name: string;
  className?: string;
};

export default function Avatar({ name, className = "h-8 w-8 text-sm" }: AvatarProps) {
  return (
    <div
      className={`${colorFor(name)} ${className} flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
    >
      {initials(name)}
    </div>
  );
}
