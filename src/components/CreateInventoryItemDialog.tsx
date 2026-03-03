import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreatedItem {
  id: string;
  item_name: string;
  item_code: string | null;
  sale_rate: number;
  quantity: number;
  unit: string | null;
}

interface CreateInventoryItemDialogProps {
  onItemCreated: (item: CreatedItem) => void;
}

const CreateInventoryItemDialog = ({ onItemCreated }: CreateInventoryItemDialogProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    item_name: "",
    item_code: "",
    description: "",
    purchase_rate: 0,
    sale_rate: 0,
    quantity: 0,
    unit: "pcs",
    min_stock_level: 0,
  });

  const resetForm = () => {
    setFormData({
      item_name: "",
      item_code: "",
      description: "",
      purchase_rate: 0,
      sale_rate: 0,
      quantity: 0,
      unit: "pcs",
      min_stock_level: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("inventory")
        .insert([{
          item_name: formData.item_name,
          item_code: formData.item_code || null,
          description: formData.description || null,
          purchase_rate: formData.purchase_rate,
          sale_rate: formData.sale_rate,
          quantity: formData.quantity,
          unit: formData.unit,
          min_stock_level: formData.min_stock_level,
          created_by: session.user.id,
        }])
        .select("id, item_name, item_code, sale_rate, quantity, unit")
        .single();

      if (error) throw error;

      toast({ title: "Success", description: "Item added to inventory" });
      onItemCreated(data as CreatedItem);
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>Create a new inventory item</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_item_name">Item Name *</Label>
            <Input
              id="new_item_name"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new_item_code">Item Code</Label>
              <Input
                id="new_item_code"
                value={formData.item_code}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                placeholder="SKU001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_unit">Unit</Label>
              <Input
                id="new_unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="pcs, kg"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_description">Description</Label>
            <Input
              id="new_description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new_purchase_rate">Purchase Rate (₹)</Label>
              <Input
                id="new_purchase_rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchase_rate}
                onChange={(e) => setFormData({ ...formData, purchase_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_sale_rate">Sale Rate (₹)</Label>
              <Input
                id="new_sale_rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.sale_rate}
                onChange={(e) => setFormData({ ...formData, sale_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new_quantity">Quantity</Label>
              <Input
                id="new_quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_min_stock">Min Stock</Label>
              <Input
                id="new_min_stock"
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInventoryItemDialog;
