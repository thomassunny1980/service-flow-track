import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Company = { id: string; name: string };

const AssetForm = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [location, setLocation] = useState("");
  const [productType, setProductType] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name").then(({ data }) => {
      setCompanies(data || []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      toast.error("Please select a company");
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from("assets").insert({
        asset_code: "", // trigger will generate
        company_id: companyId,
        location: location.trim() || null,
        product_type: productType.trim() || null,
        serial_number: serialNumber.trim() || null,
        mac_address: macAddress.trim() || null,
        created_by: session?.user?.id,
      });
      if (error) throw error;
      toast.success("Asset tag created successfully");
      navigate("/assets");
    } catch {
      toast.error("Failed to create asset tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate("/assets")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />Back to Assets
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create Asset Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Company *</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Branch, office, or site" />
              </div>
              <div>
                <Label>Product Type</Label>
                <Input value={productType} onChange={(e) => setProductType(e.target.value)} placeholder="e.g. Laptop, Router, Printer" />
              </div>
              <div>
                <Label>Serial Number</Label>
                <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Manufacturer serial number" />
              </div>
              <div>
                <Label>MAC Address</Label>
                <Input value={macAddress} onChange={(e) => setMacAddress(e.target.value)} placeholder="e.g. AA:BB:CC:DD:EE:FF" />
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Creating..." : "Create Tag"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AssetForm;
