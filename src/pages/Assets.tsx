import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, QrCode, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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

const Assets = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAssets();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data } = await supabase.from("companies").select("id, name").order("name");
      setCompanies(data || []);
    } catch {
      toast.error("Failed to load companies");
    }
  };

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*, companies(id, name, logo_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAssets((data as unknown as Asset[]) || []);
    } catch {
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  };

  const filtered = assets.filter((a) => {
    if (selectedCompanyId !== "all" && a.companies?.id !== selectedCompanyId) return false;
    
    const term = searchTerm.toLowerCase();
    return (
      a.asset_code.toLowerCase().includes(term) ||
      (a.serial_number?.toLowerCase().includes(term) ?? false) ||
      (a.mac_address?.toLowerCase().includes(term) ?? false) ||
      (a.companies?.name?.toLowerCase().includes(term) ?? false) ||
      (a.location?.toLowerCase().includes(term) ?? false) ||
      (a.product_type?.toLowerCase().includes(term) ?? false)
    );
  });

  const handlePrint = () => {
    if (selected.size === 0) {
      toast.error("Select at least one asset to print");
      return;
    }
    const ids = Array.from(selected).join(",");
    navigate(`/assets/print?ids=${ids}`);
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Asset Tags</h1>
            <p className="text-muted-foreground text-sm">Generate and manage asset identification tags</p>
          </div>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />Print ({selected.size})
              </Button>
            )}
            <Button onClick={() => navigate("/assets/new")}>
              <Plus className="h-4 w-4 mr-2" />Create Tag
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-auto flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by asset code, serial, MAC..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCompanyId !== "all" && (
              <Button variant="outline" onClick={() => {
                const companyAssets = filtered.map(a => a.id);
                if (companyAssets.length === 0) {
                  toast.error("No assets found for this company");
                  return;
                }
                navigate(`/assets/print?ids=${companyAssets.join(",")}`);
              }}>
                <Printer className="h-4 w-4 mr-2" />
                Print All ({filtered.length})
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No asset tags found</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Asset Code</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden md:table-cell">Asset Name</TableHead>
                  <TableHead className="hidden lg:table-cell">Serial No.</TableHead>
                  <TableHead className="hidden lg:table-cell">MAC Address</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => navigate(`/assets/${a.id}`)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleSelect(a.id)} />
                    </TableCell>
                    <TableCell className="font-mono font-medium">{a.asset_code}</TableCell>
                    <TableCell>{a.companies?.name || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{a.location || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{a.product_type || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{a.serial_number || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{a.mac_address || "—"}</TableCell>
                    <TableCell>{format(new Date(a.created_at), "dd MMM yyyy")}</TableCell>
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

export default Assets;
