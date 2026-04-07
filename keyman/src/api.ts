import { invoke } from "@tauri-apps/api/core";
import type { Button, InstalledApp, Profile } from "./types";

export const api = {
  getProfiles: () => invoke<Profile[]>("get_profiles"),
  getButtons: (profileId: number) => invoke<Button[]>("get_buttons", { profileId }),
  saveButton: (button: Button) => invoke<number>("save_button", { button }),
  removeButton: (id: number) => invoke<void>("remove_button", { id }),
  createProfile: (name: string, color: string) => invoke<number>("create_profile", { name, color }),
  removeProfile: (id: number) => invoke<void>("remove_profile", { id }),
  activateProfile: (id: number) => invoke<void>("activate_profile", { id }),
  getSetting: (key: string) => invoke<string | null>("get_setting", { key }),
  setSetting: (key: string, value: string) => invoke<void>("set_setting", { key, value }),
  executeButtonAction: (actionType: string, actionValue: string, actionModifier: string) =>
    invoke<void>("execute_button_action", { actionType, actionValue, actionModifier }),
  toggleAlwaysOnTop: (value: boolean) => invoke<void>("toggle_always_on_top", { value }),
  minimizeWindow: () => invoke<void>("minimize_window"),
  closeWindow: () => invoke<void>("close_window"),
  reorderButtons: (orderedIds: number[]) => invoke<void>("reorder_buttons", { orderedIds }),
  scanInstalledApps: () => invoke<InstalledApp[]>("scan_installed_apps"),
  getAppIcon: (appName: string) => invoke<string | null>("get_app_icon", { appName }),
  registerGlobalShortcuts: () => invoke<void>("register_global_shortcuts"),
  setProfileTrigger: (id: number, trigger: string) => invoke<void>("set_profile_trigger", { id, trigger }),
  startContextWatcher: () => invoke<void>("start_context_watcher"),
  stopContextWatcher: () => invoke<void>("stop_context_watcher"),
  isContextWatcherRunning: () => invoke<boolean>("is_context_watcher_running"),
  getFrontmostApp: () => invoke<string | null>("get_frontmost_app"),
  setWindowMinSize: (width: number, height: number) => 
    invoke<void>("set_window_min_size", { width, height }),
};
