import { DA } from "./htmlDataAttrs";

const { codeBlock } = DA;
const html = String.raw;

export function getHydrationScript(): string {
  return html`<script>
    console.log("hydration script");
    document.addEventListener("click", function (e) {
      const btn = e.target.closest("[${codeBlock.copy}]");
      if (!btn) return;
      const text = btn.getAttribute("${codeBlock.copyText}") || "";
      const copyIcon = btn.getAttribute("${codeBlock.copyIcon}") || "";
      const checkIcon = btn.getAttribute("${codeBlock.checkIcon}") || "";
      const iconImg = btn.querySelector("[${codeBlock.copyIconImg}]");
      const label = btn.querySelector("[${codeBlock.copyLabel}]");
      navigator.clipboard.writeText(text).then(() => {
        btn.setAttribute("${codeBlock.copied}", "true");
        if (iconImg) iconImg.setAttribute("src", checkIcon);
        if (label) label.textContent = "Copied";
        setTimeout(() => {
          btn.removeAttribute("${codeBlock.copied}");
          if (iconImg) iconImg.setAttribute("src", copyIcon);
          if (label) label.textContent = "Copy";
        }, 2000);
      });
    });
  </script>`;
}
