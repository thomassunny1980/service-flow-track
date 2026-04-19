import { format } from "date-fns";
import logo from "@/assets/itechlogo.png";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DeliveryReceiptProps {
  product: {
    id: string;
    customer_name: string;
    customer_contact: string | null;
    product_name: string;
    serial_number: string | null;
    created_at: string;
    completed_date: string | null;
    service_charge: number | null;
    amount_paid: number | null;
    payment_status: string | null;
    delivered_to: string | null;
    received_by: string | null;
  };
  invoiceNumber: string;
}

const DeliveryReceipt = ({ product, invoiceNumber }: DeliveryReceiptProps) => {
  const [showDetailedPayment, setShowDetailedPayment] = useState(false);
  
  const handlePrint = () => {
    window.print();
  };

  const totalServiceCharge = product.service_charge || 0;
  const amountPaid = product.amount_paid || 0;
  const balanceAmount = totalServiceCharge - amountPaid;

  return (
    <div className="space-y-4">
      <button
        onClick={handlePrint}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 print:hidden"
      >
        Print Invoice
      </button>

      <div className="receipt-container bg-card p-8 border-2 border-border rounded-lg max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-border">
          <img src={logo} alt="I-TECH" className="h-16 w-16 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-primary mb-1">I-TECH SERVICE MANAGEMENT</h1>
          <p className="text-sm text-muted-foreground">For Better Future</p>
        </div>

        {/* Invoice Title & Status */}
        <div className="mb-6 bg-primary/5 p-4 rounded-lg border border-primary/20">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-foreground">SERVICE INVOICE</h2>
              <p className="text-sm text-muted-foreground mt-1">Invoice No: {invoiceNumber}</p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold">
                ✓ DELIVERED SUCCESSFULLY
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b border-border">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Received Date</p>
            <p className="text-base font-medium text-foreground">
              {format(new Date(product.created_at), "PPP")}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Completion Date</p>
            <p className="text-base font-medium text-foreground">
              {product.completed_date ? format(new Date(product.completed_date), "PPP") : "N/A"}
            </p>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-6 pb-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground mb-3 uppercase">Bill To</h3>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">{product.customer_name}</p>
            {product.customer_contact && (
              <p className="text-sm text-muted-foreground">Contact: {product.customer_contact}</p>
            )}
          </div>
        </div>

        {/* Service Details */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3 uppercase">Service Details</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase">Description</th>
                <th className="text-right py-2 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3">
                  <p className="font-medium text-foreground">{product.product_name}</p>
                  {product.serial_number && (
                    <p className="text-sm text-muted-foreground">S/N: {product.serial_number}</p>
                  )}
                </td>
                <td className="text-right font-medium text-foreground">
                  ₹{(product.service_charge || 0).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Summary */}
        <div className="mb-6 bg-muted/30 p-4 rounded-lg">
          <div className="space-y-3">
            {/* Total Summary */}
            <div className="flex justify-between items-center text-base pb-2 border-b border-border">
              <span className="font-bold text-foreground">Total Service Amount:</span>
              <span className="font-bold text-foreground text-lg">₹{totalServiceCharge.toFixed(2)}</span>
            </div>

            {/* Detailed Payment Toggle Button */}
            <button
              onClick={() => setShowDetailedPayment(!showDetailedPayment)}
              className="w-full flex items-center justify-between text-sm font-semibold text-primary hover:text-primary/80 transition-colors py-2 print:hidden"
            >
              <span>Detailed Payment Breakdown</span>
              {showDetailedPayment ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* Detailed Payment Breakdown */}
            <div className={showDetailedPayment ? "space-y-2 pt-2 border-t border-border" : "hidden print:block space-y-2 pt-2 border-t border-border"}>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Service Charge:</span>
                <span className="font-medium text-foreground">₹{totalServiceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Received:</span>
                <span className="font-medium text-foreground">₹{amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Balance Due:</span>
                <span className={`font-bold text-lg ${balanceAmount > 0 ? 'text-accent' : 'text-primary'}`}>
                  ₹{balanceAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Status Badge */}
            <div className="pt-3 border-t border-border">
              {balanceAmount === 0 && amountPaid > 0 && (
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-md text-center font-bold">
                  ✓ PAID IN FULL
                </div>
              )}
              {balanceAmount > 0 && amountPaid > 0 && (
                <div className="bg-amber-500/10 text-amber-600 dark:text-amber-500 px-4 py-2 rounded-md text-center font-bold">
                  ⚠ PARTIAL PAYMENT - Balance: ₹{balanceAmount.toFixed(2)}
                </div>
              )}
              {amountPaid === 0 && (
                <div className="bg-accent/10 text-accent px-4 py-2 rounded-md text-center font-bold">
                  ⚠ PAYMENT PENDING - Full Balance: ₹{balanceAmount.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="mb-6 pb-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground mb-3 uppercase">Delivery Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Delivered To</p>
              <p className="text-base font-medium text-foreground">{product.delivered_to || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Handed Over By</p>
              <p className="text-base font-medium text-foreground">{product.received_by || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-6 uppercase">Customer Signature</p>
            <div className="border-t border-foreground"></div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-6 uppercase">Authorized Signature</p>
            <div className="border-t border-foreground"></div>
          </div>
        </div>

        {/* Terms */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-xs font-bold text-foreground mb-2 uppercase">Terms & Conditions</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• This invoice serves as proof of service completion and delivery</li>
            <li>• Warranty terms apply as per service agreement</li>
            <li>• Please retain this invoice for future reference</li>
            {balanceAmount > 0 && <li>• Balance amount must be paid within 7 days</li>}
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Thank you for choosing I-TECH Service Management</p>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">For Better Future</p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryReceipt;
