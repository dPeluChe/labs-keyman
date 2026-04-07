import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Button } from "../types";
import { DynamicIcon } from "./DynamicIcon";
import { useAppIcon } from "../hooks/useAppIcon";

type KeyButtonVariant = "main" | "utility";

interface KeyButtonProps {
  button: Button;
  isEditMode: boolean;
  onPress: (button: Button) => void;
  onEdit: (button: Button) => void;
  onDelete: (id: number) => void;
  variant?: KeyButtonVariant;
}

export function KeyButton({ button, isEditMode, onPress, onEdit, onDelete, variant = "main" }: KeyButtonProps) {
  const [pressed, setPressed] = useState(false);
  const appIcon = useAppIcon(button.action_type === "app" ? button.action_value : null);
  const isUtility = variant === "utility";

  const handleClick = () => {
    if (isEditMode) {
      onEdit(button);
      return;
    }
    if (!button.enabled) return;
    setPressed(true);
    setTimeout(() => setPressed(false), 150);
    onPress(button);
  };

  const hasContent = appIcon || button.icon || button.label;

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        className={`
          no-drag w-full aspect-square
          rounded-xl flex flex-col items-center justify-center
          transition-all duration-75 select-none overflow-hidden
          ${pressed ? "scale-[0.93] brightness-50" : ""}
          ${!isEditMode && !pressed ? "hover:brightness-110" : ""}
          ${!button.enabled && !isEditMode ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
          ${isEditMode ? "ring-1 ring-amber-400/60 ring-inset" : ""}
        `}
        style={{
          backgroundColor: button.color || "#1a1a2e",
          color: button.text_color,
        }}
      >
        {/* Icon */}
        {appIcon ? (
          <img
            src={appIcon}
            alt=""
            className={`object-contain rounded-lg ${button.label && !isUtility ? "w-9 h-9 mb-1" : isUtility ? "w-7 h-7" : "w-11 h-11"}`}
          />
        ) : button.icon ? (
          <div className={button.label && !isUtility ? "mb-1" : ""}>
            <DynamicIcon name={button.icon} size={isUtility ? 24 : (button.label ? 30 : 36)} />
          </div>
        ) : null}

        {/* Label — solo en modo main */}
        {button.label && !isUtility && (
          <span
            className="text-[10px] font-bold leading-none text-center px-1.5 line-clamp-2 tracking-wide"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
          >
            {button.label}
          </span>
        )}

        {/* Empty button placeholder */}
        {!hasContent && !isEditMode && (
          <div className="w-full h-full" />
        )}

        {/* Edit mode: hover tint + pencil hint */}
        {isEditMode && (
          <div className="absolute inset-0 bg-black/20 rounded-xl" />
        )}
      </button>

      {isEditMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(button); }}
          className="no-drag absolute top-1.5 left-1.5 w-7 h-7 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-full flex items-center justify-center transition-all shadow-lg z-20 border border-black/30"
          title="Edit"
        >
          <Pencil size={12} className="text-black" />
        </button>
      )}

      {/* Delete badge — top-right corner, edit mode only */}
      {isEditMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(button.id); }}
          className="no-drag absolute top-1.5 right-1.5 w-7 h-7 bg-red-600 hover:bg-red-400 active:scale-95 rounded-full flex items-center justify-center transition-all shadow-lg z-20 border border-black/40"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      )}

      {isEditMode && button.label && (
        <div className="pointer-events-none absolute inset-x-2 bottom-1.5 flex justify-center z-10">
          <div className="bg-black/55 rounded-full px-2 py-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-white/85">Tap to edit</span>
          </div>
        </div>
      )}
    </div>
  );
}
