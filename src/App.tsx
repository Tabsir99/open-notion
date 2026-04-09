import { EmojiPickerDrawer } from "./components/editor/blocks/EmojiPicker";
import { Editor } from "./components/editor/Editor";
import { Button } from "./components/ui/button";

function App() {
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <Editor />

      <EmojiPickerDrawer onEmojiSelect={() => {}}>
        <Button>Open</Button>
      </EmojiPickerDrawer>
    </main>
  );
}

export default App;
