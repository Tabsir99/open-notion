// ── Root component ────────────────────────────────────────────────────

import type { JSX } from "react";
import type { DocContent } from "./jsonContent";
import { _renderBlockContent } from "./html";

export async function DocRenderer({
  doc,
  className,
  as: Tag = "div",
}: {
  doc: DocContent;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const inner = await _renderBlockContent(doc.content);
  return (
    <Tag
      className={`${className ?? ""} open-notion-doc`}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
