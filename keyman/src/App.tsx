import { useEffect, useMemo, useState, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useKeymanStore } from "./store";
import { TitleBar } from "./components/TitleBar";
import { ProfileBar } from "./components/ProfileBar";
import { KeyButton } from "./components/KeyButton";
import { SortableKeyButton } from "./components/SortableKeyButton";
import { AddButtonSlot } from "./components/AddButtonSlot";
import { ButtonEditor } from "./components/ButtonEditor";
import { api } from "./api";
import type { Button } from "./types";
import "./index.css";

const GRID_ROWS = 4;
const NEXT_EMPTY_SLOTS = 3;
const MIN_WINDOW_WIDTH = 360;
const MIN_WINDOW_HEIGHT = 420;
const MIN_SLOT_SIZE = 64;
const MAX_SLOT_SIZE = 110;

// Botones de utilidad (siempre arriba, más pequeños)
const isUtilityButton = (button: Button) => {
  const label = button.label.toLowerCase();
  return (
    button.action_type === "media" ||
    label.includes("screenshot") ||
    label.includes("mic") ||
    label.includes("camera") ||
    label.includes("volume")
  );
};

function App() {
  const {
    activeProfileId,
    buttons,
    isEditMode,
    gridCols,
    loadProfiles,
    saveButton,
    deleteButton,
    executeButton,
    reorderButtons,
    registerShortcuts,
    handleContextChange,
  } = useKeymanStore();

  const unlistenRef = useRef<UnlistenFn | null>(null);

  const [editingButton, setEditingButton] = useState<
    (Partial<Button> & { position: number; profile_id: number }) | null
  >(null);
  const [dragActiveId, setDragActiveId] = useState<number | null>(null);
  const [viewport, setViewport] = useState({ 
    width: Math.max(window.innerWidth, MIN_WINDOW_WIDTH), 
    height: Math.max(window.innerHeight, MIN_WINDOW_HEIGHT) 
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    loadProfiles().then(() => registerShortcuts());

    listen<string>("context-app-changed", (event) => {
      handleContextChange(event.payload);
    }).then((fn) => { unlistenRef.current = fn; });

    return () => { unlistenRef.current?.(); };
  }, []);

  useEffect(() => {
    const onResize = () => setViewport({ 
      width: Math.max(window.innerWidth, MIN_WINDOW_WIDTH), 
      height: Math.max(window.innerHeight, MIN_WINDOW_HEIGHT) 
    });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Actualizar tamaño mínimo de ventana según columnas
  useEffect(() => {
    // Calcular mínimo para mostrar todo el grid actual
    // Ancho = cols * slot_min + (cols-1) * gap + padding + chrome
    const minGap = 6;
    const minPadding = 12;
    const chromeWidth = 24; // bordes, scrollbar, etc
    const minWidth = gridCols * MIN_SLOT_SIZE + (gridCols - 1) * minGap + minPadding * 2 + chromeWidth;
    
    // Alto mínimo para 2 filas de botones + utility + chrome
    const minRows = 2;
    const minHeight = minRows * MIN_SLOT_SIZE + (minRows - 1) * minGap + minPadding * 2 + 120; // 120 para header+utility
    
    api.setWindowMinSize(minWidth, minHeight);
  }, [gridCols]);

  // Detectar modo compacto
  const compact = viewport.width < 500 || viewport.height < 500;
  const veryCompact = viewport.width < 380;

  // Separar botones
  const utilityButtons = buttons.filter(isUtilityButton);
  const mainButtons = buttons.filter((b) => !isUtilityButton(b));
  const sortedIds = mainButtons.map((b) => b.id);

  // Grid calculado responsivamente
  const baseGridSlots = gridCols * GRID_ROWS;
  const editExtraSlots = isEditMode ? NEXT_EMPTY_SLOTS : 0;
  const totalSlots = baseGridSlots + editExtraSlots;

  // Calcular tamaño de slot respetando mínimos
  const gap = compact ? 6 : 8;
  const shellPadding = compact ? 12 : 16;
  const availableWidth = viewport.width - shellPadding * 2;
  const chromeHeight = compact ? 90 : 100;
  const utilityHeight = utilityButtons.length > 0 ? (compact ? 60 : 72) : 0;
  const availableHeight = viewport.height - chromeHeight - utilityHeight - shellPadding * 2;

  const slotSize = useMemo(() => {
    const byWidth = (availableWidth - gap * (gridCols - 1)) / gridCols;
    const byHeight = (availableHeight - gap * (GRID_ROWS - 1)) / GRID_ROWS;
    const calculated = Math.min(byWidth, byHeight);
    // Forzar entre mínimo y máximo
    return Math.max(MIN_SLOT_SIZE, Math.min(calculated, MAX_SLOT_SIZE));
  }, [availableWidth, availableHeight, gap, gridCols]);

  // Tamaño para utility buttons (más pequeños)
  const utilitySize = Math.max(48, Math.min(slotSize * 0.7, compact ? 52 : 64));

  const buttonByPosition = new Map<number, Button>();
  for (const b of mainButtons) {
    if (b.position < baseGridSlots) {
      buttonByPosition.set(b.position, b);
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setDragActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDragActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedIds.indexOf(active.id as number);
    const newIndex = sortedIds.indexOf(over.id as number);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(sortedIds, oldIndex, newIndex);
    await reorderButtons(newOrder);
  };

  const handleAddAt = (position: number, profileId: number) => {
    setEditingButton({ position, profile_id: profileId });
  };

  const handleEdit = (button: Button) => {
    setEditingButton(button);
  };

  const handleSave = async (button: Button) => {
    await saveButton(button);
    setEditingButton(null);
    await registerShortcuts();
  };

  const dragActiveButton = dragActiveId !== null
    ? buttons.find((b) => b.id === dragActiveId) ?? null
    : null;

  return (
    <div className="relative flex h-screen flex-col overflow-hidden rounded-[26px] border border-white/[0.08] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.06),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.06),_transparent_26%),linear-gradient(180deg,_#0b0c10_0%,_#09090b_100%)] shadow-2xl" style={{ minWidth: MIN_WINDOW_WIDTH, minHeight: MIN_WINDOW_HEIGHT }}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_16%,transparent_84%,rgba(255,255,255,0.03))]" />

      <div className="relative z-10 flex flex-col h-full min-w-0">
        <TitleBar compact={compact} />
        <ProfileBar compact={compact} />

        <div className="flex-1 overflow-y-auto flex flex-col items-center" style={{ padding: compact ? 8 : 12 }}>
          {/* Utility Row - controles base */}
          {utilityButtons.length > 0 && (
            <div className="mb-3 flex justify-center">
              <div
                className="flex items-center rounded-2xl bg-white/[0.04] border border-white/[0.08] px-3 py-2"
                style={{ gap: veryCompact ? 6 : 10 }}
              >
                {utilityButtons.map((button) => (
                  <div 
                    key={`utility-${button.id}`} 
                    style={{ width: utilitySize, height: utilitySize }}
                  >
                    <KeyButton
                      button={button}
                      isEditMode={isEditMode}
                      onPress={executeButton}
                      onEdit={handleEdit}
                      onDelete={deleteButton}
                      variant="utility"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Grid */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortedIds} strategy={rectSortingStrategy}>
              <div
                className="grid mx-auto rounded-[24px] bg-white/[0.02] border border-white/[0.06] p-2"
                style={{
                  gap: gap,
                  gridTemplateColumns: `repeat(${gridCols}, ${slotSize}px)`,
                  maxWidth: gridCols * slotSize + (gridCols - 1) * gap + 16,
                }}
              >
                {Array.from({ length: totalSlots }, (_, i) => {
                  const btn = buttonByPosition.get(i);
                  if (btn) {
                    return (
                      <SortableKeyButton
                        key={btn.id}
                        button={btn}
                        isEditMode={isEditMode}
                        onPress={executeButton}
                        onEdit={handleEdit}
                        onDelete={deleteButton}
                      />
                    );
                  }
                  if (isEditMode) {
                    return (
                      <AddButtonSlot
                        key={`add-${i}`}
                        position={i}
                        profileId={activeProfileId ?? 1}
                        onAdd={handleAddAt}
                      />
                    );
                  }
                  // Slot vacío decorativo
                  if (i < baseGridSlots) {
                    return (
                      <div
                        key={`empty-${i}`}
                        className="rounded-2xl bg-white/[0.015] border border-white/[0.04] aspect-square"
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </SortableContext>

            <DragOverlay>
              {dragActiveButton && (
                <div className="opacity-90 scale-105 rotate-1 shadow-2xl">
                  <KeyButton
                    button={dragActiveButton}
                    isEditMode={false}
                    onPress={() => {}}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {editingButton && (
        <ButtonEditor
          button={editingButton}
          onSave={handleSave}
          onCancel={() => setEditingButton(null)}
        />
      )}
    </div>
  );
}

export default App;
