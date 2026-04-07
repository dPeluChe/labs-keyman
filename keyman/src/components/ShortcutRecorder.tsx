import { useRef, useState } from "react";
import { X, Keyboard } from "lucide-react";

interface ShortcutRecorderProps {
  value: string;
  onChange: (shortcut: string) => void;
}

export function ShortcutRecorder({ value, onChange }: ShortcutRecorderProps) {
  const [recording, setRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!recording) return;
    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.ctrlKey) parts.push("ctrl");
    if (e.metaKey) parts.push("super");
    if (e.altKey) parts.push("alt");
    if (e.shiftKey) parts.push("shift");

    const ignore = ["Control", "Meta", "Alt", "Shift", "CapsLock", "Tab", "Escape"];
    if (!ignore.includes(e.key)) {
      parts.push(e.key.toLowerCase());
      onChange(parts.join("+"));
      setRecording(false);
    }
  };

  return (
    <div>
      <label className="text-xs text-white/50 mb-1 flex items-center gap-1">
        <Keyboard size={11} />
        Global Shortcut (optional)
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          readOnly
          className={`flex-1 bg-white/10 border rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none transition-colors ${
            recording
              ? "border-amber-400 bg-amber-400/10 animate-pulse"
              : "border-white/10 focus:border-indigo-400"
          }`}
          placeholder="e.g. ctrl+shift+1"
          value={recording ? "Press keys…" : value}
          onKeyDown={handleKeyDown}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          onClick={() => {
            setRecording((r) => !r);
            inputRef.current?.focus();
          }}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            recording ? "bg-amber-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/15"
          }`}
        >
          {recording ? "Stop" : "Record"}
        </button>
        {value && (
          <button
            onClick={() => onChange("")}
            className="px-2 py-1.5 rounded-lg bg-white/10 text-white/40 hover:text-red-400 text-xs"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <p className="text-xs text-white/25 mt-1">
        Runs this button globally, even when KeyMan is not focused
      </p>
    </div>
  );
}
