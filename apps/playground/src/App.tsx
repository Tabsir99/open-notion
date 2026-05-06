import type { ComponentType } from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PlaygroundWorkspace } from "./playground/PlaygroundWorkspace";
import "@open-notion/assets/hydration.js";
import { Button } from "@/components/ui/button";

function LoadingFallback() {
  return (
    <div className="flex h-dvh w-dvw items-center justify-center bg-background text-4xl text-foreground">
      Loading…
    </div>
  );
}

type RoutePath = "/" | "/random";

function readHashRoute(): RoutePath {
  const raw = window.location.hash.replace(/^#/, "");
  if (raw === "/random") return "/random";
  return "/";
}

function RandomPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-dvh w-dvw flex-col items-center justify-center gap-4 bg-background text-foreground">
      <div className="text-lg font-semibold tracking-tight">Random page</div>
      <Button type="button" variant="outline" onClick={onBack}>
        Back to editor
      </Button>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState<RoutePath>(() => readHashRoute());

  useEffect(() => {
    const onHashChange = () => setRoute(readHashRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useMemo(() => {
    return (path: RoutePath) => {
      window.location.hash = path;
    };
  }, []);

  const RoutedPlaygroundWorkspace = PlaygroundWorkspace as ComponentType<{
    onGoToRandomPage: () => void;
  }>;

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        {route === "/random" ? (
          <RandomPage onBack={() => navigate("/")} />
        ) : (
          <RoutedPlaygroundWorkspace
            onGoToRandomPage={() => navigate("/random")}
          />
        )}
      </Suspense>
    </>
  );
}

export default App;
