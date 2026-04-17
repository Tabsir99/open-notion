// components/ui/popover-arrow.tsx

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

interface PopoverArrowProps {
  facing: Side; // which direction the arrow points outward
  align?: Align; // where along that edge it sits
  size?: number;
  offset?: number; // fine-tune position along the edge (px)
  className?: string;
}

export function PopoverArrow({
  facing,
  align = "center",
  size = 13,
  offset = 0,
  className = "",
}: PopoverArrowProps) {
  const isHorizontal = facing === "left" || facing === "right";

  const clipWidth = isHorizontal ? size / 2 : size;
  const clipHeight = isHorizontal ? size : size / 2;

  // Position along the edge based on align + offset
  const alignStyle = (): React.CSSProperties => {
    if (isHorizontal) {
      if (align === "start") return { top: offset };
      if (align === "end") return { bottom: offset };
      return { top: "50%", transform: `translateY(calc(-50% + ${offset}px))` };
    } else {
      if (align === "start") return { left: offset };
      if (align === "end") return { right: offset };
      return { left: "50%", transform: `translateX(calc(-50% + ${offset}px))` };
    }
  };

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    width: clipWidth,
    height: clipHeight,
    overflow: "hidden",
    pointerEvents: "none",
    ...(facing === "left" && { right: "100%" }),
    ...(facing === "right" && { left: "100%" }),
    ...(facing === "top" && { bottom: "100%" }),
    ...(facing === "bottom" && { top: "100%" }),
    ...alignStyle(),
  };

  const squareStyle: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    transform: "rotate(45deg)",
    ...(facing === "left" && { right: -(size / 2), top: 0 }),
    ...(facing === "right" && { left: -(size / 2), top: 0 }),
    ...(facing === "top" && { bottom: -(size / 2), left: 0 }),
    ...(facing === "bottom" && { top: -(size / 2), left: 0 }),
  };

  return (
    <div style={containerStyle} className={className}>
      <div
        style={squareStyle}
        className="bg-background border border-border shadow-[inherit]"
      />
    </div>
  );
}
