import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import type { InstalledApp } from "../types";
import { api } from "../api";

interface AppPickerProps {
  value: string;
  onSelect: (appName: string) => void;
}

export function AppPicker({ value, onSelect }: AppPickerProps) {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [search, setSearch] = useState("");
  const [iconCache, setIconCache] = useState<Record<string, string>>({});

  useEffect(() => {
    api.scanInstalledApps().then(setApps).catch(() => {});
  }, []);

  const loadIcon = async (appName: string) => {
    if (iconCache[appName] !== undefined) return;
    setIconCache((c) => ({ ...c, [appName]: "" }));
    const icon = await api.getAppIcon(appName).catch(() => null);
    if (icon) setIconCache((c) => ({ ...c, [appName]: icon }));
  };

  const filtered = apps.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <label className="text-xs text-white/50 mb-1 block">Select App</label>
      <div className="relative mb-1">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          className="w-full bg-white/10 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-400"
          placeholder="Search apps..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="max-h-36 overflow-y-auto space-y-0.5 bg-black/20 rounded-lg p-1">
        {filtered.length === 0 && (
          <p className="text-xs text-white/30 text-center py-3">
            {apps.length === 0 ? "Scanning apps…" : "No apps found"}
          </p>
        )}
        {filtered.slice(0, 50).map((app) => (
          <button
            key={app.path}
            onClick={() => {
              onSelect(app.name);
              loadIcon(app.name);
            }}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              value === app.name
                ? "bg-indigo-600 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {iconCache[app.name] ? (
              <img
                src={iconCache[app.name]}
                alt=""
                className="w-5 h-5 rounded-sm object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-5 h-5 bg-white/10 rounded-sm flex-shrink-0" />
            )}
            <span className="truncate text-left">{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
