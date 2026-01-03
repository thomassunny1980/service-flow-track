import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { addDays, format } from "date-fns";

interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const QuotationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_contact: "",
    customer_email: "",
    validity_date: format(addDays(new Date(), 15), "yyyy-MM-dd"),
    notes: "",
    tax_rate: 18,
  });
  const [items, setItems] = useState<QuotationItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, total: 0 },
  ]);

  useEffect(() => {
    checkAuth();
    if (id) {
      fetchQuotation();
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchQuotation = async () => {
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          customer_name: data.customer_name,
          customer_contact: data.customer_contact || "",
          customer_email: data.customer_email || "",
          validity_date: data.validity_date,
          notes: data.notes || "",
          tax_rate: Number(data.tax_rate) || 18,
        });
        setItems((data.items as unknown as QuotationItem[]) || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, total: 0 },
    ]);
  };

  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== itemId));
    }
  };

  const updateItem = (itemId: string, field: keyof QuotationItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "unit_price") {
            updatedItem.total = updatedItem.quantity * updatedItem.unit_price;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * formData.tax_rate) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { subtotal, taxAmount, total } = calculateTotals();

      const quotationData = {
        customer_name: formData.customer_name,
        customer_contact: formData.customer_contact || null,
        customer_email: formData.customer_email || null,
        validity_date: formData.validity_date,
        notes: formData.notes || null,
        tax_rate: formData.tax_rate,
        items: JSON.parse(JSON.stringify(items)),
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        created_by: session.user.id,
      };

      if (id) {
        const { error } = await supabase
          .from("quotations")
          .update(quotationData)
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Quotation updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("quotations")
          .insert([quotationData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Quotation created successfully",
        });
      }

      navigate("/quotations");
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

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/quotations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {id ? "Edit Quotation" : "New Quotation"}
            </h1>
            <p className="text-muted-foreground">
              {id ? "Update quotation details" : "Create a new quotation for a customer"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_contact">Contact Number</Label>
                <Input
                  id="customer_contact"
                  value={formData.customer_contact}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_contact: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_email: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quotation Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="validity_date">Valid Until *</Label>
                <Input
                  id="validity_date"
                  type="date"
                  value={formData.validity_date}
                  onChange={(e) =>
                    setFormData({ ...formData, validity_date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.tax_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="grid gap-4 md:grid-cols-12 items-end border-b pb-4">
                  <div className="md:col-span-5 space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Unit Price (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Total (₹)</Label>
                    <Input value={item.total.toFixed(2)} readOnly className="bg-muted" />
                  </div>
                  <div className="md:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax ({formData.tax_rate}%):</span>
                    <span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or terms..."
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate("/quotations")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : id ? "Update Quotation" : "Create Quotation"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default QuotationForm;
