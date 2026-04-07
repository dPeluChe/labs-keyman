import * as LucideIcons from "lucide-react";

interface DynamicIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function DynamicIcon({ name, size = 20, className }: DynamicIconProps) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>
  const IconComponent = icons[name];
  if (!IconComponent) {
    const Fallback = LucideIcons.Zap;
    return <Fallback size={size} className={className} />;
  }
  return <IconComponent size={size} className={className} />;
}
