// ── Notion-style color definitions ────────────────────────────────────

export interface ColorOption {
  id: string;
  label: string;
  /** The actual CSS color value applied to the editor content */
  value: string;
  swatch?: string;
}

// ── Text colors ──────────────────────────────────────────────────────

export const textColors = [
  {
    id: "default",
    label: "Default",
    value: "",
  },
  { id: "gray", label: "Gray", value: "#9b9a97" },
  { id: "brown", label: "Brown", value: "#64473a" },
  { id: "orange", label: "Orange", value: "#d9730d" },
  { id: "yellow", label: "Yellow", value: "#dfab01" },
  { id: "green", label: "Green", value: "#0f7b6c" },
  { id: "blue", label: "Blue", value: "#0b6e99" },
  { id: "purple", label: "Purple", value: "#6940a5" },
  { id: "pink", label: "Pink", value: "#ad1a72" },
  { id: "red", label: "Red", value: "#e03e3e" },
] as const satisfies ColorOption[];

// ── Background colors ────────────────────────────────────────────────

export const bgColors = [
  {
    id: "bg-default",
    label: "Default",
    value: "",
    swatch: "var(--editor-surface)",
  },
  { id: "bg-gray", label: "Gray", value: "#ebeced" },
  { id: "bg-brown", label: "Brown", value: "#e9e5e3" },
  { id: "bg-orange", label: "Orange", value: "#faebdd" },
  { id: "bg-yellow", label: "Yellow", value: "#fbf3db" },
  { id: "bg-green", label: "Green", value: "#ddedea" },
  { id: "bg-blue", label: "Blue", value: "#ddebf1" },
  { id: "bg-purple", label: "Purple", value: "#eae4f2" },
  { id: "bg-pink", label: "Pink", value: "#f4dfeb" },
  { id: "bg-red", label: "Red", value: "#fbe4e4" },
] as const satisfies ColorOption[];
