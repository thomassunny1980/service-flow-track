import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Banknote, CreditCard, Smartphone, Building2 } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface CashbookEntry {
  id: string;
  date: string;
  description: string;
  type: "invoice" | "service";
  payment_mode: string;
  debit: number;
  credit: number;
  reference: string;
}

const PAYMENT_MODES = ["cash", "bank", "upi", "card"] as const;

const paymentModeIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  bank: <Building2 className="h-4 w-4" />,
  upi: <Smartphone className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
};

const paymentModeLabels: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  upi: "UPI",
  card: "Card",
};

const Cashbook = () => {
  const [entries, setEntries] = useState<CashbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()));
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      fetchCashbookData();
    }
  }, [fromDate, toDate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    fetchCashbookData();
  };

  const fetchCashbookData = async () => {
    setLoading(true);
    try {
      const fromStr = format(fromDate, "yyyy-MM-dd");
      const toStr = format(toDate, "yyyy-MM-dd");

      // Fetch invoice payments
      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("id, invoice_number, customer_name, total_amount, amount_paid, payment_mode, created_at, status")
        .gte("created_at", `${fromStr}T00:00:00`)
        .lte("created_at", `${toStr}T23:59:59`)
        .order("created_at", { ascending: true });

      if (invError) throw invError;

      // Fetch service payments
      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("id, product_name, customer_name, service_charge, amount_paid, payment_mode, completed_date, payment_status")
        .not("completed_date", "is", null)
        .gte("completed_date", `${fromStr}T00:00:00`)
        .lte("completed_date", `${toStr}T23:59:59`)
        .order("completed_date", { ascending: true });

      if (prodError) throw prodError;

      const cashbookEntries: CashbookEntry[] = [];

      // Process invoices
      (invoices || []).forEach((inv: any) => {
        // Debit entry (total amount billed)
        cashbookEntries.push({
          id: `inv-debit-${inv.id}`,
          date: inv.created_at,
          description: `Invoice ${inv.invoice_number || "N/A"} - ${inv.customer_name}`,
          type: "invoice",
          payment_mode: inv.payment_mode || "cash",
          debit: inv.total_amount || 0,
          credit: 0,
          reference: inv.invoice_number || inv.id.slice(0, 8),
        });

        // Credit entry (amount received)
        if ((inv.amount_paid || 0) > 0) {
          cashbookEntries.push({
            id: `inv-credit-${inv.id}`,
            date: inv.created_at,
            description: `Payment received - ${inv.invoice_number || "N/A"} (${inv.customer_name})`,
            type: "invoice",
            payment_mode: inv.payment_mode || "cash",
            debit: 0,
            credit: inv.amount_paid || 0,
            reference: inv.invoice_number || inv.id.slice(0, 8),
          });
        }
      });

      // Process service payments
      (products || []).forEach((prod: any) => {
        // Debit entry (service charge)
        if ((prod.service_charge || 0) > 0) {
          cashbookEntries.push({
            id: `svc-debit-${prod.id}`,
            date: prod.completed_date,
            description: `Service - ${prod.product_name} (${prod.customer_name})`,
            type: "service",
            payment_mode: prod.payment_mode || "cash",
            debit: prod.service_charge || 0,
            credit: 0,
            reference: prod.id.slice(0, 8),
          });
        }

        // Credit entry (amount paid)
        if ((prod.amount_paid || 0) > 0) {
          cashbookEntries.push({
            id: `svc-credit-${prod.id}`,
            date: prod.completed_date,
            description: `Service payment - ${prod.product_name} (${prod.customer_name})`,
            type: "service",
            payment_mode: prod.payment_mode || "cash",
            debit: 0,
            credit: prod.amount_paid || 0,
            reference: prod.id.slice(0, 8),
          });
        }
      });

      // Sort by date
      cashbookEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setEntries(cashbookEntries);
    } catch (error: any) {
      console.error("Error fetching cashbook data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSummaryByMode = (mode: string) => {
    const modeEntries = entries.filter((e) => e.payment_mode === mode);
    const totalDebit = modeEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = modeEntries.reduce((sum, e) => sum + e.credit, 0);
    return { totalDebit, totalCredit, balance: totalDebit - totalCredit };
  };

  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
  const totalBalance = totalDebit - totalCredit;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Cashbook</h1>
          <p className="text-muted-foreground">Debit & Credit report by payment mode</p>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">From:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !fromDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "dd MMM yyyy") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={fromDate} onSelect={(d) => d && setFromDate(d)} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">To:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !toDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "dd MMM yyyy") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={toDate} onSelect={(d) => d && setToDate(d)} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Summary Cards by Payment Mode */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PAYMENT_MODES.map((mode) => {
            const summary = getSummaryByMode(mode);
            return (
              <Card key={mode}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {paymentModeIcons[mode]}
                    {paymentModeLabels[mode]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Debit:</span>
                    <span className="font-medium">₹{summary.totalDebit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Credit:</span>
                    <span className="font-medium text-green-600">₹{summary.totalCredit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t pt-1">
                    <span className="text-muted-foreground">Balance:</span>
                    <span className={cn("font-semibold", summary.balance > 0 ? "text-destructive" : "text-green-600")}>
                      ₹{summary.balance.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Overall Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Debit</p>
                <p className="text-xl font-bold">₹{totalDebit.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Credit (Received)</p>
                <p className="text-xl font-bold text-green-600">₹{totalCredit.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance Due</p>
                <p className={cn("text-xl font-bold", totalBalance > 0 ? "text-destructive" : "text-green-600")}>
                  ₹{totalBalance.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entries Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Debit (₹)</TableHead>
                <TableHead className="text-right">Credit (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No transactions found for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">{format(new Date(entry.date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="max-w-[250px] truncate">{entry.description}</TableCell>
                    <TableCell>
                      <Badge variant={entry.type === "invoice" ? "default" : "secondary"}>
                        {entry.type === "invoice" ? "Invoice" : "Service"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {paymentModeIcons[entry.payment_mode]}
                        <span className="capitalize text-sm">{paymentModeLabels[entry.payment_mode] || entry.payment_mode}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {entries.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={4} className="text-right">Total:</TableCell>
                  <TableCell className="text-right">₹{totalDebit.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-green-600">₹{totalCredit.toFixed(2)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default Cashbook;
