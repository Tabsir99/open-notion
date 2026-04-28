import Javascript from "@devicon/react/javascript/original";
import Typescript from "@devicon/react/typescript/original";
import Python from "@devicon/react/python/original";
import Html from "@devicon/react/html5/original";
import Css from "@devicon/react/css3/original";
import Json from "@devicon/react/json/original";
import Bash from "@devicon/react/bash/original";
import Sql from "@devicon/react/mysql/original";
import Go from "@devicon/react/go/original-wordmark";
import Rust from "@devicon/react/rust/original";
import Yaml from "@devicon/react/yaml/original";
import Markdown from "@devicon/react/markdown/original";
import Dockerfile from "@devicon/react/docker/original";
import PlainText from "@devicon/react/markdown/original";

export interface Language {
  id: string;
  name: string;
  icon: React.FC<any>;
}

export const languages: Language[] = [
  { id: "plaintext", name: "Plain Text", icon: PlainText },
  { id: "javascript", name: "JavaScript", icon: Javascript },
  { id: "typescript", name: "TypeScript", icon: Typescript },
  { id: "python", name: "Python", icon: Python },
  { id: "html", name: "HTML", icon: Html },
  { id: "css", name: "CSS", icon: Css },
  { id: "json", name: "JSON", icon: Json },
  { id: "bash", name: "Bash", icon: Bash },
  { id: "sql", name: "SQL", icon: Sql },
  { id: "go", name: "Go", icon: Go },
  { id: "rust", name: "Rust", icon: Rust },
  { id: "yaml", name: "YAML", icon: Yaml },
  { id: "markdown", name: "Markdown", icon: Markdown },
  { id: "dockerfile", name: "Dockerfile", icon: Dockerfile },
];

export function getLanguage(id: string) {
  return languages.find((l) => l.id === id) || languages[0];
}
