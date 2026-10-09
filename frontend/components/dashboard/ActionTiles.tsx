import { CalendarDays, ChevronDown, Plus, Video } from "lucide-react";

type ActionTilesProps = {
  onNewMeeting?: () => void;
  onJoin?: () => void;
  onSchedule?: () => void;
};

export default function ActionTiles({ onNewMeeting, onJoin, onSchedule }: ActionTilesProps) {
  return (
    <div className="flex justify-center gap-8 sm:gap-14">
      <Tile
        label={
          <>
            New meeting <ChevronDown className="h-4 w-4 text-zoom-muted" />
          </>
        }
        color="bg-zoom-orange hover:brightness-110"
        onClick={onNewMeeting}
      >
        <Video className="h-8 w-8" fill="currentColor" />
      </Tile>
      <Tile label="Join" color="bg-zoom-blue hover:brightness-110" onClick={onJoin}>
        <Plus className="h-8 w-8" strokeWidth={2.5} />
      </Tile>
      <Tile label="Schedule" color="bg-zoom-blue hover:brightness-110" onClick={onSchedule}>
        <CalendarDays className="h-8 w-8" />
      </Tile>
    </div>
  );
}

type TileProps = {
  label: React.ReactNode;
  color: string;
  onClick?: () => void;
  children: React.ReactNode;
};

function Tile({ label, color, onClick, children }: TileProps) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2.5">
      <span
        className={`${color} flex h-16 w-16 items-center justify-center rounded-[20px] text-white transition sm:h-[70px] sm:w-[70px]`}
      >
        {children}
      </span>
      <span className="flex items-center gap-1 text-sm text-gray-100">{label}</span>
    </button>
  );
}
