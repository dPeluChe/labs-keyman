import { create } from "zustand";
import { api } from "./api";
import type { Button, Profile } from "./types";

interface KeymanStore {
  profiles: Profile[];
  activeProfileId: number | null;
  buttons: Button[];
  isEditMode: boolean;
  isLoading: boolean;
  gridCols: number;
  alwaysOnTop: boolean;
  autoMode: boolean;
  contextApp: string;

  loadProfiles: () => Promise<void>;
  loadButtons: (profileId: number) => Promise<void>;
  setActiveProfile: (id: number) => Promise<void>;
  saveButton: (button: Button) => Promise<void>;
  deleteButton: (id: number) => Promise<void>;
  addProfile: (name: string, color: string) => Promise<void>;
  deleteProfile: (id: number) => Promise<void>;
  setEditMode: (v: boolean) => void;
  setGridCols: (cols: number) => void;
  toggleAlwaysOnTop: () => void;
  executeButton: (button: Button) => Promise<void>;
  reorderButtons: (orderedIds: number[]) => Promise<void>;
  registerShortcuts: () => Promise<void>;
  setProfileTrigger: (id: number, trigger: string) => Promise<void>;
  toggleAutoMode: () => Promise<void>;
  handleContextChange: (appName: string) => Promise<void>;
}

export const useKeymanStore = create<KeymanStore>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  buttons: [],
  isEditMode: false,
  isLoading: false,
  gridCols: 3,
  alwaysOnTop: true,
  autoMode: false,
  contextApp: "",

  loadProfiles: async () => {
    set({ isLoading: true });
    const profiles = await api.getProfiles();
    const active = profiles.find((p) => p.is_active) ?? profiles[0];
    set({ profiles, activeProfileId: active?.id ?? null, isLoading: false });
    if (active) {
      await get().loadButtons(active.id);
    }
  },

  loadButtons: async (profileId: number) => {
    const buttons = await api.getButtons(profileId);
    set({ buttons });
  },

  setActiveProfile: async (id: number) => {
    await api.activateProfile(id);
    set((s) => ({
      activeProfileId: id,
      profiles: s.profiles.map((p) => ({ ...p, is_active: p.id === id })),
    }));
    await get().loadButtons(id);
  },

  saveButton: async (button: Button) => {
    const savedId = await api.saveButton(button);
    const updated = { ...button, id: savedId };
    set((s) => {
      const existing = s.buttons.find((b) => b.id === savedId);
      if (existing) {
        return { buttons: s.buttons.map((b) => (b.id === savedId ? updated : b)) };
      }
      return { buttons: [...s.buttons, updated] };
    });
  },

  deleteButton: async (id: number) => {
    await api.removeButton(id);
    set((s) => ({ buttons: s.buttons.filter((b) => b.id !== id) }));
  },

  addProfile: async (name: string, color: string) => {
    const id = await api.createProfile(name, color);
    await get().loadProfiles();
    await get().setActiveProfile(id);
  },

  deleteProfile: async (id: number) => {
    await api.removeProfile(id);
    const { profiles, activeProfileId: _activeProfileId } = get();
    const remaining = profiles.filter((p) => p.id !== id);
    if (remaining.length > 0) {
      const next = remaining[0];
      await get().setActiveProfile(next.id);
    }
    set({ profiles: remaining });
  },

  setEditMode: (v) => set({ isEditMode: v }),

  setGridCols: (cols) => {
    set({ gridCols: cols });
    api.setSetting("grid_cols", String(cols));
  },

  toggleAlwaysOnTop: () => {
    const next = !get().alwaysOnTop;
    set({ alwaysOnTop: next });
    api.toggleAlwaysOnTop(next);
  },

  executeButton: async (button: Button) => {
    if (!button.enabled) return;
    await api.executeButtonAction(
      button.action_type,
      button.action_value,
      button.action_modifier,
    );
  },

  reorderButtons: async (orderedIds: number[]) => {
    await api.reorderButtons(orderedIds);
    set((s) => {
      const idToBtn = new Map(s.buttons.map((b) => [b.id, b]));
      const reordered = orderedIds
        .map((id, pos) => {
          const b = idToBtn.get(id);
          return b ? { ...b, position: pos } : null;
        })
        .filter((b): b is Button => b !== null);
      return { buttons: reordered };
    });
  },

  registerShortcuts: async () => {
    await api.registerGlobalShortcuts();
  },

  setProfileTrigger: async (id: number, trigger: string) => {
    await api.setProfileTrigger(id, trigger);
    set((s) => ({
      profiles: s.profiles.map((p) =>
        p.id === id ? { ...p, app_trigger: trigger } : p
      ),
    }));
  },

  toggleAutoMode: async () => {
    const next = !get().autoMode;
    set({ autoMode: next });
    if (next) {
      await api.startContextWatcher();
    } else {
      await api.stopContextWatcher();
      set({ contextApp: "" });
    }
  },

  handleContextChange: async (appName: string) => {
    set({ contextApp: appName });
    if (!get().autoMode) return;
    const profiles = get().profiles;
    const match = profiles.find(
      (p) => p.app_trigger && appName.toLowerCase().includes(p.app_trigger.toLowerCase())
    );
    if (match && match.id !== get().activeProfileId) {
      await get().setActiveProfile(match.id);
    } else if (!match) {
      const def = profiles.find((p) => p.app_trigger === "");
      if (def && def.id !== get().activeProfileId) {
        await get().setActiveProfile(def.id);
      }
    }
  },
}));
