/**
 * Slim Link mark.
 *
 * Derived from @tiptap/extension-link (MIT — Copyright (c) 2025 Tiptap GmbH).
 * Reuses the autolink/click-handler/paste-handler shape and the
 * combineTransactionSteps/getChangedRanges/findChildrenInRange flow.
 * Replaces the linkifyjs-based detection with a regex matcher and drops the
 * protocol/validation/markdown hooks the project does not use.
 *
 * Original: https://github.com/ueberdosis/tiptap/tree/main/packages/extension-link
 */
import {
  Mark,
  combineTransactionSteps,
  findChildrenInRange,
  getChangedRanges,
  getMarksBetween,
  markPasteRule,
  mergeAttributes,
} from "@tiptap/core";
import type { MarkType } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";

interface LinkOptions {
  /** Open link on click (only fires when not editable). Default false. */
  openOnClick: boolean;
  /** Click extends mark range to the full link. Default false. */
  enableClickSelection: boolean;
  /** Auto-wrap URL-shaped text after whitespace. Default true. */
  autolink: boolean;
  /** Auto-link URLs in pasted text. Default true. */
  linkOnPaste: boolean;
  /** Default target attribute. Default "_blank". */
  target: string | null;
  /** Default rel attribute. Default "noopener noreferrer nofollow". */
  rel: string | null;
  /** Extra HTML attributes (e.g. `class`) merged on render. */
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    link: {
      setLink: (attrs: {
        href: string;
        target?: string | null;
        rel?: string | null;
        class?: string | null;
      }) => ReturnType;
      toggleLink: (attrs: {
        href: string;
        target?: string | null;
        rel?: string | null;
        class?: string | null;
      }) => ReturnType;
      unsetLink: () => ReturnType;
    };
  }
}

/**
 * - Scheme allowlist: http, https, ftp.
 * - Hostname: word chars, dots, hyphens.
 * - TLD: 2-3 lowercase letters, with a `\b` afterwards so e.g.
 *   `https://example.community` doesn't half-match as `.com`.
 * - Optional path/query/fragment introduced by `/`, `?`, or `#`.
 *
 * TLDs longer than 3 chars (`.info`, `.museum`, `.community`, IDN xn--…)
 * are knowingly out of scope — a strict regex covers ~95% of real URLs and
 * keeps the algorithm trivial. URLs without an explicit scheme aren't
 * autolinked either; `setLink` from the bubble menu handles those.
 */
