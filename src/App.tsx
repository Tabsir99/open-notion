import { OpenNotion } from "./components/editor/Editor";

function App() {
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <OpenNotion storageKey="oeditor" />
    </main>
  );
}

export default App;
