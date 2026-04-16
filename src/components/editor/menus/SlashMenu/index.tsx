import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Suggestion } from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { filterSlashItems, groupItems, type SlashItem } from "./slash-items";
import { editorStore } from "../../store";

const PLUGIN_KEY = new PluginKey("slashCommand");

type State = {
  open: boolean;
  items: SlashItem[];
  selectedIndex: number;
  clientRect: DOMRect | null;
  range: { from: number; to: number } | null;
};

const INITIAL: State = {
  open: false,
  items: [],
  selectedIndex: 0,
  clientRect: null,
  range: null,
};

function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export function SlashMenu() {
  const [state, setState] = useState<State>(INITIAL);
  const latest = useLatest(state);
  const listRef = useRef<HTMLDivElement>(null);

  const close = () => setState((s) => ({ ...s, open: false }));

  useEffect(() => {
    const { editor } = editorStore.get();
    if (!editor) return;

    const plugin = Suggestion<SlashItem, SlashItem>({
      editor: editor as any,
      char: "/",
      pluginKey: PLUGIN_KEY,
      shouldResetDismissed: () => false,
      items: ({ query }) => filterSlashItems(query),
      render: () => ({
        onStart: (p) => {
          setState({
            open: true,
            items: p.items,
            selectedIndex: 0,
            clientRect: p.clientRect?.() ?? null,
            range: p.range,
          });
        },
        onUpdate: (p) => {
          setState((s) => ({
            open: true,
            items: p.items,
            selectedIndex: Math.min(
              s.selectedIndex,
              Math.max(0, p.items.length - 1),
            ),
            clientRect: p.clientRect?.() ?? null,
            range: p.range,
          }));
        },
        onExit: () => {
          setState((s) => ({ ...s, open: false, range: null }));
        },
        onKeyDown: ({ event }) => {
          const { items, selectedIndex, range } = latest.current;
          if (!items.length) return false;

          switch (event.key) {
            case "ArrowDown":
              event.preventDefault();
              setState((s) => ({
                ...s,
                selectedIndex: (s.selectedIndex + 1) % items.length,
              }));
              return true;
            case "ArrowUp":
              event.preventDefault();
              setState((s) => ({
                ...s,
                selectedIndex:
                  (s.selectedIndex - 1 + items.length) % items.length,
              }));
              return true;
            case "Enter":
              event.preventDefault();
              items[selectedIndex].action(editor, range!);
              return true;
            case "Escape":
              close();
              return true;
            default:
              return false;
          }
        },
      }),
    });

    editor.registerPlugin(plugin, (p, plugins) => [p, ...plugins]);
    return () => {
      editor.unregisterPlugin(PLUGIN_KEY);
    };
  }, []);

  useLayoutEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>("[data-selected=true]")
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [state.selectedIndex]);

  const anchor = useMemo(
    () => ({ getBoundingClientRect: () => state.clientRect ?? new DOMRect() }),
    [state.clientRect],
  );

  const groups = useMemo(() => groupItems(state.items), [state.items]);

  const indexById = useMemo(() => {
    const m = new Map<string, number>();
    state.items.forEach((it, i) => m.set(it.id, i));
    return m;
  }, [state.items]);

  const selectedId = state.items[state.selectedIndex]?.id;

  return (
    <Popover
      open={state.open}
      onOpenChange={(o) => !o && close()}
      modal={false}
    >
      <PopoverContent
        anchor={anchor}
        initialFocus={false}
        finalFocus={false}
        side="bottom"
        align="start"
        sideOffset={6}
        className="p-1 w-64 max-h-80 overflow-y-auto no-scrollbar"
      >
        <div ref={listRef}>
          {groups.map((group, i) => (
            <div key={group.label}>
              {i !== 0 && <Separator className="mb-1 mt-2.5" />}
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {group.label}
              </div>
              {group.items.map((item) => {
                const selected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-selected={selected}
                    className={cn(
                      "flex items-center gap-3 w-full px-2 py-1.5 rounded-md text-sm text-left transition-colors duration-200",
                      selected && "bg-accent",
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const { editor } = editorStore.get();
                      if (!editor) return;
                      item.action(editor, latest.current.range!);
                    }}
                    onPointerMove={(e) => {
                      if (e.movementX === 0 && e.movementY === 0) return;
                      const idx = indexById.get(item.id);
                      if (idx !== undefined && idx !== state.selectedIndex) {
                        setState((s) => ({ ...s, selectedIndex: idx }));
                      }
                    }}
                  >
                    <div className="flex items-center justify-center size-7 rounded-md shrink-0 bg-muted ring-1 ring-border">
                      <item.icon className="size-4" strokeWidth={1.5} />
                    </div>
                    <span className="font-normal truncate">{item.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
