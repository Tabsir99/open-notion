import type { DocContent, InlineNode, TextNode, TocItem } from "../jsonContent";

function extractText(content: InlineNode[] = []): string {
  return content
    .filter((n): n is TextNode => n.type === "text")
    .map((n) => n.text)
    .join("");
}

export function docToToc(doc: DocContent): TocItem[] {
  const headings = doc.content.filter((node) => node.type === "heading");

  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const heading of headings) {
    const item: TocItem = {
      id: heading.attrs.id,
      level: heading.attrs.level,
      text: extractText(heading.content),
      children: [],
    };

    while (stack.length && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }

    stack.push(item);
  }

  return root;
}
