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

interface Tx {
  id: string;
  transaction_date: string;
  transaction_type: string;
  reference_no: string | null;
  credit: number;
  debit: number;
  running_balance: number;
  notes: string | null;
}

const PartyLedger = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [party, setParty] = useState<any>(null);
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: c } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
      setParty(c);
      const { data: t } = await (supabase as any)
        .from("ledger_transactions").select("*").eq("customer_id", id)
        .order("transaction_date", { ascending: true })
        .order("created_at", { ascending: true });
      setTxs((t as Tx[]) || []);
    })();
  }, [id]);

  const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const last = txs[txs.length - 1];
  const balance = last ? Number(last.running_balance) : Number(party?.opening_balance || 0);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/parties")}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
          {party && (
            <Button variant="outline" onClick={() => navigate(`/parties/edit/${id}`)}><Pencil className="h-4 w-4 mr-2" />Edit</Button>
          )}
        </div>

        {party && (
          <Card>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Party</p>
                <p className="font-semibold">{party.name}</p>
                <Badge variant="secondary" className="mt-1">{party.party_type}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mobile / GSTIN</p>
                <p className="text-sm">{party.contact || "—"}</p>
                <p className="text-xs text-muted-foreground">{party.gstin || ""}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Opening Balance</p>
                <p className="font-semibold">{fmt(party.opening_balance || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p className={`text-xl font-bold ${balance >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {fmt(Math.abs(balance))} {balance >= 0 ? "Dr" : "Cr"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txs.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No transactions</TableCell></TableRow>
              ) : txs.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{format(new Date(t.transaction_date), "dd MMM yyyy")}</TableCell>
                  <TableCell><Badge variant="outline">{t.transaction_type}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{t.reference_no || "—"}</TableCell>
                  <TableCell className="text-right">{Number(t.debit) ? fmt(t.debit) : "—"}</TableCell>
                  <TableCell className="text-right">{Number(t.credit) ? fmt(t.credit) : "—"}</TableCell>
                  <TableCell className={`text-right font-semibold ${Number(t.running_balance) >= 0 ? "text-green-600" : "text-destructive"}`}>
                    {fmt(Math.abs(Number(t.running_balance)))} {Number(t.running_balance) >= 0 ? "Dr" : "Cr"}
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

export default PartyLedger;
