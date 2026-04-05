import { createContext, useContext, type ReactNode } from 'react'
import { Editor } from '@tiptap/core'

const EditorContext = createContext<Editor | null>(null)

export function EditorProvider({ editor, children }: { editor: Editor | null, children: ReactNode }) {
  return (
    <EditorContext.Provider value={editor}>
      {children}
    </EditorContext.Provider>
  )
}

export function useCurrentEditor() {
  return useContext(EditorContext)
}
