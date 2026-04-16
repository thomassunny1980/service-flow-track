import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { format } from "date-fns";

type Asset = {
  id: string;
  asset_code: string;
  location: string | null;
  product_type: string | null;
  serial_number: string | null;
  mac_address: string | null;
  created_at: string;
  companies: { id: string; name: string; logo_url: string | null } | null;
};

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("assets")
      .select("*, companies(id, name, logo_url)")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          toast.error("Asset not found");
          navigate("/assets");
          return;
        }
        setAsset(data as unknown as Asset);
        setLoading(false);
      });
  }, [id, navigate]);

  if (loading || !asset) return <Layout><p className="text-muted-foreground p-4">Loading...</p></Layout>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/assets")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />Back
          </Button>
          <Button variant="outline" onClick={() => navigate(`/assets/print?ids=${asset.id}`)}>
            <Printer className="h-4 w-4 mr-2" />Print Sticker
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {asset.companies?.logo_url && (
                <img src={asset.companies.logo_url} alt="" className="h-10 w-10 object-contain rounded" />
              )}
              <div>
                <div className="text-lg">{asset.asset_code}</div>
                <div className="text-sm font-normal text-muted-foreground">{asset.companies?.name}</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border">
                <QRCodeSVG value={asset.asset_code} size={160} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Asset Code</p>
                <p className="font-mono font-medium">{asset.asset_code}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Company</p>
                <p className="font-medium">{asset.companies?.name || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{asset.location || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Product Type</p>
                <p className="font-medium">{asset.product_type || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Serial Number</p>
                <p className="font-medium">{asset.serial_number || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">MAC Address</p>
                <p className="font-medium">{asset.mac_address || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(asset.created_at), "dd MMM yyyy, hh:mm a")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AssetDetail;
