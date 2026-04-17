import * as React from "react";
import { ImageIcon, Upload, Link2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/editor/ui/popover";
import { Button } from "@/components/editor/ui/button";
import { Input } from "@/components/editor/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/editor/ui/tabs";
import { cn } from "@/components/editor/lib/utils";

interface ImageEmptyStateProps {
  onSrcChange: (src: string) => void;
}

export const ImageEmptyState: React.FC<ImageEmptyStateProps> = ({
  onSrcChange,
}) => {
  const [open, setOpen] = React.useState(false);
  const [linkInput, setLinkInput] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onSrcChange(event.target.result as string);
        setOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkInput.trim()) {
      onSrcChange(linkInput.trim());
      setLinkInput("");
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="w-full h-32 gap-2 border-dashed bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ImageIcon className="size-5" />
            <span className="text-sm">Add an image</span>
          </Button>
        }
      />
      <PopoverContent className="w-96 p-3" align="start" side="bottom">
        <Tabs defaultValue="upload" className="gap-3">
          <TabsList className="grid grid-cols-2 w-full h-9 p-1 bg-muted rounded-md">
            <TabsTrigger
              value="upload"
              className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm"
            >
              <Upload className="size-3.5 mr-1.5" />
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="embed"
              className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm"
            >
              <Link2 className="size-3.5 mr-1.5" />
              Embed link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-0">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-2 h-32 rounded-md border border-dashed cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/30 hover:bg-muted/50",
              )}
            >
              <Upload className="size-5 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground">
                  or drag and drop
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </TabsContent>

          <TabsContent value="embed" className="mt-0">
            <form onSubmit={handleLinkSubmit} className="flex flex-col gap-2">
              <Input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://example.com/image.png"
                autoFocus
                className="h-9"
              />
              <Button type="submit" size="sm" className="w-full">
                Embed image
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Works with any image from the web
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
