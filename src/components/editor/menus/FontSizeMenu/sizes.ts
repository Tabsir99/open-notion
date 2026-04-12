export interface SizeOption {
  id: string;
  label: string;
  /** CSS font-size value applied to the block */
  value: string;
}

export const fontSizes: SizeOption[] = [
  { id: "default", label: "Default", value: "" },
  { id: "12", label: "Small", value: "12px" },
  { id: "14", label: "Compact", value: "14px" },
  { id: "16", label: "Body", value: "16px" },
  { id: "18", label: "Large", value: "18px" },
  { id: "20", label: "Heading S", value: "20px" },
  { id: "24", label: "Heading M", value: "24px" },
  { id: "30", label: "Heading L", value: "30px" },
  { id: "36", label: "Title", value: "36px" },
  { id: "48", label: "Display", value: "48px" },
] as const satisfies SizeOption[];
