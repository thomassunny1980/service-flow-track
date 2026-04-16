import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

type Asset = {
  id: string;
  asset_code: string;
  companies: { name: string; logo_url: string | null } | null;
};

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

const AssetPrint = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [stickerWidth, setStickerWidth] = useState(65);
  const [stickerHeight, setStickerHeight] = useState(30);
  const printRef = useRef<HTMLDivElement>(null);

  const ids = searchParams.get("ids")?.split(",") || [];

  useEffect(() => {
    if (ids.length === 0) {
      navigate("/assets");
      return;
    }
    supabase
      .from("assets")
      .select("id, asset_code, companies(name, logo_url)")
      .in("id", ids)
      .then(({ data, error }) => {
        if (error) {
          toast.error("Failed to load assets");
          return;
        }
        setAssets((data as unknown as Asset[]) || []);
        setLoading(false);
      });
  }, []);

  const cols = Math.floor(A4_WIDTH_MM / stickerWidth);
  const rows = Math.floor(A4_HEIGHT_MM / stickerHeight);
  const perPage = cols * rows;
  const pages = Math.ceil(assets.length / perPage);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked. Please allow popups.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Asset Stickers</title>
        <style>
          @page { size: A4; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; }
          .page { width: 210mm; height: 297mm; page-break-after: always; display: flex; flex-wrap: wrap; align-content: flex-start; }
          .page:last-child { page-break-after: auto; }
          .sticker {
            width: ${stickerWidth}mm;
            height: ${stickerHeight}mm;
            border: 0.5px dashed #ccc;
            display: flex;
            align-items: center;
            padding: 2mm;
            gap: 2mm;
            overflow: hidden;
          }
          .sticker-qr { flex-shrink: 0; }
          .sticker-qr svg { width: ${Math.min(stickerHeight - 6, stickerWidth * 0.35)}mm; height: ${Math.min(stickerHeight - 6, stickerWidth * 0.35)}mm; }
          .sticker-info { flex: 1; min-width: 0; overflow: hidden; }
          .sticker-logo { height: ${Math.max(3, stickerHeight * 0.2)}mm; max-width: ${stickerWidth * 0.4}mm; object-fit: contain; }
          .sticker-company { font-weight: bold; font-size: ${Math.max(6, Math.min(10, stickerHeight * 0.25))}pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .sticker-code { font-family: monospace; font-size: ${Math.max(5, Math.min(8, stickerHeight * 0.2))}pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          @media print { .sticker { border-color: #ddd; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for images to load
    const images = printWindow.document.querySelectorAll("img");
    let loadedCount = 0;
    const totalImages = images.length;

    const triggerPrint = () => {
      setTimeout(() => {
        printWindow.print();
      }, 300);
    };

    if (totalImages === 0) {
      triggerPrint();
    } else {
      images.forEach((img) => {
        img.onload = img.onerror = () => {
          loadedCount++;
          if (loadedCount === totalImages) triggerPrint();
        };
      });
    }
  };

  const qrSize = Math.min(stickerHeight - 6, stickerWidth * 0.35);

  if (loading) return <Layout><p className="text-muted-foreground p-4">Loading...</p></Layout>;

  return (
    <Layout>
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/assets")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />Back to Assets
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Print Stickers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label>Sticker Width (mm)</Label>
                <Input type="number" value={stickerWidth} onChange={(e) => setStickerWidth(Number(e.target.value) || 50)} min={20} max={210} />
              </div>
              <div>
                <Label>Sticker Height (mm)</Label>
                <Input type="number" value={stickerHeight} onChange={(e) => setStickerHeight(Number(e.target.value) || 25)} min={15} max={297} />
              </div>
              <div>
                <Label>Grid</Label>
                <p className="text-sm font-medium mt-2">{cols} × {rows} = {perPage} per page</p>
              </div>
              <div>
                <Label>Total</Label>
                <p className="text-sm font-medium mt-2">{assets.length} stickers, {pages} page(s)</p>
              </div>
            </div>

            <Button onClick={handlePrint} className="w-full sm:w-auto">
              <Printer className="h-4 w-4 mr-2" />Print Stickers
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="border rounded-lg p-4 bg-muted/30 overflow-auto">
          <p className="text-sm text-muted-foreground mb-3">Preview (scaled down):</p>
          <div ref={printRef}>
            {Array.from({ length: pages }).map((_, pageIdx) => (
              <div
                key={pageIdx}
                className="bg-white border shadow-sm mb-4"
                style={{
                  width: `${A4_WIDTH_MM}mm`,
                  height: `${A4_HEIGHT_MM}mm`,
                  display: "flex",
                  flexWrap: "wrap",
                  alignContent: "flex-start",
                  transform: "scale(0.4)",
                  transformOrigin: "top left",
                }}
              >
                {assets
                  .slice(pageIdx * perPage, (pageIdx + 1) * perPage)
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="sticker"
                      style={{
                        width: `${stickerWidth}mm`,
                        height: `${stickerHeight}mm`,
                        border: "0.5px dashed #ccc",
                        display: "flex",
                        alignItems: "center",
                        padding: "2mm",
                        gap: "2mm",
                        overflow: "hidden",
                      }}
                    >
                      <div className="sticker-qr" style={{ flexShrink: 0 }}>
                        <QRCodeSVG value={asset.asset_code} size={qrSize * 3.78} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                        {asset.companies?.logo_url && (
                          <img
                            src={asset.companies.logo_url}
                            alt=""
                            className="sticker-logo"
                            style={{
                              height: `${Math.max(3, stickerHeight * 0.2)}mm`,
                              maxWidth: `${stickerWidth * 0.4}mm`,
                              objectFit: "contain",
                            }}
                          />
                        )}
                        <div
                          className="sticker-company"
                          style={{
                            fontWeight: "bold",
                            fontSize: `${Math.max(6, Math.min(10, stickerHeight * 0.25))}pt`,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {asset.companies?.name}
                        </div>
                        <div
                          className="sticker-code"
                          style={{
                            fontFamily: "monospace",
                            fontSize: `${Math.max(5, Math.min(8, stickerHeight * 0.2))}pt`,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {asset.asset_code}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AssetPrint;
