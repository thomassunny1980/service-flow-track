import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdvancePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAdvance: number;
  totalAmount: number;
  onSave: (amount: number) => void;
}

const AdvancePaymentDialog = ({ open, onOpenChange, currentAdvance, totalAmount, onSave }: AdvancePaymentDialogProps) => {
  const [amount, setAmount] = useState(String(currentAdvance || ""));

  const handleSave = () => {
    const parsed = parseFloat(amount) || 0;
    if (parsed < 0) return;
    if (parsed > totalAmount) return;
    onSave(parsed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Record Advance Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total Amount:</span>
            <span>₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="advance_amount">Advance Amount (₹)</Label>
            <Input
              id="advance_amount"
              type="number"
              min="0"
              max={totalAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter advance amount"
            />
          </div>
          {parseFloat(amount) > totalAmount && (
            <p className="text-sm text-destructive">Amount cannot exceed total</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={parseFloat(amount) > totalAmount}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancePaymentDialog;
