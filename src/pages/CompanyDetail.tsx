import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Building2, MapPin, Plus, QrCode, Printer, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Company = {
  id: string;
  name: string;
  address: string | null;
  logo_url: string | null;
};

type Asset = {
  id: string;
  asset_code: string;
  product_type: string | null;
  serial_number: string | null;
  mac_address: string | null;
  location: string | null;
  created_at: string;
};

type Location = {
  id: string;
  name: string;
};

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  // Form states for quick add
  const [assetName, setAssetName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Default");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompanyData();
    // Load local location suggestions
    const localLocs = localStorage.getItem(`locations_${id}`);
    if (localLocs) {
      setLocalSuggestions(JSON.parse(localLocs));
    }
  }, [id]);

  const [localSuggestions, setLocalSuggestions] = useState<string[]>([]);

  const fetchCompanyData = async () => {
    try {
      const { data: comp, error: compErr } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();
      
      if (compErr) {
        const errorMsg = compErr.message.toLowerCase();
        if (errorMsg.includes('address') && errorMsg.includes('column')) {
           const { data: fallbackComp } = await supabase
            .from("companies")
            .select("id, name, logo_url")
            .eq("id", id)
            .single();
           setCompany(fallbackComp as Company);
        } else {
           throw compErr;
        }
      } else {
        setCompany(comp);
      }

      const { data: asts, error: astsErr } = await supabase
        .from("assets")
        .select("*")
        .eq("company_id", id)
        .order("created_at", { ascending: false });
      if (astsErr) throw astsErr;
      setAssets(asts || []);

      // Derive locations from existing assets since we're using string field now
      const dbLocs = Array.from(new Set(asts?.map(a => a.location).filter(Boolean))) as string[];
      
      // Merge DB locations with local suggestions
      const allUniqueLocs = Array.from(new Set([...dbLocs, ...localSuggestions]));
      setLocations(allUniqueLocs.map(name => ({ id: name, name })));

    } catch (error) {
      console.error(error);
      toast.error("Failed to load company details");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) {
      toast.error("Asset Name is required");
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Generate custom Asset Code
      const compShort = company?.name?.substring(0, 3).toUpperCase() || "AST";
      const prodShort = assetName.substring(0, 3).toUpperCase() || "PRD";
      const locPart = selectedLocation.substring(0, 3).toUpperCase() || "DEF";
      
      // Fetch count for sequence
      const { count } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("company_id", id)
        .eq("location", selectedLocation);
      
      const seq = ((count || 0) + 1).toString().padStart(3, "0");
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const assetCode = `${compShort}-${prodShort}-${locPart}-${seq}-${randomPart}`;

      const { error } = await supabase.from("assets").insert({
        company_id: id,
        product_type: assetName.trim(),
        serial_number: serialNumber.trim() || null,
        mac_address: macAddress.trim() || null,
        location: selectedLocation,
        asset_code: assetCode,
        created_by: session?.user?.id,
      });
      if (error) throw error;
      toast.success("Asset created");
      setAssetName("");
      setSerialNumber("");
      setMacAddress("");
      fetchCompanyData();
    } catch {
      toast.error("Failed to create asset");
    } finally {
      setSaving(false);
    }
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev =>
      prev.includes(assetId) ? prev.filter(i => i !== assetId) : [...prev, assetId]
    );
  };

  const handleGenerateTags = () => {
    if (selectedAssets.length === 0) {
      toast.error("Please select at least one asset");
      return;
    }
    navigate(`/assets/print?ids=${selectedAssets.join(",")}`);
  };

  if (loading) return <Layout><p className="p-4">Loading...</p></Layout>;
  if (!company) return <Layout><p className="p-4 text-destructive">Company not found</p></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/companies")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />Back to Companies
        </Button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Company Profile */}
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">{company.name}</CardTitle>
                <div className="flex items-center text-muted-foreground mt-1 text-sm">
                  <MapPin className="h-3 w-3 mr-1" />
                  {company.address || "No address provided"}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Right: Quick Stats/Actions */}
          <div className="flex gap-4">
             <Button onClick={handleGenerateTags} variant="outline" className="h-auto py-4 px-6 flex flex-col gap-1 items-center">
                <Printer className="h-5 w-5" />
                <span className="text-xs">Print Tags ({selectedAssets.length})</span>
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Asset Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create Asset
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAsset} className="space-y-4">
                <div className="space-y-2">
                  <Label>Asset Name *</Label>
                  <Input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="e.g. Laptop, Printer" />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                   <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Default">Default</SelectItem>
                      {locations.map(l => (
                        <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
                      ))}
                      <Dialog>
                        <DialogTrigger asChild>
                           <div className="flex items-center gap-2 p-2 text-sm text-primary cursor-pointer hover:bg-accent border-t">
                             <Plus className="h-3 w-3" /> Add New Location
                           </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Add Custom Location</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-4">
                            <Input id="custom-loc" placeholder="Enter location name" onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                if (val) {
                                  setSelectedLocation(val);
                                  // Update local suggestions
                                  const updated = Array.from(new Set([...localSuggestions, val]));
                                  setLocalSuggestions(updated);
                                  localStorage.setItem(`locations_${id}`, JSON.stringify(updated));
                                  setLocations(updated.map(n => ({ id: n, name: n })));
                                  toast.info(`Location "${val}" selected`);
                                }
                              }
                            }} />
                            <p className="text-xs text-muted-foreground">Type name and press Enter</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>MAC Address</Label>
                  <Input value={macAddress} onChange={(e) => setMacAddress(e.target.value)} />
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Creating..." : "Add Asset"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Asset List */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Company Assets</CardTitle>
              {selectedAssets.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedAssets([])}>
                  Clear selection
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Asset Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Serial No.</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No assets created yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      assets.map((asset) => (
                        <TableRow
                          key={asset.id}
                          className="cursor-pointer"
                          onClick={() => toggleAssetSelection(asset.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${selectedAssets.includes(asset.id) ? "bg-primary border-primary text-white" : "border-muted"}`}>
                              {selectedAssets.includes(asset.id) && <CheckCircle2 className="h-3 w-3" />}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{asset.asset_code}</TableCell>
                          <TableCell>{asset.product_type}</TableCell>
                          <TableCell className="text-sm">{asset.serial_number || "-"}</TableCell>
                          <TableCell className="text-sm">{asset.location || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CompanyDetail;
