import { useState } from "react";
import { X, Check, Palette, Zap, Settings2 } from "lucide-react";
import type { Button } from "../types";
import { ACTION_TYPES, COLOR_PRESETS, ICON_OPTIONS } from "../types";
import { DynamicIcon } from "./DynamicIcon";
import { AppPicker } from "./AppPicker";
import { ShortcutRecorder } from "./ShortcutRecorder";
import { useAppIcon } from "../hooks/useAppIcon";

type Tab = "appearance" | "action" | "advanced";

interface ButtonEditorProps {
  button: Partial<Button> & { position: number; profile_id: number };
  onSave: (button: Button) => void;
  onCancel: () => void;
}

export function ButtonEditor({ button, onSave, onCancel }: ButtonEditorProps) {
  const [tab, setTab] = useState<Tab>("action");
  const [form, setForm] = useState<Button>({
    id: button.id ?? 0,
    profile_id: button.profile_id,
    position: button.position,
    label: button.label ?? "",
    icon: button.icon ?? "Zap",
    color: button.color ?? "#1e293b",
    text_color: button.text_color ?? "#ffffff",
    action_type: button.action_type ?? "hotkey",
    action_value: button.action_value ?? "",
    action_modifier: button.action_modifier ?? "",
    global_shortcut: button.global_shortcut ?? "",
    enabled: button.enabled ?? true,
  });

  const update = (patch: Partial<Button>) => setForm((f) => ({ ...f, ...patch }));
  const selectedActionType = ACTION_TYPES.find((a) => a.value === form.action_type);
  const previewAppIcon = useAppIcon(form.action_type === "app" ? form.action_value : null);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "action", label: "Action", icon: <Zap size={13} /> },
    { id: "appearance", label: "Look", icon: <Palette size={13} /> },
    { id: "advanced", label: "Advanced", icon: <Settings2 size={13} /> },
  ];

  const summary = form.action_type === "app" && form.action_value
    ? `Open ${form.action_value}`
    : form.action_value
      ? `${selectedActionType?.label ?? form.action_type}: ${form.action_value}`
      : "Choose an action to configure this button";
  const compact = window.innerWidth < 900 || window.innerHeight < 720;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-3">
      <div className="bg-[#11141b] border border-white/10 rounded-[28px] w-full max-w-4xl shadow-2xl overflow-hidden"
           style={{ maxHeight: "calc(100vh - 24px)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {button.id ? "Edit Button" : "Add Button"}
            </h2>
            <p className="text-sm text-white/45 mt-0.5">Create a key with a clear icon, color, and action.</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`grid grid-cols-1 ${compact ? "xl:grid-cols-[220px_minmax(0,1fr)]" : "lg:grid-cols-[260px_minmax(0,1fr)]"}`}>
          <div className={`border-b ${compact ? "xl:border-b-0 xl:border-r" : "lg:border-b-0 lg:border-r"} border-white/10 bg-[#0d1016] ${compact ? "p-4 space-y-4" : "p-5 space-y-5"}`}>
            <div
              className={`${compact ? "aspect-[1.15] max-w-[140px] rounded-[22px] gap-1.5" : "aspect-square max-w-[190px] rounded-[26px] gap-2"} w-full mx-auto flex flex-col items-center justify-center border border-white/10 shadow-lg`}
              style={{ backgroundColor: form.color, color: form.text_color }}
            >
              {previewAppIcon ? (
                <img src={previewAppIcon} alt="" className={`${compact ? "w-11 h-11" : "w-16 h-16"} object-contain rounded-xl`} />
              ) : (
                <DynamicIcon name={form.icon} size={compact ? 30 : 44} />
              )}
              <span className={`${compact ? "text-xs min-h-[2rem]" : "text-sm min-h-[2.5rem]"} font-semibold text-center px-3 line-clamp-2 flex items-center`}>
                {form.label || "Button label"}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Label</label>
                <input
                  className="w-full bg-white/8 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-white/25 focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all"
                  placeholder="Button label"
                  value={form.label}
                  onChange={(e) => update({ label: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/35 mb-1">Summary</p>
                <p className="text-sm text-white/80 leading-relaxed">{summary}</p>
                <div className="mt-3 pt-3 border-t border-white/8">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/35 mb-1">Key Command</p>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {form.global_shortcut ? form.global_shortcut : "No global shortcut set"}
                  </p>
                  <p className="text-xs text-white/40 mt-1">You can change this in the Advanced tab.</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/8 p-3">
                <div>
                  <p className="text-sm font-medium text-white/85">Enabled</p>
                  <p className="text-xs text-white/40">Button can be pressed and triggered</p>
                </div>
                <button
                  onClick={() => update({ enabled: !form.enabled })}
                  className={`relative w-12 h-7 rounded-full transition-colors ${form.enabled ? "bg-indigo-600" : "bg-white/20"}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.enabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex flex-col">
            <div className={`flex gap-2 ${compact ? "px-4 pt-3" : "px-5 pt-4"} border-b border-white/10 bg-[#121722] overflow-x-auto no-scrollbar`}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-sm font-medium whitespace-nowrap transition-all ${
                    tab === t.id
                      ? "text-white bg-white/[0.06] border border-b-0 border-white/10"
                      : "text-white/45 hover:text-white/75"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            <div className={`${compact ? "p-4" : "p-5"} overflow-y-auto`} style={{ maxHeight: compact ? "calc(100vh - 180px)" : "calc(100vh - 220px)" }}>

              {tab === "action" && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">
                      Action Type
                    </label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {ACTION_TYPES.map((at) => (
                        <button
                          key={at.value}
                          onClick={() => update({ action_type: at.value, action_value: "", action_modifier: "" })}
                          className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                            form.action_type === at.value
                              ? "border-indigo-400 bg-indigo-500/15 text-white shadow-lg shadow-indigo-900/20"
                              : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="text-sm font-semibold">{at.label}</div>
                          <div className="text-xs text-white/40 mt-1 line-clamp-2">{at.placeholder || "Configure this action type"}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.action_type === "app" ? (
                    <AppPicker
                      value={form.action_value}
                      onSelect={(name) => update({ action_value: name, label: form.label || name })}
                    />
                  ) : (
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <label className="text-xs font-medium text-white/40 uppercase tracking-wider block">
                        {selectedActionType?.label ?? "Value"}
                      </label>
                      <input
                        className="w-full bg-[#1b2130] border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-white/25 focus:outline-none focus:border-indigo-400 focus:bg-[#20273a] transition-all"
                        placeholder={selectedActionType?.placeholder ?? ""}
                        value={form.action_value}
                        onChange={(e) => update({ action_value: e.target.value })}
                      />
                      {selectedActionType?.modifierLabel && (
                        <input
                          className="w-full bg-[#1b2130] border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-white/25 focus:outline-none focus:border-indigo-400 transition-all"
                          placeholder={selectedActionType.modifierLabel}
                          value={form.action_modifier}
                          onChange={(e) => update({ action_modifier: e.target.value })}
                        />
                      )}
                      {form.action_type === "hotkey" && (
                        <p className="text-sm text-white/45 leading-relaxed">
                          Example: key <code className="text-indigo-300">c</code> with modifiers <code className="text-indigo-300">ctrl+shift</code>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === "appearance" && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">Icon</label>
                    <div className="grid grid-cols-6 gap-2 p-3 bg-white/[0.03] border border-white/10 rounded-2xl max-h-64 overflow-y-auto sm:grid-cols-8 xl:grid-cols-10">
                      {ICON_OPTIONS.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => update({ icon })}
                          className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                            form.icon === icon
                              ? "bg-indigo-600 text-white scale-110 shadow-md"
                              : "text-white/45 hover:text-white hover:bg-white/10"
                          }`}
                          title={icon}
                        >
                          <DynamicIcon name={icon} size={20} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">Button Color</label>
                    <div className="grid grid-cols-8 gap-2 p-3 bg-white/[0.03] border border-white/10 rounded-2xl xl:grid-cols-10">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          onClick={() => update({ color: c })}
                          className={`aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
                            form.color === c ? "border-white scale-110 shadow-md" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={form.color}
                        onChange={(e) => update({ color: e.target.value })}
                        className="aspect-square rounded-xl cursor-pointer border-2 border-white/20 hover:border-white/60 transition-colors"
                        title="Custom color"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">Text Color</label>
                    <div className="flex items-center gap-3 flex-wrap rounded-2xl bg-white/[0.03] border border-white/10 p-3">
                      {["#ffffff", "#000000", "#94a3b8", "#fbbf24", "#34d399"].map((c) => (
                        <button
                          key={c}
                          onClick={() => update({ text_color: c })}
                          className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 ${
                            form.text_color === c ? "border-white scale-110" : "border-white/20"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={form.text_color}
                        onChange={(e) => update({ text_color: e.target.value })}
                        className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white/20"
                        title="Custom text color"
                      />
                    </div>
                  </div>
                </div>
              )}

              {tab === "advanced" && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <ShortcutRecorder
                      value={form.global_shortcut}
                      onChange={(s) => update({ global_shortcut: s })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 px-4 py-3 border-t border-white/10 bg-slate-950/50">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white/8 text-white/65 hover:bg-white/12 hover:text-white text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-2 px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40"
          >
            <Check size={15} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
