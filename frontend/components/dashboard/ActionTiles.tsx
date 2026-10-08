import { CalendarDays, Plus, Video } from "lucide-react";

type ActionTilesProps = {
  onNewMeeting?: () => void;
  onJoin?: () => void;
  onSchedule?: () => void;
};

export default function ActionTiles({ onNewMeeting, onJoin, onSchedule }: ActionTilesProps) {
  return (
    <div className="flex justify-center gap-6 sm:gap-10">
      <Tile label="New meeting" color="bg-zoom-orange hover:bg-orange-500" onClick={onNewMeeting}>
        <Video className="h-8 w-8" />
      </Tile>
      <Tile label="Join" color="bg-zoom-blue hover:bg-zoom-blue-dark" onClick={onJoin}>
        <Plus className="h-8 w-8" />
      </Tile>
      <Tile label="Schedule" color="bg-zoom-blue hover:bg-zoom-blue-dark" onClick={onSchedule}>
        <CalendarDays className="h-8 w-8" />
      </Tile>
    </div>
  );
}

type TileProps = {
  label: string;
  color: string;
  onClick?: () => void;
  children: React.ReactNode;
};

function Tile({ label, color, onClick, children }: TileProps) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <span
        className={`${color} flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-sm transition-colors sm:h-20 sm:w-20`}
      >
        {children}
      </span>
      <span className="text-sm text-gray-700">{label}</span>
    </button>
  );
}
