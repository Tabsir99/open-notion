import type { Emoji } from "../../menus/EmojiPicker/createEmojipicker/data";

export function shortcodeToEmoji(
  shortcode: string,
  emojis: Emoji[],
): Emoji | undefined {
  return emojis.find(
    (item) => shortcode === item.name || item.shortcodes.includes(shortcode),
  );
}
