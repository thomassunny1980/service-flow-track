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
import { Plus, Search, Eye, CheckCircle, XCircle, Trash2, RefreshCw, Edit, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, parseISO, addDays } from "date-fns";
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

interface Quotation {
  id: string;
  quotation_number: string | null;
  customer_name: string;
  customer_contact: string | null;
  customer_email: string | null;
  items: unknown;
  total_amount: number;
  validity_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const Quotations = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(defaultDateFilter);
  const [userRole, setUserRole] = useState<string | null>(null);
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

    fetchQuotations();
  };

  const fetchQuotations = async () => {
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw error;
      setQuotations((data || []) as Quotation[]);
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

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from("quotations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Quotation ${status} successfully`,
      });

      if (status === 'approved') {
        navigate(`/invoices/new?quotation=${id}`);
      } else {
        fetchQuotations();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteQuotation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("quotations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quotation deleted successfully",
      });
      fetchQuotations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isExpiredQuotation = (status: string, validityDate: string) => {
    return isPast(parseISO(validityDate)) && status === 'pending';
  };

  const getStatusBadge = (status: string, validityDate: string) => {
    const isExpired = isExpiredQuotation(status, validityDate);
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const renewQuotation = async (quotationId: string) => {
    try {
      const newValidityDate = format(addDays(new Date(), 15), "yyyy-MM-dd");
      const { error } = await supabase
        .from("quotations")
        .update({ 
          validity_date: newValidityDate,
          status: 'pending' 
        })
        .eq("id", quotationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quotation renewed with new validity date",
      });
      fetchQuotations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredQuotations = quotations.filter(
    (q) =>
      (q.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customer_contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.quotation_number?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      matchesDateFilter(q.created_at, dateFilter)
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
            <h1 className="text-2xl font-bold">Quotations</h1>
            <p className="text-muted-foreground">Manage customer quotations</p>
          </div>
          <Button onClick={() => navigate("/quotations/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Quotation
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
        </div>

        <div className="mobile-card-list">
          {/* Mobile Card View */}
          <div className="mobile-cards space-y-3">
            {filteredQuotations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No quotations found</div>
            ) : (
              filteredQuotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className="border rounded-lg p-4 space-y-3 bg-card cursor-pointer active:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/quotations/${quotation.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">{(quotation as any).quotation_number || "-"}</span>
                    {getStatusBadge(quotation.status, quotation.validity_date)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{quotation.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{Array.isArray(quotation.items) ? quotation.items.length : 0} items</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base">₹{quotation.total_amount?.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">Valid: {format(parseISO(quotation.validity_date), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t" onClick={(e) => e.stopPropagation()}>
                    {quotation.status === 'pending' && !isExpiredQuotation(quotation.status, quotation.validity_date) && (
                      <>
                        <Button size="sm" variant="outline" className="text-green-600 border-green-600 h-9 text-xs flex-1" onClick={() => updateStatus(quotation.id, 'approved')}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-600 h-9 text-xs flex-1" onClick={() => updateStatus(quotation.id, 'rejected')}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {quotation.status === 'approved' && (
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600 h-9 text-xs flex-1" onClick={() => navigate(`/invoices/new?quotation=${quotation.id}`)}>
                        <FileText className="h-3.5 w-3.5 mr-1" /> Convert to Invoice
                      </Button>
                    )}
                    {isExpiredQuotation(quotation.status, quotation.validity_date) && (
                      <>
                        <Button size="sm" variant="outline" className="text-blue-600 h-9 text-xs flex-1" onClick={() => renewQuotation(quotation.id)}>
                          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Renew
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 text-xs flex-1" onClick={() => navigate(`/quotations/edit/${quotation.id}`)}>
                          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                      </>
                    )}
                    {userRole === 'admin' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive h-9">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteQuotation(quotation.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="desktop-table border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No quotations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-mono text-sm">{(quotation as any).quotation_number || "-"}</TableCell>
                      <TableCell className="font-medium">{quotation.customer_name}</TableCell>
                      <TableCell>{Array.isArray(quotation.items) ? quotation.items.length : 0} items</TableCell>
                      <TableCell>₹{quotation.total_amount?.toFixed(2)}</TableCell>
                      <TableCell>{format(parseISO(quotation.validity_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{getStatusBadge(quotation.status, quotation.validity_date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/quotations/${quotation.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {quotation.status === 'pending' && !isExpiredQuotation(quotation.status, quotation.validity_date) && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => updateStatus(quotation.id, 'approved')}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => updateStatus(quotation.id, 'rejected')}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {quotation.status === 'approved' && (
                            <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => navigate(`/invoices/new?quotation=${quotation.id}`)} title="Convert to Invoice">
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          {isExpiredQuotation(quotation.status, quotation.validity_date) && (
                            <>
                              <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" onClick={() => renewQuotation(quotation.id)} title="Renew Quotation">
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => navigate(`/quotations/edit/${quotation.id}`)} title="Edit Quotation">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
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
                                  <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
                                  <AlertDialogDescription>Are you sure you want to delete this quotation? This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteQuotation(quotation.id)}>Delete</AlertDialogAction>
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
    </Layout>
  );
};

export default Quotations;
