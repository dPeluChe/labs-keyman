import { useEffect, useState } from "react";
import { api } from "../api";

const iconCache = new Map<string, string | null>();
const pending = new Set<string>();

export function useAppIcon(appName: string | null): string | null {
  const [icon, setIcon] = useState<string | null>(
    appName ? (iconCache.get(appName) ?? null) : null
  );

  useEffect(() => {
    if (!appName) return;
    if (iconCache.has(appName)) {
      setIcon(iconCache.get(appName) ?? null);
      return;
    }
    if (pending.has(appName)) return;

    pending.add(appName);
    api.getAppIcon(appName).then((result) => {
      iconCache.set(appName, result ?? null);
      pending.delete(appName);
      setIcon(result ?? null);
    }).catch(() => {
      iconCache.set(appName, null);
      pending.delete(appName);
    });
  }, [appName]);

  return icon;
}
