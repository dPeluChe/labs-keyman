import { Plus } from "lucide-react";

interface AddButtonSlotProps {
  position: number;
  profileId: number;
  onAdd: (position: number, profileId: number) => void;
}

export function AddButtonSlot({ position, profileId, onAdd }: AddButtonSlotProps) {
  return (
    <button
      onClick={() => onAdd(position, profileId)}
      className="no-drag w-full aspect-square rounded-xl bg-white/[0.04] hover:bg-indigo-500/20 border border-dashed border-white/10 hover:border-indigo-500/60 flex flex-col items-center justify-center gap-1.5 text-white/20 hover:text-indigo-300 active:scale-95 transition-all duration-100 cursor-pointer group"
      title="Add new button"
    >
      <div className="w-8 h-8 rounded-lg border border-dashed border-current flex items-center justify-center group-hover:border-solid transition-all">
        <Plus size={16} />
      </div>
      <span className="text-[9px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-70 transition-opacity">Add</span>
    </button>
  );
}
