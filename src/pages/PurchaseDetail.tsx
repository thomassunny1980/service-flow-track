import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const PurchaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await (supabase as any).from("purchases").select("*").eq("id", id).maybeSingle();
      setP(data);
    })();
  }, [id]);

  const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  if (!p) return <Layout><div className="p-4 text-muted-foreground">Loading…</div></Layout>;

  const items = (p.items as any[]) || [];

  return (
    <Layout>
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/purchases")}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
          <Button variant="outline" onClick={() => navigate(`/purchases/edit/${id}`)}><Pencil className="h-4 w-4 mr-2" />Edit</Button>
        </div>

        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-muted-foreground">Vendor</p><p className="font-semibold cursor-pointer text-primary" onClick={() => navigate(`/parties/${p.vendor_id}`)}>{p.vendor_name}</p></div>
            <div><p className="text-xs text-muted-foreground">Invoice No</p><p className="font-mono">{p.invoice_no || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Date</p><p>{format(new Date(p.purchase_date), "dd MMM yyyy")}</p></div>
            <div><p className="text-xs text-muted-foreground">Payment</p><Badge>{p.payment_type}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell>{it.item_name}</TableCell>
                    <TableCell className="text-right">{it.qty}</TableCell>
                    <TableCell className="text-right">{fmt(Number(it.rate))}</TableCell>
                    <TableCell className="text-right">{fmt(Number(it.amount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 max-w-xs ml-auto space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{fmt(p.subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{fmt(p.tax_amount)}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>{fmt(p.total_amount)}</span></div>
              <div className="flex justify-between"><span>Paid</span><span>{fmt(p.paid_amount)}</span></div>
              <div className="flex justify-between font-semibold"><span>Balance</span><span className={Number(p.balance_amount) > 0 ? "text-destructive" : "text-green-600"}>{fmt(p.balance_amount)}</span></div>
            </div>
            {p.notes && <p className="mt-3 text-sm text-muted-foreground">Notes: {p.notes}</p>}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PurchaseDetail;
