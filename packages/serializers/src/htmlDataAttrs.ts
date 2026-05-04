/**
 * `data-*` names and `data-type` values emitted by `docToHTML` / `_renderBlockContent`.
 * Keep in sync with `script.ts` (code-block copy hydration).
 */

export const DATA_TYPE = "data-type";

export const DA = {
  type: {
    emoji: "emoji",
    codeBlock: "codeBlock",
    callout: "callout",
    taskList: "taskList",
    tableContainer: "tableContainer",
  },
  codeBlock: {
    header: "data-code-block-header",
    language: "data-code-block-language",
    copy: "data-copy-button",
    copyText: "data-copy-text",
    copyIcon: "data-copy-icon",
    checkIcon: "data-check-icon",
    copyIconImg: "data-copy-icon-img",
    copyLabel: "data-copy-label",
    lang: "data-language",
    copied: "data-copied",
  },
} as const;
