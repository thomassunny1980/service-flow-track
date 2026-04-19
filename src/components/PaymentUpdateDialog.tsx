import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentUpdateDialogProps {
  productId: string;
  serviceCharge: number;
  currentAmountPaid: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const PaymentUpdateDialog = ({ 
  productId, 
  serviceCharge, 
  currentAmountPaid, 
  open, 
  onOpenChange, 
  onComplete 
}: PaymentUpdateDialogProps) => {
  const [additionalPayment, setAdditionalPayment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const calculateNewTotal = () => {
    const additional = parseFloat(additionalPayment || "0");
    return currentAmountPaid + additional;
  };

  const calculateBalance = () => {
    return serviceCharge - calculateNewTotal();
  };

  const getPaymentStatus = () => {
    const newTotal = calculateNewTotal();
    if (newTotal >= serviceCharge) return "paid";
    if (newTotal > 0) return "partial";
    return "pending";
  };

  const handleSubmit = async () => {
    const additional = parseFloat(additionalPayment);

    if (isNaN(additional) || additional <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    const newTotal = calculateNewTotal();
    if (newTotal > serviceCharge) {
      toast.error("Payment amount exceeds the service charge");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          amount_paid: newTotal,
          payment_status: getPaymentStatus(),
        })
        .eq("id", productId);

      if (error) throw error;

      toast.success("Payment updated successfully");
      onComplete();
      onOpenChange(false);
      setAdditionalPayment("");
    } catch (error: any) {
      console.error("Error updating payment:", error);
      toast.error(error.message || "Failed to update payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Service Charge:</span>
              <span className="font-medium">₹{serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Previously Paid:</span>
              <span className="font-medium">₹{currentAmountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm text-muted-foreground">Current Balance:</span>
              <span className="font-medium text-destructive">
                ₹{(serviceCharge - currentAmountPaid).toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="additionalPayment">Additional Payment Amount (₹) *</Label>
            <Input
              id="additionalPayment"
              type="number"
              step="0.01"
              min="0"
              max={serviceCharge - currentAmountPaid}
              placeholder="0.00"
              value={additionalPayment}
              onChange={(e) => setAdditionalPayment(e.target.value)}
            />
          </div>

          {additionalPayment && parseFloat(additionalPayment) > 0 && (
            <div className="p-4 bg-primary/10 rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">New Total Paid:</span>
                <span className="font-semibold">₹{calculateNewTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Remaining Balance:</span>
                <span className="font-semibold">
                  ₹{calculateBalance().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">New Status:</span>
                <span className="font-semibold capitalize">{getPaymentStatus()}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Processing..." : "Update Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentUpdateDialog;
