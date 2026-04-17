import rawEmojis from "emojibase-data/en/data.json";
import groupData from "emojibase-data/meta/groups.json";
import githubShortcodes from "emojibase-data/en/shortcodes/github.json";

import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import type {
  Emoji,
  EmojiSkin,
  EmojiCategory,
} from "../src/components/editor/menus/EmojiPicker/createEmojipicker/data";

const _categories = {
  "smileys-emotion": "1F604", // 😄
  "people-body": "1F44B", // 👋
  "animals-nature": "1F431", // 🐱
  "food-drink": "1F34E", // 🍎
  "travel-places": "2708", // 🌍
  activities: "1F3C6", // 🏆
  objects: "1F4A1", // 💡
  symbols: "1F4AF", // 💯
  flags: "1F6A9", // 🚩
};

const DIRECTORY = "public";

const build = (): void => {
  const emojis: Record<string, Emoji> = {};
  const categoryMap: Record<number, string[]> = {};

  let shortcodecount = 0;
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
      tags: raw.tags ?? [],
      skins,
      group: raw.group,
      unicode: raw.emoji,
      shortcodes: Array.isArray(githubShortcodes[id])
        ? githubShortcodes[id]
        : [githubShortcodes[id] ?? ""],
    };

    if (!categoryMap[raw.group]) categoryMap[raw.group] = [];
    categoryMap[raw.group].push(id);
  }

  // groups is Record<string, string> e.g. { "0": "smileys-emotion", "1": "people-body" }
  const categories = Object.entries(groupData.groups)
    .map<EmojiCategory>(([index, key]) => ({
      id: key,
      emojis: categoryMap[Number(index)] ?? [],
      icon: _categories[key as keyof typeof _categories],
    }))
    .filter((cat) => cat.emojis.length > 0 && cat.id !== "component");

  const data = { emojis, categories };

  const outDir = resolve(process.cwd(), DIRECTORY);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "emojis.json"), JSON.stringify(data));

  console.info("shortcodecount", shortcodecount);
  console.info(
    `✓ ${Object.keys(emojis).length} emojis across ${categories.length} categories → ${DIRECTORY}/emojis.json`,
  );
};

build();
