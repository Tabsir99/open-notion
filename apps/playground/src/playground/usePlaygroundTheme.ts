import { useEffect, useState } from "react";

export type PlaygroundTheme = "light" | "dark";

function readInitialTheme(): PlaygroundTheme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("playground-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function usePlaygroundTheme() {
  const [theme, setTheme] = useState<PlaygroundTheme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("playground-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggleTheme, setTheme };
}
