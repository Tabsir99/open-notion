import Javascript from "@devicon/react/javascript/original";
import Typescript from "@devicon/react/typescript/original";
import PlainText from "@devicon/react/markdown/original";
import Python from "@devicon/react/python/original";
import Html from "@devicon/react/html5/original";
import Css from "@devicon/react/css3/original";
import Json from "@devicon/react/json/original";
import Bash from "@devicon/react/bash/original";
import Sql from "@devicon/react/mysql/original";
import Java from "@devicon/react/java/original";
import C from "@devicon/react/c/original";
import Cpp from "@devicon/react/cplusplus/original";
import Csharp from "@devicon/react/csharp/original";
import Go from "@devicon/react/go/original-wordmark";
import Rust from "@devicon/react/rust/original";
import Ruby from "@devicon/react/ruby/original";
import Php from "@devicon/react/php/original";
import Swift from "@devicon/react/swift/original";
import Kotlin from "@devicon/react/kotlin/original";
import Yaml from "@devicon/react/yaml/original";
import Markdown from "@devicon/react/markdown/original";
import Graphql from "@devicon/react/graphql/plain";
import Dockerfile from "@devicon/react/docker/original";

export interface Language {
  id: string;
  name: string;
  icon: typeof Javascript;
}

/** Pre-loaded at init for instant highlighting — keep this list small */
export const preloadLangs = [
  "javascript",
  "typescript",
  "python",
  "html",
  "css",
  "json",
  "bash",
  "rust",
] as const;

/** All supported languages (others loaded on demand when selected) */
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
  { id: "java", name: "Java", icon: Java },
  { id: "c", name: "C", icon: C },
  { id: "cpp", name: "C++", icon: Cpp },
  { id: "csharp", name: "C#", icon: Csharp },
  { id: "go", name: "Go", icon: Go },
  { id: "rust", name: "Rust", icon: Rust },
  { id: "ruby", name: "Ruby", icon: Ruby },
  { id: "php", name: "PHP", icon: Php },
  { id: "swift", name: "Swift", icon: Swift },
  { id: "kotlin", name: "Kotlin", icon: Kotlin },
  { id: "yaml", name: "YAML", icon: Yaml },
  { id: "markdown", name: "Markdown", icon: Markdown },
  { id: "graphql", name: "GraphQL", icon: Graphql },
  { id: "dockerfile", name: "Dockerfile", icon: Dockerfile },
];

export function getLanguage(id: string): Language {
  return languages.find((l) => l.id === id)!;
}
