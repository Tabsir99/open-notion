import { OpenNotionView, useOpenNotion } from "@open-notion/editor";
import { FPSMonitor } from "./_dev/fps";

function App() {
  const editor = useOpenNotion({ storageKey: "oeditor" });
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <OpenNotionView editor={editor} />
      <FPSMonitor />
    </main>
  );
}

export default App;
