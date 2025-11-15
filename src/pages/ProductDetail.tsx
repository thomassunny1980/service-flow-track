import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Edit, MessageSquare, Receipt as ReceiptIcon } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";
import { z } from "zod";
import Receipt from "@/components/Receipt";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const remarkSchema = z.object({
  content: z.string().trim().min(1, "Remark cannot be empty").max(1000, "Remark is too long"),
});

type Product = {
  id: string;
  product_name: string;
  serial_number: string | null;
  customer_name: string;
  customer_contact: string | null;
  status: string;
  external_service_center: string | null;
  external_tracking_number: string | null;
  external_sent_date: string | null;
  external_expected_return: string | null;
  created_at: string;
  updated_at: string;
};

type Remark = {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  profiles: {
    full_name: string;
  };
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [newRemark, setNewRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    fetchProductDetails();
    fetchRemarks();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching product:", error);
      }
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const fetchRemarks = async () => {
    try {
      const { data, error } = await supabase
        .from("remarks")
        .select(`
          id,
          content,
          created_at,
          created_by
        `)
        .eq("product_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.created_by))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const remarksWithProfiles = data.map(remark => ({
          ...remark,
          profiles: profilesMap.get(remark.created_by) || { full_name: "Unknown" },
        }));
        
        setRemarks(remarksWithProfiles as Remark[]);
      } else {
        setRemarks([]);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching remarks:", error);
      }
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;

    setSubmitting(true);
    try {
      const validated = remarkSchema.parse({ content: newRemark });
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("remarks").insert({
        product_id: id,
        content: validated.content,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Remark added successfully");
      setNewRemark("");
      fetchRemarks();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to add remark");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          Loading...
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          Product not found
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{product.product_name}</h1>
              <p className="text-muted-foreground">Product details and history</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowReceipt(true)}>
              <ReceiptIcon className="mr-2 h-4 w-4" />
              Receipt
            </Button>
            <Button onClick={() => navigate(`/products/edit/${product.id}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <StatusBadge status={product.status as any} className="mt-1" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Serial Number</p>
                <p className="mt-1">{product.serial_number || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="mt-1">{format(new Date(product.created_at), "PPP")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="mt-1">{format(new Date(product.updated_at), "PPP")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="mt-1">{product.customer_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact</p>
                <p className="mt-1">{product.customer_contact || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          {product.status === "external_service" && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>External Service Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service Center</p>
                  <p className="mt-1">{product.external_service_center || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tracking Number</p>
                  <p className="mt-1">{product.external_tracking_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sent Date</p>
                  <p className="mt-1">
                    {product.external_sent_date
                      ? format(new Date(product.external_sent_date), "PPP")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expected Return</p>
                  <p className="mt-1">
                    {product.external_expected_return
                      ? format(new Date(product.external_expected_return), "PPP")
                      : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Remarks & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Add a remark or note..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                rows={3}
                maxLength={1000}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {newRemark.length}/1000 characters
                </p>
                <Button onClick={handleAddRemark} disabled={submitting || !newRemark.trim()}>
                  {submitting ? "Adding..." : "Add Remark"}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {remarks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No remarks yet</p>
              ) : (
                remarks.map((remark) => (
                  <div key={remark.id} className="border-l-2 border-primary pl-4 py-2">
                    <p className="text-sm">{remark.content}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{remark.profiles.full_name}</span>
                      <span>•</span>
                      <span>{format(new Date(remark.created_at), "PPP p")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Item Received Acknowledgment</DialogTitle>
            </DialogHeader>
            <Receipt product={product} />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ProductDetail;
