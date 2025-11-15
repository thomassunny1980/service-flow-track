import { format } from "date-fns";
import logo from "@/assets/itechlogo.png";

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
  const handlePrint = () => {
    window.print();
  };

  const balanceAmount = (product.service_charge || 0) - (product.amount_paid || 0);

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
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service Charge:</span>
              <span className="font-medium text-foreground">₹{(product.service_charge || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-medium text-foreground">₹{(product.amount_paid || 0).toFixed(2)}</span>
            </div>
            {balanceAmount > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-accent font-semibold">Balance Due:</span>
                <span className="font-bold text-accent">₹{balanceAmount.toFixed(2)}</span>
              </div>
            )}
            {balanceAmount <= 0 && (
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-primary font-semibold">Payment Status:</span>
                <span className="font-bold text-primary">PAID IN FULL</span>
              </div>
            )}
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
