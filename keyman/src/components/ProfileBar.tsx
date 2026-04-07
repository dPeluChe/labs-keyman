import { useState } from "react";
import { Plus, Trash2, Link2, Link2Off } from "lucide-react";
import { useKeymanStore } from "../store";
import { COLOR_PRESETS } from "../types";

interface ProfileBarProps {
  compact?: boolean;
}

export function ProfileBar({ compact = false }: ProfileBarProps) {
  const {
    profiles, activeProfileId,
    setActiveProfile, addProfile, deleteProfile,
    isEditMode, setProfileTrigger,
  } = useKeymanStore();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PRESETS[0]);
  const [editingTriggerId, setEditingTriggerId] = useState<number | null>(null);
  const [triggerInput, setTriggerInput] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addProfile(newName.trim(), newColor);
    setNewName("");
    setAdding(false);
  };

  const startEditTrigger = (profileId: number, current: string) => {
    setEditingTriggerId(profileId);
    setTriggerInput(current);
  };

  const saveTrigger = async () => {
    if (editingTriggerId === null) return;
    await setProfileTrigger(editingTriggerId, triggerInput.trim());
    setEditingTriggerId(null);
  };

  return (
    <div className={`px-2.5 bg-[linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0.005))] border-b border-white/[0.05] ${compact ? 'py-0.5' : 'py-1'}`}>
      <div className="flex gap-1 items-center overflow-x-auto no-scrollbar">
        {profiles.map((p) => (
          <div key={p.id} className="relative group flex-shrink-0">
            {editingTriggerId === p.id ? (
              <div className="no-drag flex items-center gap-1 bg-slate-800 border border-emerald-500/30 rounded-lg px-2 py-1">
                <Link2 size={10} className="text-emerald-400 flex-shrink-0" />
                <input
                  autoFocus
                  className="w-24 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none"
                  placeholder="App name…"
                  value={triggerInput}
                  onChange={(e) => setTriggerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTrigger();
                    if (e.key === "Escape") setEditingTriggerId(null);
                  }}
                />
                <button onClick={saveTrigger} className="text-xs text-emerald-400 hover:text-emerald-300">✓</button>
                <button onClick={() => setEditingTriggerId(null)} className="text-xs text-white/30 hover:text-white/60">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setActiveProfile(p.id)}
                className={`no-drag flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  p.id === activeProfileId
                    ? "text-white shadow-sm"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
                style={p.id === activeProfileId ? { backgroundColor: p.color + "33", borderColor: p.color, borderWidth: 1 } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                {p.name}
                {p.app_trigger && (
                  <span className="text-emerald-400/70 text-[9px] font-normal truncate max-w-[40px]">
                    {p.app_trigger}
                  </span>
                )}
              </button>
            )}

            {isEditMode && (
              <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
                <button
                  onClick={() => startEditTrigger(p.id, p.app_trigger)}
                  className="no-drag w-4 h-4 bg-emerald-700 hover:bg-emerald-600 rounded-full flex items-center justify-center"
                  title="Set auto-trigger app"
                >
                  {p.app_trigger ? <Link2 size={7} /> : <Link2Off size={7} />}
                </button>
                {profiles.length > 1 && (
                  <button
                    onClick={() => deleteProfile(p.id)}
                    className="no-drag w-4 h-4 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <Trash2 size={7} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {adding ? (
          <div className="no-drag flex items-center gap-1 flex-shrink-0">
            <input
              autoFocus
              className="w-20 bg-white/10 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-indigo-400"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setAdding(false);
              }}
            />
            <div className="flex gap-0.5">
              {COLOR_PRESETS.slice(0, 6).map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-3 h-3 rounded-full border ${newColor === c ? "border-white" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button onClick={handleAdd} className="text-xs text-indigo-400 hover:text-indigo-300">
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="no-drag flex-shrink-0 p-1 text-white/30 hover:text-white/60 hover:bg-white/10 rounded-lg transition-colors"
            title="Add profile"
          >
            <Plus size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
