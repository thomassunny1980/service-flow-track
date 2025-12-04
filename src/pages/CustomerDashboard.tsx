import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Package } from "lucide-react";
import { format } from "date-fns";

type ServiceStatus =
  | "received"
  | "in_progress"
  | "awaiting_parts"
  | "completed"
  | "external_service"
  | "ready_for_pickup"
  | "delivered";

interface Product {
  id: string;
  product_name: string;
  serial_number: string | null;
  status: ServiceStatus;
  service_charge: number | null;
  amount_paid: number | null;
  payment_status: string | null;
  created_at: string;
  completed_date: string | null;
}

const CustomerDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetchProducts();
  }, []);

  const checkAuthAndFetchProducts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/customer");
        return;
      }

      // Check if user is a customer
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isCustomer = roles?.some(r => r.role === "customer");
      
      if (!isCustomer) {
        toast({
          title: "Access Denied",
          description: "This portal is for customers only",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/customer");
        return;
      }

      // Fetch customer profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile) {
        setCustomerName(profile.full_name);
      }

      // Fetch customer's products
      const { data: productsData, error } = await supabase
        .from("products")
        .select("id, product_name, serial_number, status, service_charge, amount_paid, payment_status, created_at, completed_date")
        .eq("customer_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProducts(productsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/customer");
  };

  const calculateBalance = (serviceCharge: number | null, amountPaid: number | null) => {
    const charge = serviceCharge || 0;
    const paid = amountPaid || 0;
    return charge - paid;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Customer Portal</h1>
            {customerName && (
              <p className="text-sm text-muted-foreground">Welcome, {customerName}</p>
            )}
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              My Products
            </CardTitle>
            <CardDescription>
              View the status of your products in service
            </CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No products found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Service Charge</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Registered Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const balance = calculateBalance(product.service_charge, product.amount_paid);
                      const showPaymentDetails = product.status === "completed" || product.status === "delivered";
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.product_name}</TableCell>
                          <TableCell>{product.serial_number || "-"}</TableCell>
                          <TableCell>
                            <StatusBadge status={product.status} />
                          </TableCell>
                          <TableCell>
                            {showPaymentDetails && product.service_charge
                              ? `₹${product.service_charge.toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {showPaymentDetails && product.amount_paid
                              ? `₹${product.amount_paid.toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {showPaymentDetails && balance > 0 ? (
                              <span className="text-destructive font-medium">
                                ₹{balance.toFixed(2)}
                              </span>
                            ) : showPaymentDetails ? (
                              <span className="text-green-600">Paid</span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(product.created_at), "dd/MM/yyyy")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CustomerDashboard;
