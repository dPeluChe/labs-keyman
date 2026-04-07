import { Minus, X, Edit3, Check, Pin, PinOff, LayoutGrid, Zap } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useKeymanStore } from "../store";
import { api } from "../api";

interface TitleBarProps {
  compact?: boolean;
}

export function TitleBar({ compact = false }: TitleBarProps) {
  const {
    isEditMode, setEditMode,
    alwaysOnTop, toggleAlwaysOnTop,
    gridCols, setGridCols,
    autoMode, toggleAutoMode,
    contextApp,
  } = useKeymanStore();

  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    getCurrentWindow().startDragging();
  };

  return (
    <div
      className={`flex items-center justify-between px-2.5 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] border-b border-white/[0.05] cursor-grab active:cursor-grabbing select-none ${compact ? 'h-[30px] min-h-[30px]' : 'h-[34px] min-h-[34px]'}`}
      onMouseDown={handleDragStart}
    >
      {/* Logo — minimal */}
      <div className="flex items-center gap-1.5 pointer-events-none">
        <div className="w-4 h-4 bg-indigo-600 rounded-md flex items-center justify-center shadow-sm">
          <LayoutGrid size={9} className="text-white" />
        </div>
        <span className="text-[11px] font-bold text-white/70 tracking-[0.18em] uppercase">KeyMan</span>
        {autoMode && contextApp && (
          <span className="flex items-center gap-1 ml-1">
            <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-400/80 truncate max-w-[80px]">{contextApp}</span>
          </span>
        )}
      </div>

      {/* Controls — icon only, tiny */}
      <div className="flex items-center gap-0" style={{ pointerEvents: "auto" }}>
        <button onClick={() => { const n = gridCols === 3 ? 4 : gridCols === 4 ? 5 : 3; setGridCols(n); }}
          className="px-1.5 py-0.5 text-[10px] font-mono text-white/30 hover:text-white/70 hover:bg-white/10 rounded transition-all" title="Grid columns">
          {gridCols}×
        </button>

        <button onClick={() => toggleAutoMode()}
          className={`p-1 rounded transition-all ${autoMode ? "text-emerald-400" : "text-white/20 hover:text-white/50"}`}
          title="Auto profile switching">
          <Zap size={11} />
        </button>

        <button onClick={toggleAlwaysOnTop}
          className={`p-1 rounded transition-all ${alwaysOnTop ? "text-indigo-400" : "text-white/20 hover:text-white/50"}`}
          title={alwaysOnTop ? "Always on top: ON" : "Always on top: OFF"}>
          {alwaysOnTop ? <Pin size={11} /> : <PinOff size={11} />}
        </button>

        <div className="w-px h-3 bg-white/10 mx-1" />

        <button onClick={() => setEditMode(!isEditMode)}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
            isEditMode ? "text-amber-300 bg-amber-500/20" : "text-white/30 hover:text-white/60 hover:bg-white/10"
          }`}
          title={isEditMode ? "Exit edit mode" : "Edit buttons"}>
          {isEditMode ? <><Check size={10} /> Done</> : <><Edit3 size={10} /> Edit</>}
        </button>

        <div className="w-px h-3 bg-white/10 mx-1" />

        <button onClick={() => api.minimizeWindow()}
          className="p-1 text-white/20 hover:text-white/50 hover:bg-white/10 rounded transition-all" title="Minimize">
          <Minus size={11} />
        </button>
        <button onClick={() => api.closeWindow()}
          className="p-1 text-white/20 hover:text-red-400 rounded transition-all" title="Close to tray">
          <X size={11} />
        </button>
      </div>
    </div>
  );
}
