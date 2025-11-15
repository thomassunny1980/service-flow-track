import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompletionDialogProps {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const CompletionDialog = ({ productId, open, onOpenChange, onComplete }: CompletionDialogProps) => {
  const [serviceCharge, setServiceCharge] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "partial">("paid");
  const [deliveredTo, setDeliveredTo] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!serviceCharge || !deliveredTo || !receivedBy) {
      toast.error("Please fill in all required fields");
      return;
    }

    const charge = parseFloat(serviceCharge);
    const paid = parseFloat(amountPaid || "0");

    if (isNaN(charge) || charge < 0) {
      toast.error("Please enter a valid service charge");
      return;
    }

    if (isNaN(paid) || paid < 0) {
      toast.error("Please enter a valid amount paid");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          status: "delivered",
          service_charge: charge,
          amount_paid: paid,
          payment_status: paymentStatus,
          completed_date: new Date().toISOString(),
          delivered_to: deliveredTo,
          received_by: receivedBy,
        })
        .eq("id", productId);

      if (error) throw error;

      toast.success("Service completed and payment recorded");
      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error completing service:", error);
      toast.error(error.message || "Failed to complete service");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Service & Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="serviceCharge">Service Charge (₹) *</Label>
            <Input
              id="serviceCharge"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="amountPaid">Amount Paid (₹)</Label>
            <Input
              id="amountPaid"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="paymentStatus">Payment Status</Label>
            <Select value={paymentStatus} onValueChange={(value: any) => setPaymentStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial Payment</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="deliveredTo">Delivered To (Customer Name) *</Label>
            <Input
              id="deliveredTo"
              placeholder="Enter customer/receiver name"
              value={deliveredTo}
              onChange={(e) => setDeliveredTo(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="receivedBy">Handed Over By (Staff Name) *</Label>
            <Input
              id="receivedBy"
              placeholder="Enter staff name"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Processing..." : "Complete & Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionDialog;
