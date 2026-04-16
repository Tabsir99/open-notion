// editor-store.ts
import { useSyncExternalStore } from "react";
import type { TypedEditor } from "./types";

export interface NodeBlock {
  element: HTMLElement;
  pos: number;
  nodeType: string;
}

interface EditorStoreState {
  editor: TypedEditor | null;
  editorContainer: HTMLElement | null;
  hoveredBlock: NodeBlock | null;
  focusedBlock: NodeBlock | null;
}

function createEditorStore() {
  let state: EditorStoreState = {
    editor: null,
    hoveredBlock: null,
    editorContainer: null,
    focusedBlock: null,
  };
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());

  return {
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    set(partial: Partial<EditorStoreState>) {
      const entries = Object.entries(partial) as [
        keyof EditorStoreState,
        unknown,
      ][];
      const changed = entries.some(([k, v]) => state[k] !== v);
      if (!changed) return;
      state = { ...state, ...partial };
      notify();
    },
    get: () => state,
  };
}

export const editorStore = createEditorStore();

export function useEditorStore<T>(selector: (s: EditorStoreState) => T): T {
  return useSyncExternalStore(editorStore.subscribe, () =>
    selector(editorStore.get()),
  );
}

export const useEditor = () => useEditorStore((s) => s.editor);
