import {
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  Font,
  Checkbox,
  pdf,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { Style } from "@react-pdf/types";
import type {
  DocContent,
  BlockNode,
  CodeBlockNode,
  InlineNode,
  AnyMark,
  ListItemNode,
  TaskItemNode,
  TableRowNode,
  TableCellNode,
  TableHeaderNode,
} from "../../jsonContent";
import {
  pdfStyles,
  MONO_FAMILY,
  BASE_FONT_SIZE,
  headingFontSize,
  tableCellFontSize,
  ratios,
} from "./pdfStyles";
import { CDN } from "../../utils";
import { getHighlighter } from "../../highlighter";

// ── Buffer shim ──────────────────────────────────────────────────────
// `@react-pdf/layout`'s `fetchImage` calls `Buffer.isBuffer(source)`
// without guarding for the browser. The throw is caught (image still
// loads) but the warning is logged via `console.warn(e.message)`.
// A trivial polyfill silences the noise without pulling in `buffer`.
if (typeof globalThis !== "undefined") {
  const g = globalThis as unknown as { Buffer?: { isBuffer?: unknown } };
  if (g.Buffer == null) g.Buffer = { isBuffer: () => false };
}

// ── Font registration ────────────────────────────────────────────────
// PDF built-in `Courier` is an AFM bitmap-style font and renders poorly
// in viewers. Register a JetBrains Mono TTF served from jsdelivr's GH
// mirror — pinned for cache stability.

const JBM_BASE =
  "https://cdn.jsdelivr.net/gh/JetBrains/JetBrainsMono@v2.304/fonts/ttf";

let _monoRegistered = false;
function ensureMonoRegistered(): void {
  if (_monoRegistered) return;
  _monoRegistered = true;
  Font.register({
    family: MONO_FAMILY,
    fonts: [
      { src: `${JBM_BASE}/JetBrainsMono-Regular.ttf` },
      { src: `${JBM_BASE}/JetBrainsMono-Bold.ttf`, fontWeight: "bold" },
      { src: `${JBM_BASE}/JetBrainsMono-Italic.ttf`, fontStyle: "italic" },
      {
        src: `${JBM_BASE}/JetBrainsMono-BoldItalic.ttf`,
        fontWeight: "bold",
        fontStyle: "italic",
      },
    ],
  });
}

// ── Word breaking ────────────────────────────────────────────────────
// React-PDF's textkit has no `word-break: break-all` style; the only
// hook is a global hyphenation callback. We only split tokens longer
// than 30 chars (well above typical English words) so URLs and code
// identifiers wrap inside the page bounds without affecting normal prose.

let _hyphenRegistered = false;
function ensureHyphenationRegistered(): void {
  if (_hyphenRegistered) return;
  _hyphenRegistered = true;
  Font.registerHyphenationCallback((word: string) => {
    if (word.length <= 30) return [word];
    const parts: string[] = [];
    for (let i = 0; i < word.length; i += 25) {
      parts.push(word.slice(i, i + 25));
    }
    return parts;
  });
}

// Twemoji fallback for raw unicode emojis inside Text
Font.registerEmojiSource({
  format: "png",
  url: `${CDN.twemoji}/72x72/`,
});

interface DocToPDFOptions {
  /** Render task list items as interactive PDF form checkboxes (default: false → static visuals) */
  interactiveCheckboxes?: boolean;
}

// ── Code highlighting (shiki) ────────────────────────────────────────

type CodeToken = { content: string; color?: string; fontStyle?: number };
type CodeLines = CodeToken[][];
type CodeMap = Map<CodeBlockNode, CodeLines>;

const plainLines = (text: string): CodeLines =>
  text.split("\n").map((line) => [{ content: line }]);

function collectCodeBlocks(nodes: BlockNode[], out: CodeBlockNode[]): void {
  for (const n of nodes) {
    if (n.type === "codeBlock") {
      out.push(n);
      continue;
    }
    if (n.type === "blockquote" || n.type === "callout") {
      if (n.content) collectCodeBlocks(n.content, out);
    } else if (n.type === "bulletList" || n.type === "orderedList") {
      for (const item of n.content ?? []) {
        if (item.content) collectCodeBlocks(item.content, out);
      }
    } else if (n.type === "taskList") {
      for (const item of n.content ?? []) {
        if (item.content) collectCodeBlocks(item.content, out);
      }
    } else if (n.type === "table") {
      for (const row of n.content ?? []) {
        for (const cell of row.content ?? []) {
          if (cell.content) collectCodeBlocks(cell.content, out);
        }
      }
    }
  }
}

async function tokenizeCodeBlocks(doc: DocContent): Promise<CodeMap> {
  const map: CodeMap = new Map();
  const codeBlocks: CodeBlockNode[] = [];
  collectCodeBlocks(doc.content, codeBlocks);
  if (codeBlocks.length === 0) return map;

  const cfg = await getHighlighter().catch(() => null);
  if (!cfg) {
    // Fallback: render every block as plain lines so wrapping still works.
    for (const cb of codeBlocks) {
      const text = (cb.content ?? []).map((t) => t.text).join("");
      map.set(cb, plainLines(text));
    }
    return map;
  }
  const loaded = cfg.h.getLoadedLanguages();

  for (const cb of codeBlocks) {
    const lang = cb.attrs.language || "plaintext";
    const text = (cb.content ?? []).map((t) => t.text).join("");
    if (!text) {
      map.set(cb, [[]]);
      continue;
    }
    if (lang === "plaintext" || !loaded.includes(lang)) {
      map.set(cb, plainLines(text));
      continue;
    }
    try {
      const result = cfg.h.codeToTokens(text, {
        lang,
        theme: cfg.lightTheme,
      });
      map.set(cb, result.tokens as CodeLines);
    } catch {
      map.set(cb, plainLines(text));
    }
  }
  return map;
}

// shiki FontStyle bitfield: 1=italic, 2=bold, 4=underline, 8=strikethrough
function fontStyleToCss(bits: number | undefined): Style | undefined {
  if (!bits) return undefined;
  const s: Style = {};
  if (bits & 1) s.fontStyle = "italic";
  if (bits & 2) s.fontWeight = "bold";
  if (bits & 4) s.textDecoration = "underline";
  if (bits & 8) {
    s.textDecoration =
      s.textDecoration === "underline" ? "underline line-through" : "line-through";
  }
  return s;
}

// ── Marks → style array ──────────────────────────────────────────────

const marksToStyle = (marks?: AnyMark[]): Style[] | undefined => {
  if (!marks?.length) return undefined;
  const styles: Style[] = [];
  for (const m of marks) {
    switch (m.type) {
      case "bold":
        styles.push(pdfStyles.bold);
        break;
      case "italic":
        styles.push(pdfStyles.italic);
        break;
      case "strike":
        styles.push(pdfStyles.strike);
        break;
      case "underline":
        styles.push(pdfStyles.underline);
        break;
      case "code":
        styles.push(pdfStyles.inlineCode);
        break;
      case "textStyle": {
        const a = m.attrs;
        if (a?.color) styles.push({ color: a.color });
        if (a?.fontFamily) styles.push({ fontFamily: a.fontFamily });
        if (a?.fontSize) styles.push({ fontSize: parseInt(a.fontSize, 10) });
        break;
      }
    }
  }
  return styles;
};

// EmojiNode `hexId` is a hyphen-joined sequence of codepoints
// (e.g. "1F600", "1F468-200D-1F4BB"). Convert to the actual unicode
// string so `Font.registerEmojiSource` can match and substitute it.
const hexIdToUnicode = (hexId: string): string =>
  hexId
    .split("-")
    .map((cp) => String.fromCodePoint(parseInt(cp, 16)))
    .join("");

// ── Inline ───────────────────────────────────────────────────────────
// `fs` is the *effective* font size of the surrounding text — used to
// size emoji to 1.2× the parent font (matches doc.css `1.2em`). Each
// block that changes fontSize (headings, table cells, captions, etc.)
// passes its own value down.

const renderInline = (
  node: InlineNode,
  key: number,
  fs: number,
): ReactNode => {
  switch (node.type) {
    case "text": {
      const linkMark = node.marks?.find(
        (m): m is Extract<AnyMark, { type: "link" }> => m.type === "link",
      );
      const style = marksToStyle(node.marks?.filter((m) => m.type !== "link"))!;

      if (linkMark) {
        return (
          <Link
            key={key}
            src={linkMark.attrs.href}
            style={[pdfStyles.link, ...(style ?? [])]}
          >
            {node.text}
          </Link>
        );
      }
      return (
        <Text key={key} style={style}>
          {node.text}
        </Text>
      );
    }
    case "hardBreak":
      return <Text key={key}>{"\n"}</Text>;
    case "emoji": {
      // Render the actual unicode char inside a Text and let
      // `Font.registerEmojiSource` substitute it. That path sets
      // `yOffset ≈ 0.1 × size` so the image is vertically centered on
      // the text — the bare `<Image>` path leaves yOffset=0 (bottom on
      // baseline). Bumping fontSize controls the rendered emoji size.
      const size = fs * ratios.emoji;
      return (
        <Text key={key} style={{ fontSize: size }}>
          {hexIdToUnicode(node.attrs.hexId)}
        </Text>
      );
    }
  }
};

const renderInlines = (nodes: InlineNode[] | undefined, fs: number) =>
  nodes?.map((n, i) => renderInline(n, i, fs));

// ── Code block ───────────────────────────────────────────────────────

const renderCodeBlock = (
  node: CodeBlockNode,
  key: number,
  isFirst: boolean,
  codeMap: CodeMap,
): ReactNode => {
  const lines =
    codeMap.get(node) ??
    plainLines((node.content ?? []).map((t) => t.text).join(""));

  return (
    <View
      key={key}
      style={[pdfStyles.codeBlock, isFirst ? pdfStyles.firstBlock : {}]}
    >
      {lines.map((line, i) => (
        <Text key={i} style={pdfStyles.codeLine}>
          {line.length === 0
            ? " "
            : line.map((tok, j) => {
                const styleParts: Style[] = [];
                if (tok.color) styleParts.push({ color: tok.color });
                const fs = fontStyleToCss(tok.fontStyle);
                if (fs) styleParts.push(fs);
                return (
                  <Text key={j} style={styleParts}>
                    {tok.content}
                  </Text>
                );
              })}
        </Text>
      ))}
    </View>
  );
};

// ── Blocks ───────────────────────────────────────────────────────────
// `fs` is the *effective* font size for inline content in this block.
// Body blocks (paragraph, blockquote, callout body, list items, etc.)
// inherit it; headings and table cells override with their own size so
// inline emoji scales correctly inside them.

const renderBlock = (
  node: BlockNode,
  key: number,
  isFirst: boolean,
  opts: DocToPDFOptions,
  codeMap: CodeMap,
  fs: number = BASE_FONT_SIZE,
): ReactNode => {
  switch (node.type) {
    case "paragraph":
      return (
        <Text
          key={key}
          style={[pdfStyles.paragraph, isFirst ? pdfStyles.firstBlock : {}]}
        >
          {renderInlines(node.content, fs)}
        </Text>
      );

    case "heading": {
      const level = `h${node.attrs.level}` as "h2" | "h3" | "h4";
      const headingFs = headingFontSize(node.attrs.level);
      return (
        <Text
          key={key}
          style={[pdfStyles[level], isFirst ? pdfStyles.firstBlock : {}]}
        >
          {renderInlines(node.content, headingFs)}
        </Text>
      );
    }

    case "blockquote":
      return (
        <View key={key} style={pdfStyles.blockquote}>
          {node.content?.map((c, i) =>
            renderBlock(c, i, false, opts, codeMap, fs),
          )}
        </View>
      );

    case "codeBlock":
      return renderCodeBlock(node, key, isFirst, codeMap);

    case "horizontalRule":
      return <View key={key} style={pdfStyles.hr} />;

    case "image": {
      if (!node.attrs.src) return null;
      const align = node.attrs.align;
      const alignStyle =
        align === "left"
          ? pdfStyles.imageLeft
          : align === "right"
            ? pdfStyles.imageRight
            : align === "full"
              ? pdfStyles.imageFull
              : pdfStyles.imageCenter;
      return (
        <View key={key} style={pdfStyles.figure} wrap={false}>
          <Image src={node.attrs.src} style={[pdfStyles.image, alignStyle]} />
          {node.attrs.caption && (
            <Text style={pdfStyles.caption}>{node.attrs.caption}</Text>
          )}
        </View>
      );
    }

    case "callout": {
      return (
        <View key={key} style={pdfStyles.callout}>
          <Image
            src={`${CDN.twemoji}/72x72/${node.attrs.hexId}.png`}
            style={pdfStyles.calloutIcon}
          />
          <View style={pdfStyles.calloutBody}>
            {node.content?.map((c, i) =>
              renderBlock(c, i, true, opts, codeMap, fs),
            )}
          </View>
        </View>
      );
    }

    case "bulletList":
      return renderList(node.content ?? [], false, 1, key, opts, codeMap, fs);

    case "orderedList":
      return renderList(
        node.content ?? [],
        true,
        node.attrs.start,
        key,
        opts,
        codeMap,
        fs,
      );

    case "taskList":
      return (
        <View key={key} style={pdfStyles.list}>
          {node.content?.map((item, i) =>
            renderTaskItem(item, i, opts, codeMap, fs),
          )}
        </View>
      );

    case "table":
      return renderTable(node.content ?? [], key, opts, codeMap);
  }
};

// ── Lists ────────────────────────────────────────────────────────────

const renderList = (
  items: ListItemNode[],
  ordered: boolean,
  start: number,
  key: number,
  opts: DocToPDFOptions,
  codeMap: CodeMap,
  fs: number,
) => (
  <View key={key} style={pdfStyles.list}>
    {items.map((item, i) => (
      <View key={i} style={pdfStyles.listItem}>
        <Text style={pdfStyles.listMarker}>
          {ordered ? `${start + i}.` : "•"}
        </Text>
        <View style={pdfStyles.listContent}>
          {item.content?.map((c, j) =>
            renderBlock(c, j, true, opts, codeMap, fs),
          )}
        </View>
      </View>
    ))}
  </View>
);

const renderTaskItem = (
  item: TaskItemNode,
  key: number,
  opts: DocToPDFOptions,
  codeMap: CodeMap,
  fs: number,
) => (
  <View key={key} style={pdfStyles.taskItem}>
    {opts.interactiveCheckboxes ? (
      <Checkbox
        defaultValue={item.attrs.checked ? 1 : 0}
        readOnly
        style={pdfStyles.checkbox}
      />
    ) : (
      <View
        style={[
          pdfStyles.checkbox,
          item.attrs.checked ? pdfStyles.checkboxChecked : {},
        ]}
      >
        {item.attrs.checked && <Text style={pdfStyles.checkmark}>✓</Text>}
      </View>
    )}
    <View style={pdfStyles.taskContent}>
      {item.content?.map((c, i) =>
        renderBlock(c, i, true, opts, codeMap, fs),
      )}
    </View>
  </View>
);

// ── Table ────────────────────────────────────────────────────────────

const renderTable = (
  rows: TableRowNode[],
  key: number,
  opts: DocToPDFOptions,
  codeMap: CodeMap,
) => (
  <View key={key} style={pdfStyles.table}>
    {rows.map((row, i) => {
      const isLastRow = i === rows.length - 1;
      const cells = row.content ?? [];
      const isHeaderRow = cells.every((c) => c.type === "tableHeader");
      return (
        <View
          key={i}
          wrap={false}
          style={[pdfStyles.tableRow, isLastRow ? pdfStyles.tableRowLast : {}]}
        >
          {cells.map((cell, j) =>
            renderTableCell(
              cell,
              j,
              j === cells.length - 1,
              isHeaderRow,
              opts,
              codeMap,
            ),
          )}
        </View>
      );
    })}
  </View>
);

const renderTableCell = (
  cell: TableCellNode | TableHeaderNode,
  key: number,
  isLast: boolean,
  isHeaderRow: boolean,
  opts: DocToPDFOptions,
  codeMap: CodeMap,
) => (
  <View
    key={key}
    style={[
      pdfStyles.tableCell,
      isLast ? pdfStyles.tableCellLast : {},
      isHeaderRow || cell.type === "tableHeader" ? pdfStyles.tableHeader : {},
    ]}
  >
    {cell.content?.map((c, i) =>
      renderBlock(c, i, true, opts, codeMap, tableCellFontSize),
    )}
  </View>
);

// ── Public API ───────────────────────────────────────────────────────

const DocComponent = ({
  doc,
  opts,
  codeMap,
}: {
  doc: DocContent;
  opts: DocToPDFOptions;
  codeMap: CodeMap;
}) => (
  <Document>
    <Page size="A4" style={pdfStyles.page} wrap>
      {doc.content.map((block, i) =>
        renderBlock(block, i, i === 0, opts, codeMap),
      )}
    </Page>
  </Document>
);

export const docToPDF = async (
  doc: DocContent,
  options: DocToPDFOptions = {},
): Promise<Blob> => {
  ensureMonoRegistered();
  ensureHyphenationRegistered();
  const codeMap = await tokenizeCodeBlocks(doc);
  return pdf(
    <DocComponent doc={doc} opts={options} codeMap={codeMap} />,
  ).toBlob();
};