const SCHEME_RE = /^(?:https?|ftp):\/\//i;
const URL_RE = /(?:https?|ftp):\/\/[\w.-]+\.[a-z]{2,3}\b(?:[/?#]\S*)?/gi;

function looksLikeUrl(text: string): boolean {
  if (!text) return false;
  if (SCHEME_RE.test(text)) return true;
  const re = new RegExp(`^${URL_RE.source}$`, "i");
  return re.test(text);
}

function normalizeHref(text: string): string {
  if (SCHEME_RE.test(text)) return text;
  return `https://${text.replace(/^\/\//, "")}`;
}

function autolinkPlugin(opts: { type: MarkType }) {
  const wsEnd = /\s$/;
  return new Plugin({
    key: new PluginKey("autolink"),
    appendTransaction(transactions, oldState, newState) {
      const docChanged =
        transactions.some((tx) => tx.docChanged) &&
        !oldState.doc.eq(newState.doc);
      const preventAutolink = transactions.some((tx) =>
        tx.getMeta("preventAutolink"),
      );
      if (!docChanged || preventAutolink) return null;

      const { tr } = newState;
      const transform = combineTransactionSteps(oldState.doc, [
        ...transactions,
      ]);
      const changes = getChangedRanges(transform);

      changes.forEach(({ newRange }) => {
        const blocks = findChildrenInRange(
          newState.doc,
          newRange,
          (n) => n.isTextblock,
        );
        if (blocks.length === 0) return;

        const block = blocks[0];

        // Trigger only on whitespace at the end of the change. Punctuation
        // alone doesn't trigger — user might still be typing the URL.
        const endText = newState.doc.textBetween(
          newRange.from,
          newRange.to,
          " ",
          " ",
        );
        if (!wsEnd.test(endText)) return;

        // Scan the textblock content and link every URL_RE match. The regex
        // already requires scheme + valid TLD, and `[\w.-]+` excludes
        // surrounding punctuation like `()[]{}` — so the matched substring
        // is the URL itself, regardless of what surrounds it. No lookbehind,
        // no trim, no per-token tokenization needed.
        const text = newState.doc.textBetween(
          block.pos,
          newRange.to,
          undefined,
          " ",
        );

        const re = new RegExp(URL_RE.source, "gi");
        let m: RegExpExecArray | null;
        while ((m = re.exec(text))) {
          const url = m[0];
          const from = block.pos + 1 + m.index;
          const to = from + url.length;

          if (
            newState.schema.marks.code &&
            newState.doc.rangeHasMark(from, to, newState.schema.marks.code)
          )
            continue;
          if (
            getMarksBetween(from, to, newState.doc).some(
              (item) => item.mark.type === opts.type,
            )
          )
            continue;

          tr.addMark(from, to, opts.type.create({ href: normalizeHref(url) }));
        }
      });

      if (!tr.steps.length) return null;
      return tr;
    },
  });
}

interface ClickHandlerOptions {
  type: MarkType;
  openOnClick: boolean;
  enableClickSelection: boolean;
  extendMarkRange: () => boolean;
}

function clickHandlerPlugin(opts: ClickHandlerOptions) {
  return new Plugin({
    key: new PluginKey("handleClickLink"),
    props: {
      handleClick(view, _pos, event) {
        if (event.button !== 0 || !view.editable) return false;
        let link: HTMLAnchorElement | null = null;
        if (event.target instanceof HTMLAnchorElement) {
          link = event.target;
        } else if (event.target instanceof Element) {
          const closest = event.target.closest("a");
          if (closest && view.dom.contains(closest))
            link = closest as HTMLAnchorElement;
        }
        if (!link) return false;

        let handled = false;
        if (opts.enableClickSelection) {
          handled = opts.extendMarkRange();
        }
        if (opts.openOnClick && link.href) {
          window.open(link.href, link.target || undefined);
          handled = true;
        }
        return handled;
      },
    },
  });
}

export const Link = Mark.create<LinkOptions>({
  name: "link",
  priority: 1000,
  keepOnSplit: false,
  exitable: true,

  inclusive() {
    return this.options.autolink;
  },

  addOptions() {
    return {
      openOnClick: false,
      enableClickSelection: false,
      autolink: true,
      linkOnPaste: true,
      target: "_blank",
      rel: "noopener noreferrer nofollow",
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: (el) => el.getAttribute("href"),
      },
      target: { default: this.options.target },
      rel: { default: this.options.rel },
      title: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "a[href]",
        getAttrs: (dom) => {
          const href = (dom as HTMLElement).getAttribute("href");
          if (!href || /^javascript:/i.test(href)) return false;
          return null;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setLink:
        (attrs) =>
        ({ chain }) =>
          chain()
            .setMark(this.name, attrs)
            .setMeta("preventAutolink", true)
            .run(),
      toggleLink:
        (attrs) =>
        ({ chain }) =>
          chain()
            .toggleMark(this.name, attrs, { extendEmptyMarkRange: true })
            .setMeta("preventAutolink", true)
            .run(),
      unsetLink:
        () =>
        ({ chain }) =>
          chain()
            .unsetMark(this.name, { extendEmptyMarkRange: true })
            .setMeta("preventAutolink", true)
            .run(),
    };
  },

  addPasteRules() {
    if (!this.options.linkOnPaste) return [];
    return [
      markPasteRule({
        find: (text: string) => {
          const out: { text: string; data: { href: string }; index: number }[] =
            [];
          if (!text) return out;
          const re = new RegExp(URL_RE.source, "gi");
          let m: RegExpExecArray | null;
          while ((m = re.exec(text))) {
            const value = m[0];
            if (!looksLikeUrl(value)) continue;
            out.push({
              text: value,
              data: { href: normalizeHref(value) },
              index: m.index,
            });
          }
          return out;
        },
        type: this.type,
        getAttributes: (match) => ({
          href: (match as unknown as { data?: { href?: string } }).data?.href,
        }),
      }),
    ];
  },

  addProseMirrorPlugins() {
    const plugins: Plugin[] = [];
    if (this.options.autolink) {
      plugins.push(autolinkPlugin({ type: this.type }));
    }
    plugins.push(
      clickHandlerPlugin({
        type: this.type,
        openOnClick: this.options.openOnClick,
        enableClickSelection: this.options.enableClickSelection,
        extendMarkRange: () =>
          this.editor.commands.extendMarkRange(this.type.name),
      }),
    );
    return plugins;
  },
});
