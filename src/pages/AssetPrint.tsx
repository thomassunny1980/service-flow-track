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
  serial_number: string | null;
  mac_address: string | null;
  product_type: string | null;
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
  const [bgColor, setBgColor] = useState("#0369a1");
  const printRef = useRef<HTMLDivElement>(null);

  const ids = searchParams.get("ids")?.split(",") || [];

  useEffect(() => {
    if (ids.length === 0) {
      navigate("/assets");
      return;
    }
    supabase
      .from("assets")
      .select("id, asset_code, serial_number, mac_address, product_type, companies(name, logo_url)")
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
          .page { width: 210mm; height: 297mm; page-break-after: always; display: flex; flex-wrap: wrap; align-content: flex-start; padding: 5mm; gap: 0; }
          .page:last-child { page-break-after: auto; }
          .sticker {
            width: ${stickerWidth}mm;
            height: ${stickerHeight}mm;
            border: 0.2mm solid #ddd;
            display: flex;
            margin: 0;
            overflow: hidden;
            border-radius: 2mm;
            background: white;
          }
          .sticker-left {
            width: 35%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2mm;
            background: white;
          }
          .sticker-right {
            width: 65%;
            background: ${bgColor}; 
            color: white;
            display: flex;
            flex-direction: column;
            padding: 1.5mm 2mm;
            position: relative;
          }
          .sticker-property-label {
            font-size: ${Math.max(4, stickerHeight * 0.12)}pt;
            font-weight: bold;
            opacity: 0.9;
            text-align: center;
            text-transform: uppercase;
          }
          .sticker-company-name {
            font-size: ${Math.max(6, stickerHeight * 0.22)}pt;
            font-weight: 800;
            text-align: center;
            margin-bottom: 1mm;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .sticker-qr-container {
            background: white;
            padding: 1mm;
            border-radius: 1mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-top: auto;
          }
          .sticker-code-text {
            color: #000;
            font-family: monospace;
            font-weight: bold;
            font-size: ${Math.max(5, stickerHeight * 0.15)}pt;
            margin-top: 0.5mm;
          }
          .sticker-logo-img {
            max-width: 100%;
            max-height: 70%;
            object-fit: contain;
          }
          @media print { .sticker { border-color: #eee; } }
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
              <div>
                <Label>Tag Color</Label>
                <div className="flex items-center gap-2 mt-1">
                   <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-8 p-1" />
                   <span className="text-xs font-mono">{bgColor}</span>
                </div>
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
                        border: "0.2mm solid #ddd",
                        display: "flex",
                        margin: "0.5mm",
                        borderRadius: "1.5mm",
                        overflow: "hidden"
                      }}
                    >
                      <div className="sticker-left" style={{ width: "35%", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5mm", background: "white" }}>
                        {asset.companies?.logo_url ? (
                          <img src={asset.companies.logo_url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                        ) : (
                          <div style={{ fontSize: "6pt", color: "#ccc", textAlign: "center" }}>NO LOGO</div>
                        )}
                      </div>
                      <div className="sticker-right" style={{ width: "65%", background: bgColor, color: "white", display: "flex", flexDirection: "column", padding: "1.5mm 2mm" }}>
                        <div style={{ fontSize: "5pt", textAlign: "center", textTransform: "uppercase", fontWeight: "bold", opacity: 0.8 }}>Property Of</div>
                        <div style={{ fontSize: "8pt", fontWeight: "800", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.5mm" }}>
                          {asset.companies?.name || "YOUR TEXT HERE"}
                        </div>
                        <div style={{ background: "white", padding: "0.8mm", borderRadius: "0.5mm", display: "flex", flexDirection: "column", alignItems: "center", marginTop: "auto" }}>
                          <QRCodeSVG value={asset.asset_code} size={stickerHeight * 0.4 * 3.78} />
                          <div style={{ color: "black", fontFamily: "monospace", fontWeight: "bold", fontSize: "5pt", marginTop: "0.2mm" }}>
                            {asset.asset_code}
                          </div>
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
