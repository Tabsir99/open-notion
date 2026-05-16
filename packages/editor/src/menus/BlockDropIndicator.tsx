import { useEditorRuntime } from "../context";

export function BlockDropIndicator() {
  const dropTarget = useEditorRuntime((s) => s.dropTarget);
  const container = useEditorRuntime((s) => s.editorContainer);
  if (!dropTarget || !container) return null;

  const blockRect = dropTarget.element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return (
    <div
      className="pointer-events-none absolute rounded-md bg-blue-500/10 ring-1 ring-blue-500/30"
      style={{
        top: blockRect.top - containerRect.top,
        left: blockRect.left - containerRect.left,
        width: blockRect.width,
        height: blockRect.height,
      }}
    />
  );
}
