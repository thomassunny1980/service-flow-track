import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Trash2, CreditCard } from "lucide-react";
import InvoicePaymentDialog from "@/components/InvoicePaymentDialog";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import DateRangeFilter, { DateFilterValue, defaultDateFilter, matchesDateFilter } from "@/components/DateRangeFilter";

interface Invoice {
  id: string;
  invoice_number: string | null;
  quotation_id: string | null;
  customer_name: string;
  customer_contact: string | null;
  customer_email: string | null;
  items: unknown;
  subtotal: number;
  tax_amount: number | null;
  total_amount: number;
  amount_paid: number | null;
  status: string;
  due_date: string | null;
  created_at: string;
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(defaultDateFilter);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (roles && roles.length > 0) {
      setUserRole(roles[0].role);
    }

    fetchInvoices();
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw error;
      setInvoices((data || []) as Invoice[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Partial</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Unpaid</Badge>;
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      (inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer_contact?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      matchesDateFilter(inv.created_at, dateFilter)
  );

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Manage customer invoices</p>
          </div>
          <Button onClick={() => navigate("/invoices/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="mobile-card-list">
          {/* Mobile Card View */}
          <div className="mobile-cards space-y-3">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No invoices found</div>
            ) : (
              filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-4 space-y-3 bg-card cursor-pointer active:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">{invoice.invoice_number || "-"}</span>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{invoice.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{Array.isArray(invoice.items) ? invoice.items.length : 0} items</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base">₹{invoice.total_amount?.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">
                      {invoice.due_date ? `Due: ${format(parseISO(invoice.due_date), "dd/MM/yyyy")}` : "No due date"}
                    </span>
                  </div>
                  {invoice.status !== 'paid' && (
                    <div className="flex items-center gap-2 pt-1 border-t" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 h-9 text-xs flex-1"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setPaymentDialogOpen(true);
                        }}
                      >
                        <CreditCard className="h-3.5 w-3.5 mr-1" /> Record Payment
                      </Button>
                      {userRole === 'admin' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive h-9">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteInvoice(invoice.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="desktop-table border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">{invoice.invoice_number || "-"}</TableCell>
                      <TableCell className="font-medium">{invoice.customer_name}</TableCell>
                      <TableCell>{Array.isArray(invoice.items) ? invoice.items.length : 0} items</TableCell>
                      <TableCell>₹{invoice.total_amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        {invoice.due_date ? format(parseISO(invoice.due_date), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {invoice.status !== 'paid' && (
                            <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => { setSelectedInvoice(invoice); setPaymentDialogOpen(true); }} title="Record Payment">
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          {userRole === 'admin' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                  <AlertDialogDescription>Are you sure you want to delete this invoice? This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteInvoice(invoice.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {selectedInvoice && (
        <InvoicePaymentDialog
          invoiceId={selectedInvoice.id}
          totalAmount={selectedInvoice.total_amount}
          currentAmountPaid={selectedInvoice.amount_paid || 0}
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          onComplete={fetchInvoices}
        />
      )}
    </Layout>
  );
};

export default Invoices;
