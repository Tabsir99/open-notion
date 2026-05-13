import { StyleSheet } from "@react-pdf/renderer";

/** Family name we register a TTF mono font under (see index.tsx). */
export const MONO_FAMILY = "OpenNotionMono";

/**
 * Base font size in points. Everything that should scale with reading
 * size (headings, code, emoji, table cells, captions…) is derived from
 * this. Bumping this rescales typography but leaves spacing alone.
 */
export const BASE_FONT_SIZE = 12;

/**
 * Spacing scale in points — intentionally decoupled from font size.
 * Block gaps, heading top margins, padding, and similar live here so
 * you can tune density without changing reading size (and vice versa).
 */
const SP = 10;

/**
 * Type ratios — mirror doc.css `em`/`rem` values. Heading ratios are
 * deliberately a bit smaller than their CSS twins because PDF renders
 * at print scale where a `2.4×` heading feels heavier than on screen.
 */
export const ratios = {
  // Heading sizes — doc.css styles `h1`/`h2`/`h3`, the editor emits
  // JSON levels 2/3/4 (UI labels 1/2/3). Original doc.css ratios were
  // 2.4 / 1.75 / 1.2 — tightened here.
  heading: { 2: 1.85, 3: 1.42, 4: 1.15 } as const,
  // doc.css `[data-type="emoji"] img { width: 1.2em }`
  emoji: 1.2,
  // doc.css `.callout [data-type="emoji"] img { width: 1.35rem }` — toned
  // down so the icon doesn't dwarf body text in print.
  calloutEmoji: 1.2,
  // doc.css `:not(pre) > code { font-size: 0.875em }`
  inlineCode: 0.875,
  // doc.css `pre { font-size: 0.875em }`
  code: 0.875,
  // doc.css `figcaption { font-size: 0.875rem }`
  caption: 0.85,
  // doc.css `table { font-size: 0.95em }`
  tableCell: 0.92,
} as const;

/** PDF font size for a heading at the given JSON level. */
export const headingFontSize = (level: 2 | 3 | 4): number =>
  BASE_FONT_SIZE * ratios.heading[level];

export const codeFontSize = BASE_FONT_SIZE * ratios.code;
export const inlineCodeFontSize = BASE_FONT_SIZE * ratios.inlineCode;
export const captionFontSize = BASE_FONT_SIZE * ratios.caption;
export const tableCellFontSize = BASE_FONT_SIZE * ratios.tableCell;
export const calloutEmojiSize = BASE_FONT_SIZE * ratios.calloutEmoji;

export const tokens = {
  // Colors — mirrors doc.css `--ond-*` tokens (light variant)
  text: "#0d1117",
  textMuted: "#5b6573",
  textFaint: "#8e96a3",
  bg: "#ffffff",
  bgSubtle: "#f6f8fa",
  bgCode: "#f6f8fa",
  bgCallout: "#eef1ff",
  border: "#d7dbe1",
  borderStrong: "#b6bcc4",
  accent: "#4f62ef",

  // Typography
  fontSans: "Helvetica",
  fontMono: MONO_FAMILY,
  fontSize: BASE_FONT_SIZE,
  leading: 1.65, // doc.css `--ond-leading: 1.65`

  // Spacing — pt values driven by `SP`, not `BASE_FONT_SIZE`. Same
  // numeric feel as before when base was 10pt.
  blockGap: SP * 1.05,
  blockGapLg: SP * 1.6,
} as const;

