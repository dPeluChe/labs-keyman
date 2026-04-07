export interface Profile {
  id: number;
  name: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  app_trigger: string;
}

export interface Button {
  id: number;
  profile_id: number;
  position: number;
  label: string;
  icon: string;
  color: string;
  text_color: string;
  action_type: ActionType;
  action_value: string;
  action_modifier: string;
  global_shortcut: string;
  enabled: boolean;
}

export interface InstalledApp {
  name: string;
  path: string;
  icon_base64: string | null;
}

export type ActionType = "hotkey" | "text" | "app" | "shell" | "url" | "media";

export interface ActionTypeOption {
  value: ActionType;
  label: string;
  description: string;
  placeholder: string;
  modifierLabel?: string;
}

export const ACTION_TYPES: ActionTypeOption[] = [
  {
    value: "hotkey",
    label: "Hotkey",
    description: "Simulate a keyboard shortcut",
    placeholder: "e.g. c, enter, f5",
    modifierLabel: "Modifiers (e.g. ctrl+shift)",
  },
  {
    value: "text",
    label: "Type Text",
    description: "Type text as if you typed it",
    placeholder: "e.g. Hello, World!",
  },
  {
    value: "app",
    label: "Open App",
    description: "Launch an application",
    placeholder: "e.g. Terminal, Google Chrome",
  },
  {
    value: "shell",
    label: "Shell Command",
    description: "Run a shell command",
    placeholder: "e.g. say 'Hello'",
  },
  {
    value: "url",
    label: "Open URL",
    description: "Open a URL in default browser",
    placeholder: "e.g. https://example.com",
  },
  {
    value: "media",
    label: "Media Control",
    description: "Control media/volume",
    placeholder: "volume_up | volume_down | mute",
  },
];

export const ICON_OPTIONS = [
  "Zap", "Star", "Heart", "Flame", "Bolt",
  "Copy", "Paste", "Scissors", "Clipboard",
  "Save", "FolderOpen", "File", "FileText",
  "Terminal", "Code", "Code2", "Braces",
  "Globe", "Link", "ExternalLink",
  "Play", "Pause", "Square", "SkipForward", "SkipBack",
  "Volume", "Volume1", "Volume2", "VolumeX",
  "Camera", "Video", "Mic", "MicOff",
  "Monitor", "Tv", "Smartphone",
  "Settings", "Sliders", "ToggleLeft", "ToggleRight",
  "Search", "Filter", "RefreshCw", "RotateCcw",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "ChevronUp", "ChevronDown",
  "Plus", "Minus", "X", "Check",
  "Undo2", "Redo2", "Trash2", "Edit3",
  "Lock", "Unlock", "Key", "Shield",
  "Mail", "MessageSquare", "Bell",
  "Home", "User", "Users",
  "Sun", "Moon", "Cloud", "Wifi",
  "Battery", "BatteryCharging", "Power",
  "Command", "Option", "Keyboard",
];

export const COLOR_PRESETS = [
  "#1e293b", "#0f172a", "#1e1e2e",
  "#1d4ed8", "#1e40af", "#3b82f6",
  "#0f766e", "#14532d", "#166534",
  "#7f1d1d", "#991b1b", "#b91c1c",
  "#6d28d9", "#7c3aed", "#8b5cf6",
  "#92400e", "#78350f", "#b45309",
  "#0e7490", "#164e63", "#0891b2",
  "#9d174d", "#be185d", "#ec4899",
];
