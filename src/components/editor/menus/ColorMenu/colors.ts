// ── Notion-style color definitions ────────────────────────────────────

export interface ColorOption {
  id: string;
  label: string;
  /** The actual CSS color value applied to the editor content */
  value: string | null;
  /** Swatch color shown in the menu UI (may differ from the applied value for legibility) */
  swatch: string;
}

// ── Text colors ──────────────────────────────────────────────────────

export const textColors: ColorOption[] = [
  {
    id: "default",
    label: "Default",
    value: null,
    swatch: "var(--editor-text)",
  },
  { id: "gray", label: "Gray", value: "#9b9a97", swatch: "#9b9a97" },
  { id: "brown", label: "Brown", value: "#64473a", swatch: "#64473a" },
  { id: "orange", label: "Orange", value: "#d9730d", swatch: "#d9730d" },
  { id: "yellow", label: "Yellow", value: "#dfab01", swatch: "#dfab01" },
  { id: "green", label: "Green", value: "#0f7b6c", swatch: "#0f7b6c" },
  { id: "blue", label: "Blue", value: "#0b6e99", swatch: "#0b6e99" },
  { id: "purple", label: "Purple", value: "#6940a5", swatch: "#6940a5" },
  { id: "pink", label: "Pink", value: "#ad1a72", swatch: "#ad1a72" },
  { id: "red", label: "Red", value: "#e03e3e", swatch: "#e03e3e" },
];

// ── Background colors ────────────────────────────────────────────────

export const bgColors: ColorOption[] = [
  {
    id: "bg-default",
    label: "Default",
    value: null,
    swatch: "transparent",
  },
  {
    id: "bg-gray",
    label: "Gray",
    value: "#ebeced",
    swatch: "#ebeced",
  },
  {
    id: "bg-brown",
    label: "Brown",
    value: "#e9e5e3",
    swatch: "#e9e5e3",
  },
  {
    id: "bg-orange",
    label: "Orange",
    value: "#faebdd",
    swatch: "#faebdd",
  },
  {
    id: "bg-yellow",
    label: "Yellow",
    value: "#fbf3db",
    swatch: "#fbf3db",
  },
  {
    id: "bg-green",
    label: "Green",
    value: "#ddedea",
    swatch: "#ddedea",
  },
  {
    id: "bg-blue",
    label: "Blue",
    value: "#ddebf1",
    swatch: "#ddebf1",
  },
  {
    id: "bg-purple",
    label: "Purple",
    value: "#eae4f2",
    swatch: "#eae4f2",
  },
  {
    id: "bg-pink",
    label: "Pink",
    value: "#f4dfeb",
    swatch: "#f4dfeb",
  },
  {
    id: "bg-red",
    label: "Red",
    value: "#fbe4e4",
    swatch: "#fbe4e4",
  },
];
