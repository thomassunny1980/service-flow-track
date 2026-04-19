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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

type Company = { id: string; name: string };

const AssetForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState(searchParams.get("companyId") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [productType, setProductType] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data } = await supabase.from("companies").select("id, name").order("name");
    setCompanies(data || []);
  };

  const handleCreateCompany = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    setCreatingCompany(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.from("companies").insert({
        name: newCompanyName.trim(),
        created_by: session?.user?.id,
      }).select().single();
      
      if (error) throw error;
      
      toast.success("Company created successfully");
      setNewCompanyName("");
      setDialogOpen(false);
      setCompanies(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setCompanyId(data.id);
    } catch {
      toast.error("Failed to create company");
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      toast.error("Please select a company");
      return;
    }
    setSaving(true);
    try {
      // Get company short name
      const comp = companies.find(c => c.id === companyId);
      const compShort = comp?.name?.substring(0, 3).toUpperCase() || "AST";
      const prodShort = productType.substring(0, 3).toUpperCase() || "PRD";
      const locPart = (location.trim() || "DEF").substring(0, 3).toUpperCase();
      
      // Fetch count for sequence
      const { count } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("location", location.trim() || null);
      
      const seq = ((count || 0) + 1).toString().padStart(3, "0");
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const assetCode = `${compShort}-${prodShort}-${locPart}-${seq}-${randomPart}`;

      const { error } = await supabase.from("assets").insert({
        asset_code: assetCode,
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Company *</Label>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                        <Plus className="h-3 w-3 mr-1" /> New Company
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Quick Create Company</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Company Name *</Label>
                          <Input 
                            value={newCompanyName} 
                            onChange={(e) => setNewCompanyName(e.target.value)} 
                            placeholder="Enter company name" 
                          />
                        </div>
                        <Button 
                          onClick={handleCreateCompany} 
                          disabled={creatingCompany} 
                          className="w-full"
                        >
                          {creatingCompany ? "Creating..." : "Create Company"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
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
                <Label>Asset Name</Label>
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
