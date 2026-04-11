import { getEmojiData } from "./data";
import { getEmojiUrl } from "../getEmojiUrl";

export const categoryId = (id: string) => `emoji-category-${id}`;
export function createCategoryBar(
  bar: HTMLDivElement,
  scroll: HTMLDivElement,
  onCategoryClick: (id: string) => void,
) {
  const build = (hasRecent: boolean) => {
    bar.innerHTML = "";

    const data = getEmojiData();
    if (!data) return;

    const entries: { id: string; icon: string }[] = [];
    if (hasRecent) entries.push({ id: "recent", icon: "231B" });
    for (const c of data.categories) entries.push({ id: c.id, icon: c.icon });

    for (const { id, icon } of entries) {
      const btn = document.createElement("button");
      btn.className =
        "inline-flex items-center justify-center rounded-md transition-colors hover:bg-gray-100 size-9";

      btn.onclick = () => {
        const target = document.getElementById(categoryId(id));

        if (!target) return;
        const delta =
          target.getBoundingClientRect().top -
          scroll.getBoundingClientRect().top -
          36;

        scroll.scrollTo({
          top: scroll.scrollTop + delta,
          behavior: "smooth",
        });

        onCategoryClick(id);
      };

      const img = document.createElement("img");
      img.src = getEmojiUrl(icon, {
        provider: "noto-animated",
        format: "webp",
      });
      img.className = "size-6 select-none";
      img.draggable = false;
      btn.appendChild(img);

      bar.appendChild(btn);
    }
  };

  return { build };
}
