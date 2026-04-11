import type { Emoji } from "../../menus/EmojiPicker/createEmojipicker/data.js";
import { removeVariationSelector } from "./removeVariationSelector.js";

export function emojiToShortcode(
  emoji: string,
  emojis: Emoji[],
): string | undefined {
  return emojis.find((item) => item.unicode === removeVariationSelector(emoji))
    ?.shortcodes[0];
}
