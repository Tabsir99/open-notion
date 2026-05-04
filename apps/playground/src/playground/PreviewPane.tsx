import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import type { PreviewMode } from "./Toolbar";

export type PreviewTab = "html" | "pdf";

type PreviewPaneProps = {
  previewMode: PreviewMode;
  html: string;
  pdfUrl: string | null;
  pdfBusy: boolean;
  pdfError: string | null;
  tab: PreviewTab;
  onTabChange: (tab: PreviewTab) => void;
};

export function PreviewPane({
  previewMode,
  html,
  pdfUrl,
  pdfBusy,
  pdfError,
  tab,
  onTabChange,
}: PreviewPaneProps) {
  const htmlEmpty = !html.trim();

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => onTabChange(v as PreviewTab)}
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-0"
    >
      <Card className="rounded-none flex flex-col flex-1 min-h-0">
        <CardHeader className="gap-3 border-b">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Output
            </CardTitle>
            <CardDescription className="text-xs">
              {previewMode === "live"
                ? "Updates as you edit"
                : "Frozen until you refresh"}
            </CardDescription>
          </div>
          <CardAction>
            <TabsList className="h-8">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger
                value="pdf"
                disabled={!pdfUrl && !pdfBusy}
                aria-disabled={!pdfUrl && !pdfBusy}
              >
                PDF
              </TabsTrigger>
            </TabsList>
          </CardAction>
        </CardHeader>
        <CardContent className="relative flex min-h-0 flex-1 flex-col gap-0 p-0">
          <TabsContent
            value="html"
            className="m-0 flex-1 overflow-y-auto border-0 p-5 outline-none"
          >
            {htmlEmpty ? (
              <Card
                size="sm"
                className="border-dashed bg-background/60 shadow-none ring-0"
              >
                <CardContent className="flex min-h-48 flex-col items-center justify-center gap-1 py-8 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Nothing to preview yet
                  </p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Write in the editor—
                    {previewMode === "live"
                      ? " the HTML preview will update automatically."
                      : " switch to static mode and use Refresh to capture a snapshot."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            )}
          </TabsContent>

          <TabsContent
            value="pdf"
            className="m-0 flex min-h-0 flex-1 flex-col border-0 p-0 outline-none"
          >
            {pdfBusy && !pdfUrl ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
                <Spinner className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Generating PDF…</p>
              </div>
            ) : pdfUrl ? (
              <iframe
                title="PDF preview"
                src={pdfUrl}
                className="min-h-0 flex-1 border border-destructive bg-background"
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  Use PDF → Generate preview to render here.
                </p>
              </div>
            )}
          </TabsContent>

          {pdfError ? (
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <Alert variant="destructive">
                <AlertDescription>{pdfError}</AlertDescription>
              </Alert>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Tabs>
  );
}
