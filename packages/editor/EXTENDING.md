# Extending `@open-notion/editor`

The editor ships a closed set of default blocks (paragraph, heading,
callout, image, code block, lists, tables, …) but its type system is **open
at the registry level**. You can add your own block / inline node and get
the same type safety internal blocks have:

- `editor.isActive("yourBlock")` narrows by name
- `editor.getJSON().content` can include your node
- `createNode({ name: "yourBlock", … })` autocompletes; typos error
- `NodeView`'s `node.attrs` is typed against your shape
- Inside `addCommands` / `addKeyboardShortcuts` / `addProseMirrorPlugins`
  / `onCreate` / `onUpdate` / etc., `this.editor` is `TypedEditor` —
  `this.editor.isActive("yourBlock")` works without casting

The mechanism is TypeScript **declaration merging** against open
interfaces (`BlockNodeDefs`, `InlineNodeDefs`, `MarkDefs`) exported from
`@open-notion/serializers`, plus Tiptap's own `Commands` augmentation.

---

## Adding a custom block

### 1. Declare the JSON shape

Pick the right registry:

- `BlockNodeDefs` — a block-level node (renders as a block; lives in
  `DocContent.content`).
- `InlineNodeDefs` — an inline node (lives inside paragraphs/headings).
- `MarkDefs` — a mark (text-level styling like bold or link).

```ts
import type { BlockAttrs, InlineNode } from "@open-notion/editor";

declare module "@open-notion/serializers" {
  interface BlockNodeDefs {
    githubLink: {
      type: "githubLink";
      attrs: BlockAttrs & { url: string; pr?: number };
      content?: InlineNode[];
    };
  }
}
```

After this one declaration:

- `NodeName` includes `"githubLink"`.
- `NodeAttrs["githubLink"]` is the consumer's attrs shape.
- `editor.isActive("githubLink")` is typed.
- `editor.getJSON().content` can include `githubLink` nodes.

Fully non-breaking — existing types stay identical until you add an entry.

### 2. Build the extension

Use `defineBlock` (alias of `createNode` with richer JSDoc). The `name`
autocompletes from the registry, `addAttributes` is checked against your
attrs shape, and `NodeView`'s `node.attrs` is typed.

```tsx
import { defineBlock } from "@open-notion/editor";

export const GithubLink = defineBlock({
  name: "githubLink",
  group: "inline",
  inline: true,

  addAttributes: () => ({
    url: { default: "" },
    pr:  { default: null },
  }),

  addCommands() {
    return {
      setGithubLink:
        (url: string) =>
        ({ commands }) =>
          commands.insertContent({ type: "githubLink", attrs: { url } }),
    };
  },

  NodeView: ({ node }) => (
    <a href={node.attrs.url}>{node.attrs.url}</a>
  ),
});
```

### 3. (Optional) Augment Tiptap `Commands` for chain support

Without this, `editor.commands.setGithubLink(...)` is typed but
`editor.chain().setGithubLink(...).run()` is not.

```ts
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    githubLink: {
      setGithubLink: (url: string) => ReturnType;
    };
  }
}
```

### 4. Plug into the editor

```tsx
import { useOpenNotion, OpenNotionView } from "@open-notion/editor";
import { GithubLink } from "./GithubLink";

function MyEditor() {
  const editor = useOpenNotion({
    extensions: (defaults) => [...defaults, GithubLink],
    slashItems: (defaults) => [
      ...defaults,
      {
        id: "github-link",
        title: "GitHub link",
        icon: GitPullRequestIcon,
        group: "Embed",
        action: (editor, range) =>
          editor.chain().focus().deleteRange(range).setGithubLink("").run(),
      },
    ],
  });
  return <OpenNotionView editor={editor} />;
}
```

---

## Extending a default block

Use `extendNode` to add attributes, commands, or NodeView behavior to an
existing default block without re-implementing it.

```ts
import { extendNode } from "@open-notion/editor";
import { Heading as DefaultHeading } from "@tiptap/extension-heading";

declare module "@open-notion/serializers" {
  interface BlockNodeDefs {
    // Re-declare heading with the added attr — interface merging unions
    // attrs across declarations.
    heading: {
      type: "heading";
      attrs: BlockAttrs & { level: 2 | 3 | 4; id: string; anchor?: string };
      content?: InlineNode[];
    };
  }
}

export const Heading = extendNode<"heading">(
  DefaultHeading,
  {
    addAttributes: (parent) => ({
      ...parent(),
      anchor: { default: null },
    }),
  },
);
```

---

## Marks

Marks already use the same registry pattern via `MarkDefs`. To add a
custom mark:

```ts
declare module "@open-notion/serializers" {
  interface MarkDefs {
    highlight: { attrs: { color: string } };
  }
}
```

Then build the Tiptap mark extension as usual and pass it through
`extensions`.

---

## What's not extensible (today)

- **The `content?: string` schema string** stays as `string` — ProseMirror's
  content-expression grammar is too involved to encode in template-literal
  types. Runtime errors from invalid content expressions still surface
  from ProseMirror.
- **No runtime plugin registry.** Type extension is declaration-merging
  only; runtime composition flows through the `extensions` /
  `slashItems` / `turnIntoItems` resolvers on `useOpenNotion`.
- **No resolver hooks for bubble-menu or block-side-menu items** — they're
  currently hardcoded. Open an issue if you need them.

---

## Why declaration merging, not a generic parameter

A generic-parameter approach (e.g.,
`useOpenNotion<{ githubLink: { url: string } }>(...)`) would require every
consumer call site to thread the type through. Declaration merging is a
**one-time, project-wide** registration that flows through every API
surface automatically. It's the pattern Tiptap itself uses for `Commands`
and that ecosystems like React Router and tRPC use for routes / procedures.
