import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Item { item_name: string; qty: number | string; rate: number | string; amount: number; }
interface Vendor { id: string; name: string; contact: string | null; gstin: string | null; party_type: string; }

const emptyItem = (): Item => ({ item_name: "", qty: 1, rate: 0, amount: 0 });

const PurchaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = !!id;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendorBalance, setVendorBalance] = useState<number>(0);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [taxAmount, setTaxAmount] = useState("0");
  const [paymentType, setPaymentType] = useState("credit");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("customers").select("id,name,contact,gstin,party_type").order("name");
      setVendors((data as any) || []);
      if (editing && id) {
        const { data: p } = await (supabase as any).from("purchases").select("*").eq("id", id).maybeSingle();
        if (p) {
          setInvoiceNo(p.invoice_no || "");
          setPurchaseDate(p.purchase_date);
          setItems(((p.items as Item[]) || []).length ? (p.items as Item[]) : [emptyItem()]);
          setTaxAmount(String(p.tax_amount || 0));
          setPaymentType(p.payment_type);
          setPaymentMode(p.payment_mode || "cash");
          setPaidAmount(String(p.paid_amount || 0));
          setNotes(p.notes || "");
          const { data: v } = await supabase.from("customers").select("id,name,contact,gstin,party_type").eq("id", p.vendor_id).maybeSingle();
          if (v) setVendor(v as any);
        }
      }
    })();
  }, [id, editing]);

  useEffect(() => {
    if (!vendor) { setVendorBalance(0); return; }
    (async () => {
      const { data } = await (supabase as any).from("ledger_transactions")
        .select("running_balance").eq("customer_id", vendor.id)
        .order("transaction_date", { ascending: false }).order("created_at", { ascending: false }).limit(1);
      const b = data && data[0] ? Number(data[0].running_balance) : 0;
      setVendorBalance(b);
    })();
  }, [vendor]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0),
    [items]
  );
  const total = subtotal + (Number(taxAmount) || 0);

  useEffect(() => {
    if (paymentType === "cash") setPaidAmount(String(total));
    if (paymentType === "credit") setPaidAmount("0");
  }, [paymentType, total]);

  const updateItem = (i: number, patch: Partial<Item>) => {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    next[i].amount = (Number(next[i].qty) || 0) * (Number(next[i].rate) || 0);
    setItems(next);
  };

  const filteredVendors = vendors.filter((v) => {
    const q = vendorSearch.toLowerCase();
    return !q || v.name.toLowerCase().includes(q) || (v.contact || "").includes(q);
  });

  const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return toast.error("Select a vendor");
    if (!items.some((i) => i.item_name.trim())) return toast.error("Add at least one item");
    setSaving(true);
    const paid = Number(paidAmount) || 0;
    const payload: any = {
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      invoice_no: invoiceNo.trim() || null,
      purchase_date: purchaseDate,
      items: items.filter((i) => i.item_name.trim()),
      subtotal,
      tax_amount: Number(taxAmount) || 0,
      total_amount: total,
      paid_amount: paid,
      balance_amount: total - paid,
      payment_type: paymentType,
      payment_mode: paymentMode,
      notes: notes.trim() || null,
    };
    const { data: { session } } = await supabase.auth.getSession();
    if (!editing) payload.created_by = session?.user.id;
    const res = editing
      ? await (supabase as any).from("purchases").update(payload).eq("id", id!)
      : await (supabase as any).from("purchases").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Purchase saved & ledger updated");
    navigate("/purchases");
  };

  return (
    <Layout>
      <form onSubmit={submit} className="space-y-4 max-w-5xl">
        <h1 className="text-2xl font-bold">{editing ? "Edit Purchase" : "New Purchase"}</h1>

        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2 relative">
              <Label>Vendor *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder={vendor ? vendor.name : "Search vendor by name or mobile"}
                  value={vendorSearch}
                  onChange={(e) => { setVendorSearch(e.target.value); setVendorOpen(true); }}
                  onFocus={() => setVendorOpen(true)}
                />
              </div>
              {vendorOpen && filteredVendors.length > 0 && (
                <div className="absolute z-50 w-full bg-popover border rounded-md shadow-lg max-h-[240px] overflow-auto">
                  {filteredVendors.slice(0, 30).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { setVendor(v); setVendorSearch(""); setVendorOpen(false); }}
                      className="w-full text-left px-3 py-2 hover:bg-accent"
                    >
                      <div className="font-medium">{v.name}</div>
                      <div className="text-xs text-muted-foreground">{v.contact || "—"} • {v.party_type}</div>
                    </button>
                  ))}
                </div>
              )}
              <div className="text-xs">
                <Button type="button" size="sm" variant="link" className="px-0" onClick={() => navigate("/parties/new")}>+ Create new party</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <div className={`h-10 px-3 flex items-center rounded-md border font-semibold ${vendorBalance >= 0 ? "text-green-600" : "text-destructive"}`}>
                {fmt(Math.abs(vendorBalance))} {vendorBalance >= 0 ? "Dr" : "Cr"}
              </div>
            </div>
            <div className="space-y-2"><Label>Invoice No</Label><Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} /></div>
            <div className="space-y-2"><Label>Date *</Label><Input type="date" required value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Items</h2>
              <Button type="button" size="sm" variant="outline" onClick={() => setItems([...items, emptyItem()])}><Plus className="h-3 w-3 mr-1" />Add row</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item / Description</TableHead>
                  <TableHead className="w-[100px]">Qty</TableHead>
                  <TableHead className="w-[120px]">Rate</TableHead>
                  <TableHead className="w-[120px] text-right">Amount</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell><Input value={it.item_name} onChange={(e) => updateItem(i, { item_name: e.target.value })} placeholder="Item name" /></TableCell>
                    <TableCell><Input inputMode="decimal" value={String(it.qty)} onChange={(e) => updateItem(i, { qty: e.target.value })} /></TableCell>
                    <TableCell><Input inputMode="decimal" value={String(it.rate)} onChange={(e) => updateItem(i, { rate: e.target.value })} /></TableCell>
                    <TableCell className="text-right">{fmt(it.amount)}</TableCell>
                    <TableCell>
                      <Button type="button" size="icon" variant="ghost" onClick={() => setItems(items.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <RadioGroup value={paymentType} onValueChange={setPaymentType} className="flex gap-4">
                  <div className="flex items-center gap-2"><RadioGroupItem value="cash" id="pt-cash" /><Label htmlFor="pt-cash">Cash</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="credit" id="pt-credit" /><Label htmlFor="pt-credit">Credit</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="partial" id="pt-partial" /><Label htmlFor="pt-partial">Partial</Label></div>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Paid Amount</Label>
                  <Input inputMode="decimal" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} disabled={paymentType !== "partial"} />
                </div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            </div>
            <div className="space-y-2 md:border-l md:pl-4">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-sm items-center gap-2">
                <span>Tax</span>
                <Input className="w-32" inputMode="decimal" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>{fmt(total)}</span></div>
              <div className="flex justify-between text-sm"><span>Paid</span><span>{fmt(Number(paidAmount) || 0)}</span></div>
              <div className="flex justify-between font-semibold"><span>Balance</span><span className={total - (Number(paidAmount) || 0) > 0 ? "text-destructive" : "text-green-600"}>{fmt(total - (Number(paidAmount) || 0))}</span></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Purchase"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/purchases")}>Cancel</Button>
        </div>
      </form>
    </Layout>
  );
};

export default PurchaseForm;
