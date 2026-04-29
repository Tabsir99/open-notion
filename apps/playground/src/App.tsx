import { OpenNotion } from "@open-notion/editor";

function App() {
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <OpenNotion storageKey="oeditor" />
    </main>
  );
}

export default App;
