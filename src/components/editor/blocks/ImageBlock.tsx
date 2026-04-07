import * as React from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { 
  Image as ImageIcon, 
  Upload,
  AlignLeft, 
  AlignCenter, 
  AlignJustify, 
  Trash2,
  RefreshCcw
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

export const ImageBlock: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const { src, caption, align } = node.attrs;
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"upload" | "embed">("upload");
  const [linkInput, setLinkInput] = React.useState("");

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkInput.trim()) {
      updateAttributes({ src: linkInput.trim() });
      setPopoverOpen(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Stub: Read as data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateAttributes({ src: event.target.result as string });
          setPopoverOpen(false);
        }
      };
      reader.readAsDataURL(file);
      // TODO: Replace with real upload pipeline
    }
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAttributes({ caption: e.target.value });
  };

  if (!src) {
    return (
      <NodeViewWrapper as="div" className="w-full my-4">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger render={<button type="button" />}>
            <div 
              className={cn(
                "w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/40 cursor-pointer",
                selected && "ring-2 ring-accent border-transparent"
              )}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="size-5" />
                <span className="font-medium">Add an image</span>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="center" side="bottom">
            <div className="flex items-center gap-4 px-4 pt-3 pb-2 border-b border-border">
              <button
                type="button"
                className={cn("pb-2 text-sm font-medium border-b-2 transition-colors", activeTab === "upload" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
                onClick={() => setActiveTab("upload")}
              >
                Upload
              </button>
              <button
                type="button"
                className={cn("pb-2 text-sm font-medium border-b-2 transition-colors", activeTab === "embed" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
                onClick={() => setActiveTab("embed")}
              >
                Embed link
              </button>
            </div>
            
            <div className="p-3">
              {activeTab === "upload" ? (
                <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-md bg-muted/30">
                  <Upload className="size-5 mb-2 text-muted-foreground" />
                  <label className="text-sm font-medium cursor-pointer text-accent hover:underline">
                    Choose a file
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              ) : (
                <form onSubmit={handleLinkSubmit} className="flex gap-2">
                  <Input 
                    value={linkInput} 
                    onChange={e => setLinkInput(e.target.value)} 
                    placeholder="Paste an image link..."
                    autoFocus
                  />
                  <Button type="submit" size="sm">Embed</Button>
                </form>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="div" className={cn("relative my-4 flex flex-col", align === "center" ? "items-center" : align === "left" ? "items-start" : "items-stretch")}>
      <div 
        className={cn(
          "relative group max-w-full inline-block",
          align === "full" && "w-full"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={src} 
          alt={caption || "Image block"} 
          className={cn(
            "rounded-lg overflow-hidden transition-shadow max-h-[600px] object-contain",
            align === "full" && "w-full",
            selected && "ring-2 ring-accent"
          )}
        />
        
        {/* Hover Toolbar */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-background/95 backdrop-blur-sm border border-border shadow-sm rounded-md p-1 gap-0.5">
          <Toggle 
            size="sm" 
            pressed={align === "left"} 
            onPressedChange={() => updateAttributes({ align: "left" })}
            className="h-7 w-7 p-0"
          >
            <AlignLeft className="size-4" />
          </Toggle>
          <Toggle 
            size="sm" 
            pressed={align === "center"} 
            onPressedChange={() => updateAttributes({ align: "center" })}
            className="h-7 w-7 p-0"
          >
            <AlignCenter className="size-4" />
          </Toggle>
          <Toggle 
            size="sm" 
            pressed={align === "full"} 
            onPressedChange={() => updateAttributes({ align: "full" })}
            className="h-7 w-7 p-0"
          >
            <AlignJustify className="size-4" />
          </Toggle>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => updateAttributes({ src: null })}
          >
            <RefreshCcw className="size-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 text-destructive border-transparent hover:text-destructive hover:bg-destructive/10"
            onClick={deleteNode}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      
      <div className={cn(
        "mt-2 w-full max-w-2xl",
        align === "center" && "text-center",
        align === "full" && "text-center"
      )}>
        <input
          type="text"
          value={caption}
          onChange={handleCaptionChange}
          placeholder="Write a caption…"
          className="w-full bg-transparent text-sm italic text-muted-foreground outline-none placeholder:text-muted-foreground/60 text-center"
          onKeyDown={(e) => {
            // Prevent Enter from deleting the node or creating new text node right away 
            // if we just want to stop editing caption. We let ProseMirror handle it 
            // but we might want to prevent default to stop block splitting.
            if (e.key === "Enter") {
              e.preventDefault();
              // Focus editor
            }
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};
