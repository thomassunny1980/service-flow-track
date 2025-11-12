import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

const productSchema = z.object({
  product_name: z.string().trim().min(1, "Product name is required").max(200),
  serial_number: z.string().trim().max(100).optional().or(z.literal("")),
  customer_name: z.string().trim().min(1, "Customer name is required").max(200),
  customer_contact: z.string().trim().min(1, "Customer mobile number is required").max(100),
  status: z.enum([
    "received",
    "in_progress",
    "awaiting_parts",
    "completed",
    "external_service",
    "ready_for_pickup",
    "delivered",
  ]),
  external_service_center: z.string().trim().max(200).optional().or(z.literal("")),
  external_tracking_number: z.string().trim().max(100).optional().or(z.literal("")),
});

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_name: "",
    serial_number: "",
    customer_name: "",
    customer_contact: "",
    status: "received",
    external_service_center: "",
    external_tracking_number: "",
    external_sent_date: "",
    external_expected_return: "",
  });

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        product_name: data.product_name,
        serial_number: data.serial_number || "",
        customer_name: data.customer_name,
        customer_contact: data.customer_contact || "",
        status: data.status,
        external_service_center: data.external_service_center || "",
        external_tracking_number: data.external_tracking_number || "",
        external_sent_date: data.external_sent_date || "",
        external_expected_return: data.external_expected_return || "",
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = productSchema.parse(formData);
      
      const productData = {
        ...validated,
        serial_number: validated.serial_number || null,
        customer_contact: validated.customer_contact || null,
        external_service_center: validated.external_service_center || null,
        external_tracking_number: validated.external_tracking_number || null,
        external_sent_date: formData.external_sent_date || null,
        external_expected_return: formData.external_expected_return || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", id);

        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("User not authenticated");
        }

        // Create customer account if customer_contact (mobile) is provided
        let customerId: string | null = null;
        if (productData.customer_contact) {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            
            if (token) {
              const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    mobile: productData.customer_contact,
                    fullName: productData.customer_name,
                  }),
                }
              );

              if (response.ok) {
                const data = await response.json();
                customerId = data.customerId;
              }
            }
          } catch (err) {
            console.error('Failed to create customer account:', err);
            // Continue without customer_id if customer creation fails
          }
        }

        const { error } = await supabase.from("products").insert({
          product_name: productData.product_name,
          serial_number: productData.serial_number,
          customer_name: productData.customer_name,
          customer_contact: productData.customer_contact,
          status: productData.status,
          external_service_center: productData.external_service_center,
          external_tracking_number: productData.external_tracking_number,
          external_sent_date: productData.external_sent_date,
          external_expected_return: productData.external_expected_return,
          created_by: user.id,
          customer_id: customerId,
        });

        if (error) throw error;
        
        if (customerId) {
          toast.success(`Product created! Customer login: ${productData.customer_contact}@customer.local / Password: 123456`, {
            duration: 10000,
          });
        } else {
          toast.success("Product created successfully");
        }
      }

      navigate("/products");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save product");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? "Edit Product" : "New Product"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Update product details" : "Add a new service item"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData({ ...formData, product_name: e.target.value })
                    }
                    required
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) =>
                      setFormData({ ...formData, serial_number: e.target.value })
                    }
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_name: e.target.value })
                    }
                    required
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_contact">Customer Mobile Number *</Label>
                  <Input
                    id="customer_contact"
                    type="tel"
                    placeholder="Mobile number for customer login"
                    value={formData.customer_contact}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_contact: e.target.value })
                    }
                    required
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Customer will receive login credentials automatically
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="external_service">External Service</SelectItem>
                    <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === "external_service" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="external_service_center">
                      External Service Center
                    </Label>
                    <Input
                      id="external_service_center"
                      value={formData.external_service_center}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          external_service_center: e.target.value,
                        })
                      }
                      maxLength={200}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="external_tracking_number">
                        Tracking Number
                      </Label>
                      <Input
                        id="external_tracking_number"
                        value={formData.external_tracking_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            external_tracking_number: e.target.value,
                          })
                        }
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="external_sent_date">Sent Date</Label>
                      <Input
                        id="external_sent_date"
                        type="date"
                        value={formData.external_sent_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            external_sent_date: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="external_expected_return">
                      Expected Return Date
                    </Label>
                    <Input
                      id="external_expected_return"
                      type="date"
                      value={formData.external_expected_return}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          external_expected_return: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/products")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : isEditing ? "Update" : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </Layout>
  );
};

export default ProductForm;
