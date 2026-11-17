"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Clair", Icon: SunIcon },
  { value: "dark", label: "Sombre", Icon: MoonIcon },
  { value: "system", label: "Système", Icon: MonitorIcon },
] as const;

const subscribe = () => () => {};

export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // Le thème n'est connu que dans le navigateur : aucun bouton n'est actif au rendu serveur.
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <div
      role="group"
      aria-label="Thème"
      className={cn("inline-flex gap-1 rounded-full border bg-card p-1", className)}
    >
      {options.map(({ value, label, Icon }) => {
        const active = isClient && theme === value;
        return (
          <Button
            key={value}
            size="sm"
            variant={active ? "default" : "ghost"}
            aria-pressed={active}
            onClick={() => setTheme(value)}
          >
            <Icon data-icon="inline-start" aria-hidden />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
