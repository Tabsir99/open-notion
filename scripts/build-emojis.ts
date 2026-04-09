import rawEmojis from "emojibase-data/en/data.json";
import groupData from "emojibase-data/meta/groups.json";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import type {
  Emoji,
  EmojiSkin,
  RawEmojiCategory,
} from "../src/components/editor/blocks/EmojiPicker/data";

const build = (): void => {
  const emojis: Record<string, Emoji> = {};
  const categoryMap: Record<number, string[]> = {};

  for (const raw of rawEmojis) {
    // skip uncategorized
    if (raw.group === undefined) continue;

    const id = raw.hexcode;

    const skins: EmojiSkin[] = [
      {
        unified: raw.hexcode,
        native: raw.emoji,
      },
      ...(raw.skins ?? []).map((s) => ({
        unified: s.hexcode,
        native: s.emoji,
        tone: s.tone as number | number[] | undefined,
      })),
    ];

    emojis[id] = {
      id,
      name: raw.label,
      keywords: raw.tags ?? [],
      skins,
      group: raw.group,
      unicode: raw.emoji,
    };

    if (!categoryMap[raw.group]) categoryMap[raw.group] = [];
    categoryMap[raw.group].push(id);
  }

  // groups is Record<string, string> e.g. { "0": "smileys-emotion", "1": "people-body" }
  const categories: RawEmojiCategory[] = Object.entries(groupData.groups)
    .map(([index, key]) => ({
      id: key,
      emojis: categoryMap[Number(index)] ?? [],
    }))
    .filter((cat) => cat.emojis.length > 0 && cat.id !== "component");

  const data = { emojis, categories };

  const outDir = resolve(
    process.cwd(),
    "src/components/editor/blocks/EmojiPicker",
  );
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "emoji.json"), JSON.stringify(data));

  console.log(
    `✓ ${Object.keys(emojis).length} emojis across ${categories.length} categories → src/data/emoji.json`,
  );
};

build();
