import { OpenNotionView, useOpenNotion } from "@open-notion/editor";

function App() {
  const editor = useOpenNotion({ storageKey: "oeditor" });
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <OpenNotionView editor={editor} />
    </main>
  );
}

export default App;
