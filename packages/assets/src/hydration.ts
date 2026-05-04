import { DA } from "@open-notion/serializers";

const { codeBlock } = DA;
document.addEventListener("click", function (e) {
  const t = e.target as HTMLElement;
  const btn = t.closest(`[${codeBlock.copy}]`);
  if (!btn) return;
  const text = btn.getAttribute(codeBlock.copyText) || "";
  const copyIcon = btn.getAttribute(codeBlock.copyIcon) || "";
  const checkIcon = btn.getAttribute(codeBlock.checkIcon) || "";
  const iconImg = btn.querySelector<HTMLElement>(`[${codeBlock.copyIconImg}]`);
  const label = btn.querySelector<HTMLElement>(`[${codeBlock.copyLabel}]`);

  navigator.clipboard.writeText(text).then(() => {
    btn.setAttribute(codeBlock.copied, "true");
    if (iconImg) iconImg.setAttribute("src", checkIcon);
    if (label) label.textContent = "Copied";
    setTimeout(() => {
      btn.removeAttribute(codeBlock.copied);
      if (iconImg) iconImg.setAttribute("src", copyIcon);
      if (label) label.textContent = "Copy";
    }, 2000);
  });
});
