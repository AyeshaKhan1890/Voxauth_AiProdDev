"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";

export type VoxauthTheme = "void" | "ember" | "aurora";

export const themePalettes: Record<VoxauthTheme, { primary: string; secondary: string; tertiary: string; label: string }> = {
  void: { primary: "#59f3e5", secondary: "#8b7cff", tertiary: "#f46fc8", label: "Spectral" },
  ember: { primary: "#ffb35c", secondary: "#ff5f7e", tertiary: "#ff4fd8", label: "Ember" },
  aurora: { primary: "#b7ff5c", secondary: "#38bdf8", tertiary: "#76ffe6", label: "Aurora" },
};

export function useVoxauthTheme() {
  const [theme, setThemeState] = useState<VoxauthTheme>("void");

  useEffect(() => {
    const stored = window.localStorage.getItem("voxauth-theme") as VoxauthTheme | null;
    const valid = stored && Object.hasOwn(themePalettes, stored) ? stored : "void";
    const syncTheme = (event: Event) => {
      const next = (event as CustomEvent<VoxauthTheme>).detail;
      if (Object.hasOwn(themePalettes, next)) setThemeState(next);
    };
    window.addEventListener("voxauth-theme-change", syncTheme);
    const frame = window.requestAnimationFrame(() => {
      setThemeState(valid);
      document.documentElement.dataset.theme = valid;
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("voxauth-theme-change", syncTheme);
    };
  }, []);

  function setTheme(next: VoxauthTheme) {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("voxauth-theme", next);
    window.dispatchEvent(new CustomEvent<VoxauthTheme>("voxauth-theme-change", { detail: next }));
  }

  return { theme, setTheme, palette: themePalettes[theme] };
}

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useVoxauthTheme();

  return (
    <div className={`theme-switcher ${compact ? "theme-switcher-compact" : ""}`}>
      {!compact && <span className="theme-switcher-label"><Palette size={13} /> Atmosphere</span>}
      <div role="group" aria-label="Select color atmosphere">
        {(Object.keys(themePalettes) as VoxauthTheme[]).map((key) => {
          const item = themePalettes[key];
          return (
            <button
              key={key}
              type="button"
              className={theme === key ? "active" : ""}
              onClick={() => setTheme(key)}
              aria-label={`Use ${item.label} theme`}
              aria-pressed={theme === key}
              title={item.label}
              style={{ "--swatch-a": item.primary, "--swatch-b": item.secondary } as React.CSSProperties}
            >
              <i />
              {!compact && <span>{item.label}</span>}
              {theme === key && <Check size={10} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
