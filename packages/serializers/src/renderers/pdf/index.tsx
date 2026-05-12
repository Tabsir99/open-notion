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
  InlineNode,
  AnyMark,
  ListItemNode,
  TaskItemNode,
  TableRowNode,
  TableCellNode,
  TableHeaderNode,
} from "../../jsonContent";
import { pdfStyles } from "./pdfStyles";
import { CDN } from "../../utils";

// Register Twemoji as fallback for raw unicode emojis in text
Font.registerEmojiSource({
  format: "png",
  url: `${CDN.twemoji}/72x72/`,
});

interface DocToPDFOptions {
  /** Render task list items as interactive PDF form checkboxes (default: false → static visuals) */
  interactiveCheckboxes?: boolean;
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

// ── Inline ───────────────────────────────────────────────────────────

const renderInline = (node: InlineNode, key: number): ReactNode => {
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
    case "emoji":
      return (
        <Image
          key={key}
          src={`${CDN.twemoji}/72x72/${node.attrs.hexId.toLowerCase()}.png`}
          style={pdfStyles.emojiImage}
        />
      );
  }
};

const renderInlines = (nodes?: InlineNode[]) =>
  nodes?.map((n, i) => renderInline(n, i));

// ── Blocks ───────────────────────────────────────────────────────────

const renderBlock = (
  node: BlockNode,
  key: number,
  isFirst: boolean,
  opts: DocToPDFOptions,
): ReactNode => {
  switch (node.type) {
    case "paragraph":
      return (
        <Text
          key={key}
          style={[pdfStyles.paragraph, isFirst ? pdfStyles.firstBlock : {}]}
        >
          {renderInlines(node.content)}
        </Text>
      );

    case "heading": {
      const level = `h${node.attrs.level}` as keyof typeof pdfStyles;

      return (
        <Text
          key={key}
          style={[pdfStyles[level], isFirst ? pdfStyles.firstBlock : {}]}
        >
          {renderInlines(node.content)}
        </Text>
      );
    }

    case "blockquote":
      return (
        <View key={key} style={pdfStyles.blockquote}>
          {node.content?.map((c, i) => renderBlock(c, i, false, opts))}
        </View>
      );

    case "codeBlock":
      return (
        <View key={key} style={pdfStyles.codeBlock} wrap={false}>
          <Text>{node.content?.map((t) => t.text).join("") ?? ""}</Text>
        </View>
      );

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
        <View key={key} style={pdfStyles.callout} wrap={false}>
          <Image
            src={`${CDN.twemoji}/72x72/${node.attrs.hexId}.png`}
            style={pdfStyles.calloutIcon}
          />
          <View style={pdfStyles.calloutBody}>
            {node.content?.map((c, i) => renderBlock(c, i, true, opts))}
          </View>
        </View>
      );
    }

    case "bulletList":
      return renderList(node.content ?? [], false, 1, key, opts);

    case "orderedList":
      return renderList(node.content ?? [], true, node.attrs.start, key, opts);

    case "taskList":
      return (
        <View key={key} style={pdfStyles.list}>
          {node.content?.map((item, i) => renderTaskItem(item, i, opts))}
        </View>
      );

    case "table":
      return renderTable(node.content ?? [], key, opts);
  }
};

// ── Lists ────────────────────────────────────────────────────────────

const renderList = (
  items: ListItemNode[],
  ordered: boolean,
  start: number,
  key: number,
  opts: DocToPDFOptions,
) => (
  <View key={key} style={pdfStyles.list}>
    {items.map((item, i) => (
      <View key={i} style={pdfStyles.listItem}>
        <Text style={pdfStyles.listMarker}>
          {ordered ? `${start + i}.` : "•"}
        </Text>
        <View style={pdfStyles.listContent}>
          {item.content?.map((c, j) => renderBlock(c, j, true, opts))}
        </View>
      </View>
    ))}
  </View>
);

const renderTaskItem = (
  item: TaskItemNode,
  key: number,
  opts: DocToPDFOptions,
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
      {item.content?.map((c, i) => renderBlock(c, i, true, opts))}
    </View>
  </View>
);

// ── Table ────────────────────────────────────────────────────────────

const renderTable = (
  rows: TableRowNode[],
  key: number,
  opts: DocToPDFOptions,
) => (
  <View key={key} style={pdfStyles.table} wrap={false}>
    {rows.map((row, i) => {
      const isLastRow = i === rows.length - 1;
      const cells = row.content ?? [];
      const isHeaderRow = cells.every((c) => c.type === "tableHeader");
      return (
        <View
          key={i}
          style={[pdfStyles.tableRow, isLastRow ? pdfStyles.tableRowLast : {}]}
        >
          {cells.map((cell, j) =>
            renderTableCell(cell, j, j === cells.length - 1, isHeaderRow, opts),
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
) => (
  <View
    key={key}
    style={[
      pdfStyles.tableCell,
      isLast ? pdfStyles.tableCellLast : {},
      isHeaderRow || cell.type === "tableHeader" ? pdfStyles.tableHeader : {},
    ]}
  >
    {cell.content?.map((c, i) => renderBlock(c, i, true, opts))}
  </View>
);

// ── Public API ───────────────────────────────────────────────────────

const DocComponent = ({
  doc,
  opts,
}: {
  doc: DocContent;
  opts: DocToPDFOptions;
}) => (
  <Document>
    <Page size="A4" style={pdfStyles.page} wrap>
      {doc.content.map((block, i) => renderBlock(block, i, i === 0, opts))}
    </Page>
  </Document>
);

export const docToPDF = async (
  doc: DocContent,
  options: DocToPDFOptions = {},
): Promise<Blob> => pdf(<DocComponent doc={doc} opts={options} />).toBlob();
