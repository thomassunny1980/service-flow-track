import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  customer_id: string;
  name: string;
  contact: string | null;
  gstin: string | null;
  party_type: string;
  opening_balance: number;
  total_purchases: number;
  total_paid_to_vendor: number;
  balance: number;
}

const Parties = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [salesByCustomer, setSalesByCustomer] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("party_balances").select("*").order("name");
    setRows((data as Row[]) || []);

    // aggregate sales from invoices by customer name (no FK, customer_name lookup)
    const { data: invs } = await supabase.from("invoices").select("customer_name,total_amount");
    const map: Record<string, number> = {};
    (invs || []).forEach((i: any) => {
      const k = (i.customer_name || "").toLowerCase().trim();
      map[k] = (map[k] || 0) + Number(i.total_amount || 0);
    });
    setSalesByCustomer(map);
    setLoading(false);
  };

  const filtered = rows.filter((r) => {
    if (typeFilter !== "all" && r.party_type !== typeFilter && r.party_type !== "both") return false;
    const q = search.toLowerCase();
    return (
      !q ||
      r.name.toLowerCase().includes(q) ||
      (r.contact || "").toLowerCase().includes(q) ||
      (r.gstin || "").toLowerCase().includes(q)
    );
  });

  const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Parties</h1>
            <p className="text-sm text-muted-foreground">Customers & vendors</p>
          </div>
          <Button onClick={() => navigate("/parties/new")}>
            <Plus className="h-4 w-4 mr-2" /> New Party
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search name / mobile / GSTIN" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="vendor">Vendors</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Purchase</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No parties</TableCell></TableRow>
              ) : (
                filtered.map((r) => {
                  const sales = salesByCustomer[r.name.toLowerCase().trim()] || 0;
                  const bal = Number(r.opening_balance || 0) + sales - Number(r.total_purchases || 0);
                  return (
                    <TableRow key={r.customer_id} className="cursor-pointer" onClick={() => navigate(`/parties/${r.customer_id}`)}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.contact || "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{r.party_type}</Badge></TableCell>
                      <TableCell className="text-right">{fmt(r.total_purchases)}</TableCell>
                      <TableCell className="text-right">{fmt(sales)}</TableCell>
                      <TableCell className={`text-right font-semibold ${bal >= 0 ? "text-green-600" : "text-destructive"}`}>
                        {fmt(Math.abs(bal))} {bal >= 0 ? "Dr" : "Cr"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/parties/${r.customer_id}`)}><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default Parties;
