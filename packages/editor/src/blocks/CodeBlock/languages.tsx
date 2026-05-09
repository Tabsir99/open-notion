import { useEffect, useState, type FC } from "react";

type IconComp = FC<{ size?: number }>;

export interface Language {
  id: string;
  name: string;
}

export const languages: Language[] = [
  { id: "plaintext", name: "Plain Text" },
  { id: "javascript", name: "JavaScript" },
  { id: "typescript", name: "TypeScript" },
  { id: "python", name: "Python" },
  { id: "html", name: "HTML" },
  { id: "css", name: "CSS" },
  { id: "json", name: "JSON" },
  { id: "bash", name: "Bash" },
  { id: "sql", name: "SQL" },
  { id: "go", name: "Go" },
  { id: "rust", name: "Rust" },
  { id: "yaml", name: "YAML" },
  { id: "markdown", name: "Markdown" },
  { id: "dockerfile", name: "Dockerfile" },
];

export function getLanguage(id: string) {
  return languages.find((l) => l.id === id) || languages[0];
}

let iconsPromise: Promise<Record<string, IconComp>> | null = null;
function loadIcons() {
  if (!iconsPromise) {
    iconsPromise = import("./languageIcons.lazy") as Promise<
      Record<string, IconComp>
    >;
  }
  return iconsPromise;
}

export function useLanguageIcon(id: string): IconComp | null {
  const [Icon, setIcon] = useState<IconComp | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadIcons().then((mod) => {
      if (cancelled) return;
      const key = id === "plaintext" ? "markdown" : id;
      const Comp = mod[key];
      if (Comp) setIcon(() => Comp);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);
  return Icon;
}
