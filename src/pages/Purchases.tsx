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
import { Plus, Search, Eye, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import DateRangeFilter, { DateFilterValue, defaultDateFilter, matchesDateFilter } from "@/components/DateRangeFilter";

interface Purchase {
  id: string;
  vendor_id: string;
  vendor_name: string;
  invoice_no: string | null;
  purchase_date: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_type: string;
  created_at: string;
}

const Purchases = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingOnly, setPendingOnly] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(defaultDateFilter);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("purchases").select("*").order("purchase_date", { ascending: false }).order("created_at", { ascending: false });
    setRows((data as Purchase[]) || []);
    setLoading(false);
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from("purchases").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const filtered = rows.filter((r) => {
    if (!matchesDateFilter(r.purchase_date, dateFilter)) return false;
    if (pendingOnly === "pending" && Number(r.balance_amount) <= 0) return false;
    if (pendingOnly === "paid" && Number(r.balance_amount) > 0) return false;
    const q = search.toLowerCase();
    return !q || r.vendor_name.toLowerCase().includes(q) || (r.invoice_no || "").toLowerCase().includes(q);
  });

  const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const totalPurchase = filtered.reduce((s, r) => s + Number(r.total_amount), 0);
  const totalPending = filtered.reduce((s, r) => s + Number(r.balance_amount), 0);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Purchases</h1>
            <p className="text-sm text-muted-foreground">Total: {fmt(totalPurchase)} • Pending: {fmt(totalPending)}</p>
          </div>
          <Button onClick={() => navigate("/purchases/new")}><Plus className="h-4 w-4 mr-2" />New Purchase</Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search vendor / invoice no" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={pendingOnly} onValueChange={setPendingOnly}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Fully Paid</SelectItem>
            </SelectContent>
          </Select>
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No purchases</TableCell></TableRow>
              ) : filtered.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/purchases/${r.id}`)}>
                  <TableCell>{format(new Date(r.purchase_date), "dd MMM yyyy")}</TableCell>
                  <TableCell className="font-mono text-xs">{r.invoice_no || "—"}</TableCell>
                  <TableCell className="font-medium">{r.vendor_name}</TableCell>
                  <TableCell><Badge variant="secondary">{r.payment_type}</Badge></TableCell>
                  <TableCell className="text-right">{fmt(r.total_amount)}</TableCell>
                  <TableCell className="text-right">{fmt(r.paid_amount)}</TableCell>
                  <TableCell className={`text-right font-semibold ${Number(r.balance_amount) > 0 ? "text-destructive" : "text-green-600"}`}>{fmt(r.balance_amount)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/purchases/${r.id}`)}><Eye className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete purchase?</AlertDialogTitle>
                            <AlertDialogDescription>This will reverse the ledger entry for {r.vendor_name}.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(r.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default Purchases;
