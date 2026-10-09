import { House, MessagesSquare, Settings, Video } from "lucide-react";

// Only Home exists in this app; the others are placeholders to match Zoom's layout
const ITEMS = [
  { label: "Home", icon: House, active: true },
  { label: "Meetings", icon: Video, active: false },
  { label: "Chat", icon: MessagesSquare, active: false },
];

/** Zoom Workplace's left navigation rail (hidden on phones) */
export default function NavRail() {
  return (
    <nav className="hidden w-[88px] shrink-0 flex-col items-center gap-1 py-1 sm:flex">
      {ITEMS.map(({ label, icon: Icon, active }) => (
        <RailButton key={label} label={label} active={active}>
          <Icon className="h-5 w-5" />
        </RailButton>
      ))}
      <div className="mt-auto pb-2">
        <RailButton label="Settings">
          <Settings className="h-5 w-5" />
        </RailButton>
      </div>
    </nav>
  );
}

type RailButtonProps = { label: string; active?: boolean; children: React.ReactNode };

function RailButton({ label, active = false, children }: RailButtonProps) {
  return (
    <button
      className={`flex w-[76px] flex-col items-center gap-1 rounded-xl py-2.5 text-xs ${
        active ? "bg-black/40 text-white" : "text-gray-300 hover:bg-white/5"
      }`}
    >
      {children}
      {label}
    </button>
  );
}
