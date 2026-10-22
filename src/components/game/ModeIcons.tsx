"use client";

import {
  Crown,
  Zap,
  Flame,
  Sparkles,
  Medal,
  Star,
  Sprout,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  crown: Crown,
  zap: Zap,
  flame: Flame,
  sparkles: Sparkles,
  medal: Medal,
  star: Star,
  seedling: Sprout,
  trophy: Trophy,
};

export function ModeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Crown;
  return <Icon className={className} />;
}
