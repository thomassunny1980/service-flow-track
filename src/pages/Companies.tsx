import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Building2, Upload, MoreVertical, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

type Company = {
  id: string;
  name: string;
  address: string | null;
  logo_url: string | null;
  created_at: string;
};

const Companies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        // Fallback for cases where 'address' column doesn't exist yet
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('address') && errorMsg.includes('column')) {
           const { data: fallbackData } = await supabase
            .from("companies")
            .select("id, name, logo_url, created_at")
            .order("created_at", { ascending: false });
           setCompanies((fallbackData as unknown as Company[]) || []);
           return;
        }
        throw error;
      }
      setCompanies(data || []);
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Company name is required");
      return;
    }
    setSaving(true);
    try {
      let logo_url: string | null = null;

      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(path, logoFile);
        if (uploadError) {
          console.error("Logo upload error:", uploadError);
          throw new Error(`Logo upload failed: ${uploadError.message}`);
        }
        const { data: urlData } = supabase.storage
          .from("company-logos")
          .getPublicUrl(path);
        logo_url = urlData.publicUrl;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const insertData: any = {
        name: name.trim(),
        logo_url,
        created_by: session?.user?.id,
      };

      // Only add address if it's provided (to avoid error if column is missing)
      if (address.trim()) {
        insertData.address = address.trim();
      }

      const { error } = await supabase.from("companies").insert(insertData);
      
      if (error) {
         const errorMsg = error.message.toLowerCase();
         if (errorMsg.includes('address') && errorMsg.includes('column')) {
            // Try again without address
            delete insertData.address;
            const { error: retryError } = await supabase.from("companies").insert(insertData);
            if (retryError) throw retryError;
            toast.warning("Company created without address (database table needs update)");
         } else {
            throw error;
         }
      } else {
        toast.success("Company created");
      }
      setName("");
      setLogoFile(null);
      setDialogOpen(false);
      fetchCompanies();
    } catch (error: any) {
      console.error("Company creation error:", error);
      toast.error(error.message || "Failed to create company");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLocation = async () => {
    if (!locationName.trim() || !selectedCompanyId) {
      toast.error("Location name is required");
      return;
    }
    // Instead of a separate table, we'll just navigate to create an asset with this location
    navigate(`/assets/new?companyId=${selectedCompanyId}&location=${encodeURIComponent(locationName.trim())}`);
    setLocationDialogOpen(false);
    setLocationName("");
  };

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Companies</h1>
            <p className="text-muted-foreground text-sm">Manage company profiles for asset tagging</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Company</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Company</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter company name" />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter company address" />
                </div>
                <div>
                  <Label>Logo</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button variant="outline" size="sm" onClick={() => document.getElementById("logo-input")?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      {logoFile ? logoFile.name : "Upload Logo"}
                    </Button>
                    <input id="logo-input" type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={saving} className="w-full">
                  {saving ? "Creating..." : "Create Company"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Create Location Dialog */}
        <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Asset Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Location Name *</Label>
                <Input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Server Room, Office A" />
              </div>
              <Button onClick={handleCreateLocation} disabled={savingLocation} className="w-full">
                {savingLocation ? "Creating..." : "Create Location"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search companies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No companies found</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.name} className="h-8 w-8 object-contain rounded" />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link to={`/companies/${c.id}`} className="text-primary hover:underline font-semibold">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {c.address || "-"}
                    </TableCell>
                    <TableCell className="text-sm">{format(new Date(c.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/companies/${c.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedCompanyId(c.id);
                            setLocationDialogOpen(true);
                          }}>
                            Add Location
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/assets/new?companyId=${c.id}`}>Add Asset</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Companies;