export const pdfStyles = StyleSheet.create({
  // ── Page ──
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: tokens.fontSans,
    fontSize: tokens.fontSize,
    color: tokens.text,
    lineHeight: tokens.leading,
    backgroundColor: tokens.bg,
  },

  // ── Headings ──
  h2: {
    fontSize: headingFontSize(2),
    fontWeight: "bold",
    marginTop: SP * 2.4,
    marginBottom: 0,
    letterSpacing: -0.5,
    lineHeight: 1.2,
  },
  h3: {
    fontSize: headingFontSize(3),
    fontWeight: "bold",
    marginTop: SP * 1.95,
    marginBottom: 0,
    letterSpacing: -0.3,
    lineHeight: 1.25,
  },
  h4: {
    fontSize: headingFontSize(4),
    fontWeight: "bold",
    marginTop: SP * 1.55,
    marginBottom: 0,
    lineHeight: 1.3,
  },
  // First-child reset (apply manually on first node)
  firstBlock: { marginTop: 0 },

  // ── Paragraph ──
  paragraph: { marginTop: tokens.blockGap },

  // ── Inline marks (merge into Text style) ──
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
  strike: { textDecoration: "line-through" },
  underline: { textDecoration: "underline" },
  link: { color: tokens.accent, textDecoration: "underline" },
  inlineCode: {
    fontFamily: tokens.fontMono,
    fontSize: inlineCodeFontSize,
    backgroundColor: tokens.bgCode,
    color: tokens.text,
  },

  // ── Code block ──
  // No `wrap={false}` on the View — long blocks need to split across pages.
  codeBlock: {
    marginTop: tokens.blockGapLg,
    paddingVertical: SP,
    paddingHorizontal: SP * 1.25,
    backgroundColor: tokens.bgCode,
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: 4,
    fontFamily: tokens.fontMono,
    fontSize: codeFontSize,
    lineHeight: 1.55,
  },
  codeLine: {
    fontFamily: tokens.fontMono,
    fontSize: codeFontSize,
    lineHeight: 1.55,
    color: tokens.text,
  },

  // ── Blockquote ──
  blockquote: {
    marginTop: tokens.blockGap,
    paddingLeft: SP,
    paddingVertical: 2,
    borderLeftWidth: 3,
    borderLeftColor: tokens.borderStrong,
    color: tokens.textMuted,
  },

  // ── Horizontal rule ──
  hr: {
    marginVertical: SP * 2,
    height: 1,
    backgroundColor: tokens.border,
  },

  // ── Image / figure ──
  figure: { marginTop: tokens.blockGap, alignItems: "center" },
  image: { width: "100%", borderRadius: 4, objectFit: "contain" },
  imageLeft: { alignSelf: "flex-start", width: "60%" },
  imageRight: { alignSelf: "flex-end", width: "60%" },
  imageCenter: { alignSelf: "center", width: "80%" },
  imageFull: { width: "100%" },
  caption: {
    marginTop: 6,
    fontSize: captionFontSize,
    color: tokens.textMuted,
    textAlign: "center",
  },

  // ── Callout ──
  callout: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
    marginTop: tokens.blockGapLg,
    backgroundColor: tokens.bgCallout,
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: 4,
  },
  // 1.35rem in doc.css — absolute relative to root, not the body text.
  calloutIcon: {
    width: calloutEmojiSize,
    height: calloutEmojiSize,
    flexShrink: 0,
    marginTop: 1,
  },
  calloutBody: { flex: 1 },

  // ── Lists ──
  list: { marginTop: tokens.blockGap, paddingLeft: 4 },
  nestedList: { marginTop: 3, marginLeft: SP },
  listItem: { flexDirection: "row", marginBottom: 3 },
  listMarker: { width: 18, color: tokens.text },
  listContent: { flex: 1 },

  // ── Task list ──
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 3,
  },
  checkbox: {
    width: SP,
    height: SP,
    marginTop: 3,
    borderWidth: 1,
    borderColor: tokens.borderStrong,
    borderRadius: 2,
    backgroundColor: tokens.bg,
  },
  checkboxChecked: {
    backgroundColor: tokens.accent,
    borderColor: tokens.accent,
  },
  checkmark: {
    color: "#fff",
    fontSize: 9,
    textAlign: "center",
    lineHeight: 1,
    fontWeight: "bold",
  },
  taskContent: { flex: 1 },

  // ── Table ──
  table: {
    marginTop: tokens.blockGapLg,
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: tokens.border,
  },
  tableRowLast: { borderBottomWidth: 0 },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: tableCellFontSize,
    borderRightWidth: 1,
    borderRightColor: tokens.border,
  },
  tableCellLast: { borderRightWidth: 0 },
  tableHeader: {
    backgroundColor: tokens.bgSubtle,
    fontWeight: "bold",
  },
});
