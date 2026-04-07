import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KeyButton } from "./KeyButton";
import type { Button } from "../types";

interface SortableKeyButtonProps {
  button: Button;
  isEditMode: boolean;
  onPress: (b: Button) => void;
  onEdit: (b: Button) => void;
  onDelete: (id: number) => void;
}

export function SortableKeyButton({
  button,
  isEditMode,
  onPress,
  onEdit,
  onDelete,
}: SortableKeyButtonProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: button.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    touchAction: "none" as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(isEditMode ? listeners : {})}>
      <KeyButton
        button={button}
        isEditMode={isEditMode}
        onPress={onPress}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
