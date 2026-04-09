import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { memo } from "react";
import useEmojiPicker from "./useEmojiPicker";
import type { PopoverRoot } from "@base-ui/react";
import { EmojiCateogires } from "./Categories";

interface EmojiPickerDrawerProps extends PopoverRoot.Props {
  onEmojiSelect: (emojiId: string) => void;
  children: React.ReactElement;
}
export const EmojiPickerDrawer = memo(
  ({ onEmojiSelect, children, ...props }: EmojiPickerDrawerProps) => {
    return (
      <Popover {...props}>
        <PopoverTrigger render={children} />

        <PopoverContent className="w-lg h-120 p-0 [&>button]:hidden flex flex-col gap-0 duration-200">
          {/* Title - fixed height */}
          <PopoverTitle className="shrink-0 py-2 px-4 border-b">
            Emoji Picker
          </PopoverTitle>

          {/* EmojiPicker - takes remaining space */}
          <div className="flex-1 min-h-0">
            <EmojiPicker onEmojiSelect={onEmojiSelect} />
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

interface EmojiPickerProps {
  onEmojiSelect: (emojiId: string) => void;
  className?: string;
  columns?: number;
}

const EmojiPicker = memo(
  ({ onEmojiSelect, className }: EmojiPickerProps) => {
    const {
      setSearchQuery,

      categories,
      searchQuery,
      containerRef,
    } = useEmojiPicker({ onEmojiSelect });

    return (
      <div className={`h-full flex flex-col relative ${className}`}>
        <div className="shrink-0 p-2 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search emojis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        <div
          className="flex-1 overflow-auto min-h-0"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <div ref={containerRef} />
        </div>

        {searchQuery ? null : <EmojiCateogires categories={categories} />}
      </div>
    );
  },
  () => true,
);
