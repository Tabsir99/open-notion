import { Suspense } from "react";
import { PlaygroundWorkspace } from "./playground/PlaygroundWorkspace";

function LoadingFallback() {
  return (
    <div className="flex h-dvh w-dvw items-center justify-center bg-background text-4xl text-foreground">
      Loading…
    </div>
  );
}

function App() {
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <PlaygroundWorkspace />
      </Suspense>
      {/* <FPSMonitor /> */}
    </>
  );
}

export default App;
