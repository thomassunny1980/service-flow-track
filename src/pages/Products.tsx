import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Eye } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";

type Product = {
  id: string;
  product_name: string;
  serial_number: string | null;
  customer_name: string;
  customer_contact: string | null;
  status: string;
  service_charge: number | null;
  amount_paid: number | null;
  created_at: string;
  updated_at: string;
};

const Products = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get("payment") || "all");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching products:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === "all" || product.status === statusFilter;

    let matchesPayment = true;
    if (paymentFilter !== "all") {
      const serviceCharge = product.service_charge || 0;
      const amountPaid = product.amount_paid || 0;

      if (paymentFilter === "paid") {
        matchesPayment = serviceCharge > 0 && amountPaid >= serviceCharge;
      } else if (paymentFilter === "partial") {
        matchesPayment = serviceCharge > 0 && amountPaid > 0 && amountPaid < serviceCharge;
      } else if (paymentFilter === "pending") {
        matchesPayment = serviceCharge > 0 && amountPaid === 0;
      } else if (paymentFilter === "received") {
        matchesPayment = amountPaid > 0;
      } else if (paymentFilter === "balance") {
        matchesPayment = serviceCharge > 0 && amountPaid < serviceCharge;
      }
    }

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage all service items</p>
          </div>
          <Button onClick={() => navigate("/products/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products, customers, or serial numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="external_service">External Service</SelectItem>
              <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid in Full</SelectItem>
              <SelectItem value="partial">Partial Payment</SelectItem>
              <SelectItem value="pending">Pending Payment</SelectItem>
              <SelectItem value="received">Has Payments</SelectItem>
              <SelectItem value="balance">Has Balance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Service Charge</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.product_name}
                    </TableCell>
                    <TableCell>{product.serial_number || "-"}</TableCell>
                    <TableCell>{product.customer_name}</TableCell>
                    <TableCell>{product.customer_contact || "-"}</TableCell>
                    <TableCell>
                      {product.service_charge ? `₹${product.service_charge.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      {product.amount_paid ? `₹${product.amount_paid.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      {product.service_charge 
                        ? `₹${((product.service_charge || 0) - (product.amount_paid || 0)).toFixed(2)}` 
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={product.status as any} />
                    </TableCell>
                    <TableCell>
                      {format(new Date(product.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
