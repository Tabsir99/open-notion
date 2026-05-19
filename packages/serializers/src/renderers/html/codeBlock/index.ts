import type { CodeBlockNode } from "../../../jsonContent";
import { getHighlighter } from "../../../highlighter";
import { DA, DATA_TYPE } from "../dataAttr";
import { attr, dataAttrFlag, escapeText } from "../_internal";
import { getLanguageIconUrl } from "./languageIcons";

const { type, codeBlock } = DA;
const html = String.raw;

const COPY_ICON = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  width="1rem"
  height="1rem"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
</svg>`;

const CHECK_ICON = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  width="1rem"
  height="1rem"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M20 6 9 17l-5-5" />
</svg>`;

export async function renderCodeBlock(node: CodeBlockNode): Promise<string> {
  const lang = node.attrs.language || "plaintext";
  const text = (node.content ?? []).map((t) => t.text).join("");
  const highlighter = await getHighlighter();
  const loaded = highlighter?.h.getLoadedLanguages() ?? [];

  let highlighted = escapeText(text);
  if (text.length && lang !== "plaintext" && loaded.includes(lang)) {
    try {
      const raw = highlighter.h.codeToHtml(text, {
        lang,
        themes: { light: highlighter.lightTheme, dark: highlighter.darkTheme },
        defaultColor: false,
      });
      highlighted = raw.match(/<code>([\s\S]*)<\/code>/)?.[1] ?? highlighted;
    } catch {
      // fall through to escaped plain text
    }
  }

  return html`<div${attr(DATA_TYPE, type.codeBlock)}>
    <div${dataAttrFlag(codeBlock.header)}>
      <span${dataAttrFlag(codeBlock.language)}>
        <img src="${getLanguageIconUrl(lang)}" alt="" aria-hidden="true" />
        ${escapeText(lang)}
      </span>
      <button
        type="button"${dataAttrFlag(codeBlock.copy)}${attr(codeBlock.copyText, text)}
      >
        <span aria-hidden="true"${dataAttrFlag(codeBlock.copyIconImg)}>${COPY_ICON}</span>
        <span aria-hidden="true"${dataAttrFlag(codeBlock.checkIcon)} style="display:none">${CHECK_ICON}</span>
        <span${dataAttrFlag(codeBlock.copyLabel)}>Copy</span>
      </button>
    </div>
    <pre><code${attr(codeBlock.lang, lang)}>${highlighted}</code></pre>
  </div>`;
}
