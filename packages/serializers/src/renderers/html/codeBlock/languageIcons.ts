const DEVICON_BASE =
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

const languageIconPaths = {
  plaintext: "markdown/markdown-original",
  javascript: "javascript/javascript-original",
  typescript: "typescript/typescript-original",
  python: "python/python-original",
  html: "html5/html5-original",
  css: "css3/css3-original",
  json: "json/json-original",
  bash: "bash/bash-original",
  sql: "mysql/mysql-original",
  go: "go/go-original-wordmark",
  rust: "rust/rust-original",
  yaml: "yaml/yaml-original",
  markdown: "markdown/markdown-original",
  dockerfile: "docker/docker-original",
} as const;

type Language = keyof typeof languageIconPaths;

export const languageIconUrls = Object.fromEntries(
  Object.entries(languageIconPaths).map(([id, path]) => [
    id,
    `${DEVICON_BASE}/${path}.svg`,
  ]),
) as Record<Language, string>;

export function getLanguageIconUrl(lang: string): string {
  const key = (lang || "").trim().toLowerCase() as Language;
  return languageIconUrls[key] ?? languageIconUrls.plaintext;
}
