import React, { useEffect, useRef, useState } from "react";

export const accentThemes = [
  { id: "indigo", label: "Indigo", description: "Default · calm and focused", color: "#5b50dc", alt: "#7c3aed" },
  { id: "blue", label: "Ocean", description: "Clean corporate blue", color: "#2563eb", alt: "#0ea5e9" },
  { id: "violet", label: "Violet", description: "Creative and modern", color: "#7c3aed", alt: "#c026d3" },
  { id: "emerald", label: "Emerald", description: "Fresh and balanced", color: "#059669", alt: "#0d9488" },
  { id: "rose", label: "Rose", description: "Warm and energetic", color: "#e11d48", alt: "#db2777" },
  { id: "orange", label: "Sunset", description: "Bright and friendly", color: "#ea580c", alt: "#f59e0b" },
  { id: "slate", label: "Graphite", description: "Neutral and minimal", color: "#334155", alt: "#0f172a" },
];

const STORAGE_KEY = "notes-accent-theme";
const DEFAULT_THEME = "indigo";

export function getStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return accentThemes.some((theme) => theme.id === stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(themeId) {
  document.documentElement.dataset.accent = themeId;
  try {
    window.localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this visit.
  }
  window.dispatchEvent(new CustomEvent("accent-theme-change", { detail: themeId }));
}

export function useAccentTheme() {
  const [theme, setTheme] = useState(getStoredTheme);
  useEffect(() => {
    const handleChange = (event) => setTheme(event.detail);
    window.addEventListener("accent-theme-change", handleChange);
    return () => window.removeEventListener("accent-theme-change", handleChange);
  }, []);
  return [theme, applyTheme];
}

const PaletteIcon = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.9 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z" />
    <circle cx="7.5" cy="11" r="1.2" /><circle cx="10.5" cy="7.2" r="1.2" /><circle cx="15" cy="7.5" r="1.2" />
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);

const gradientOf = (option) => `linear-gradient(135deg, ${option.color}, ${option.alt})`;

// Compact list used in the header and login popovers.
function ThemeList({ onPick }) {
  const [theme, setTheme] = useAccentTheme();
  return (
    <div className="theme-list" role="radiogroup" aria-label="Theme color">
      {accentThemes.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={theme === option.id}
          className="theme-list-item"
          onClick={() => { setTheme(option.id); onPick?.(); }}
        >
          <span className="theme-chip" style={{ background: gradientOf(option) }} />
          <span className="theme-list-text"><strong>{option.label}</strong><small>{option.description}</small></span>
          <span className="theme-list-check">{theme === option.id && <CheckIcon />}</span>
        </button>
      ))}
    </div>
  );
}

// Preview cards used on the Settings page.
export function ThemeSwatches() {
  const [theme, setTheme] = useAccentTheme();
  return (
    <div className="theme-cards" role="radiogroup" aria-label="Theme color">
      {accentThemes.map((option) => (
        <button key={option.id} type="button" role="radio" aria-checked={theme === option.id} className="theme-card" onClick={() => setTheme(option.id)}>
          <span className="theme-card-preview" aria-hidden="true">
            <span className="theme-card-sidebar"><i style={{ background: option.color }} /><i /><i /></span>
            <span className="theme-card-body">
              <span className="theme-card-bar" style={{ background: gradientOf(option) }} />
              <span className="theme-card-line" />
              <span className="theme-card-line short" />
              <span className="theme-card-button" style={{ background: option.color }} />
            </span>
          </span>
          <span className="theme-card-footer">
            <span className="theme-chip small" style={{ background: gradientOf(option) }} />
            <strong>{option.label}</strong>
            {theme === option.id && <span className="theme-card-check"><CheckIcon size={13} /></span>}
          </span>
        </button>
      ))}
    </div>
  );
}

export function ThemePicker({ className = "", showLabel = false }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useAccentTheme();
  const containerRef = useRef(null);
  const current = accentThemes.find((option) => option.id === theme) || accentThemes[0];

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === "keydown" ? event.key === "Escape" : !containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div className={`theme-picker ${className}`} ref={containerRef}>
      <button type="button" className="theme-picker-trigger" aria-label="Customize theme color" title="Customize theme color" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {showLabel ? <span className="theme-chip small" style={{ background: gradientOf(current) }} /> : <PaletteIcon />}
        {showLabel && <span>{current.label}</span>}
      </button>
      {open && (
        <div className="theme-picker-popover" role="dialog" aria-label="Appearance">
          <header className="theme-popover-header">
            <strong>Appearance</strong>
            <span>Choose an accent color for the whole app</span>
          </header>
          <ThemeList />
          <footer className="theme-popover-footer">
            <span>Saved on this device</span>
            <button type="button" disabled={theme === DEFAULT_THEME} onClick={() => setTheme(DEFAULT_THEME)}>Reset to default</button>
          </footer>
        </div>
      )}
    </div>
  );
}
