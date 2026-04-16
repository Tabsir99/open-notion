// editor-store.ts
import { useSyncExternalStore } from "react";
import type { Editor } from "@tiptap/core";

export interface ActiveBlock {
  element: HTMLElement;
  pos: number;
  nodeType: string;
}

interface EditorStoreState {
  editor: Editor | null;
  editorContainer: HTMLElement | null;
  activeBlock: ActiveBlock | null;
}

function createEditorStore() {
  let state: EditorStoreState = {
    editor: null,
    activeBlock: null,
    editorContainer: null,
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
export const useActiveBlock = () => useEditorStore((s) => s.activeBlock);
