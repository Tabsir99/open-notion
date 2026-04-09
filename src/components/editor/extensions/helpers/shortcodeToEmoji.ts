import type { Emoji } from "../../blocks/EmojiPicker/data";

export function shortcodeToEmoji(
  shortcode: string,
  emojis: Emoji[],
): Emoji | undefined {
  return emojis.find(
    (item) => shortcode === item.name || item.shortcodes.includes(shortcode),
  );
}
