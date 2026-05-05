import { DA } from "@open-notion/serializers/const";

const { codeBlock } = DA;

let timeouts: Map<HTMLElement, number> = new Map();

document.body.addEventListener("click", async function (e) {
  const t = e.target as HTMLElement;
  const btn = t.closest(`[${codeBlock.copy}]`) as HTMLElement | null;
  if (!btn) return;

  const tm = timeouts.get(btn);
  if (tm) clearTimeout(tm);

  const text = btn.getAttribute(codeBlock.copyText) || "";
  const iconImg = btn.querySelector<HTMLElement>(`[${codeBlock.copyIconImg}]`);
  const checkEl = btn.querySelector<HTMLElement>(`[${codeBlock.checkIcon}]`);
  const label = btn.querySelector<HTMLElement>(`[${codeBlock.copyLabel}]`);

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return;
  }

  btn.setAttribute(codeBlock.copied, "true");
  if (iconImg) iconImg.style.display = "none";
  if (checkEl) checkEl.style.display = "";
  if (label) label.textContent = "Copied";

  timeouts.set(
    btn,
    setTimeout(() => {
      timeouts.delete(btn);
      btn.removeAttribute(codeBlock.copied);
      if (iconImg) iconImg.style.display = "";
      if (checkEl) checkEl.style.display = "none";
      if (label) label.textContent = "Copy";
    }, 2000),
  );
});
