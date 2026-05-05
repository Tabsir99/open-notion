import { StyleSheet } from "@react-pdf/renderer";

export const tokens = {
  // Colors
  text: "#1f2328",
  textMuted: "#59636e",
  textFaint: "#818b98",
  bg: "#ffffff",
  bgSubtle: "#f6f8fa",
  bgCode: "#f6f8fa",
  bgCallout: "#f6f8fa",
  border: "#d1d9e0",
  borderStrong: "#b6bcc4",
  accent: "#0969da",

  // Typography
  fontSans: "Helvetica",
  fontMono: "Courier",
  fontSize: 11,
  leading: 1.55,

  // Spacing
  blockGap: 9,
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
  h1: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 22,
    marginBottom: 6,
    letterSpacing: -0.5,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 6,
    letterSpacing: -0.3,
    lineHeight: 1.25,
  },
  h3: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 4,
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
    fontSize: 10,
    backgroundColor: tokens.bgCode,
    color: tokens.text,
  },

  // ── Code block ──
  codeBlock: {
    marginTop: tokens.blockGap,
    padding: 12,
    backgroundColor: tokens.bgCode,
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: 4,
    fontFamily: tokens.fontMono,
    fontSize: 10,
    lineHeight: 1.5,
  },

  // ── Blockquote ──
  blockquote: {
    marginTop: tokens.blockGap,
    paddingLeft: 14,
    paddingVertical: 2,
    borderLeftWidth: 3,
    borderLeftColor: tokens.borderStrong,
    color: tokens.textMuted,
  },

  // ── Horizontal rule ──
  hr: {
    marginVertical: 22,
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
    fontSize: 9,
    color: tokens.textMuted,
    textAlign: "center",
  },

  // ── Callout ──
  callout: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
    marginTop: tokens.blockGap,
    backgroundColor: tokens.bgCallout,
    borderWidth: 1,
    borderColor: tokens.border,
    borderRadius: 4,
  },
  calloutIcon: { width: 16, height: 16, flexShrink: 0, marginTop: 1 },
  calloutBody: { flex: 1 },

  // ── Lists ──
  list: { marginTop: tokens.blockGap, paddingLeft: 4 },
  nestedList: { marginTop: 3, marginLeft: 14 },
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
    width: 11,
    height: 11,
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
    marginTop: tokens.blockGap,
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
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: tokens.border,
  },
  tableCellLast: { borderRightWidth: 0 },
  tableHeader: {
    backgroundColor: tokens.bgSubtle,
    fontWeight: "bold",
  },

  // ── Emoji ──
  emojiImage: { width: 12, height: 12 },
});
