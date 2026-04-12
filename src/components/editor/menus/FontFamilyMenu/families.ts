export interface FamilyOption {
  id: string;
  label: string;
  /** CSS font-family stack applied to the block */
  value: string;
}

export const fontFamilies: FamilyOption[] = [
  { id: "default", label: "Default", value: "" },
  {
    id: "serif",
    label: "Serif",
    value: "'Georgia', 'Times New Roman', serif",
  },
  {
    id: "mono",
    label: "Mono",
    value: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },
  {
    id: "sans-rounded",
    label: "Rounded",
    value: "'Nunito', 'Quicksand', system-ui, sans-serif",
  },
  {
    id: "display",
    label: "Display",
    value: "'Playfair Display', 'Libre Baskerville', serif",
  },
  {
    id: "slab",
    label: "Slab",
    value: "'Roboto Slab', 'Courier Prime', serif",
  },
  {
    id: "handwriting",
    label: "Handwriting",
    value: "'Caveat', 'Patrick Hand', cursive",
  },
] as const satisfies FamilyOption[];
