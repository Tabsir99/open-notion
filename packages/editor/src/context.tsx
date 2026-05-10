import { createContext, useContext, useSyncExternalStore } from "react";
import type { TypedEditor } from "./types";
import {
  getRuntime,
  EMPTY_RUNTIME_STATE,
  type EditorRuntime,
  type EditorRuntimeState,
} from "./runtime";

export const EditorContext = createContext<TypedEditor | null>(null);

export function useEditor(): TypedEditor | null {
  return useContext(EditorContext);
}

const NOOP_SUBSCRIBE: EditorRuntime["subscribe"] = () => () => {};

/**
 * Subscribe to a slice of the per-editor runtime state.
 *
 * Reads the editor handle from {@link EditorContext}, then subscribes to that
 * editor's `editor.storage.openNotion` store via `useSyncExternalStore`. Two
 * editors in one tree have independent stores and listener sets.
 */
export function useEditorRuntime<T>(
  selector: (state: EditorRuntimeState) => T,
): T {
  const editor = useEditor();
  const runtime = editor ? getRuntime(editor) : null;

  return useSyncExternalStore(
    runtime?.subscribe ?? NOOP_SUBSCRIBE,
    () => selector(runtime?.get() ?? EMPTY_RUNTIME_STATE),
    () => selector(EMPTY_RUNTIME_STATE),
  );
}

/** Backwards-compatible alias. Same hook, older name used by menu code. */
export const useEditorStore = useEditorRuntime;
