import { format } from "date-fns";
import logo from "@/assets/itechlogo.png";

interface ReceiptProps {
  product: {
    id: string;
    customer_name: string;
    customer_contact: string | null;
    product_name: string;
    serial_number: string | null;
    created_at: string;
    status: string;
  };
}

const Receipt = ({ product }: ReceiptProps) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handlePrint}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 print:hidden"
      >
        Print Receipt
      </button>

      <div className="receipt-container bg-card p-8 border-2 border-border rounded-lg max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-border">
          <img src={logo} alt="I-TECH" className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary mb-2">I-TECH SERVICE MANAGEMENT</h1>
          <p className="text-sm text-muted-foreground">For Better Future</p>
        </div>

        {/* Receipt Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">ITEM RECEIVED ACKNOWLEDGMENT</h2>
          <p className="text-sm text-muted-foreground">Receipt ID: {product.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Receipt Details */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Received Date:</p>
              <p className="text-base font-medium text-foreground">
                {format(new Date(product.created_at), "PPP")}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Received Time:</p>
              <p className="text-base font-medium text-foreground">
                {format(new Date(product.created_at), "p")}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-lg font-bold text-foreground mb-3">Customer Information</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Name:</p>
                <p className="text-base font-medium text-foreground">{product.customer_name}</p>
              </div>
              {product.customer_contact && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Contact:</p>
                  <p className="text-base font-medium text-foreground">{product.customer_contact}</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-lg font-bold text-foreground mb-3">Product Information</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Product Name:</p>
                <p className="text-base font-medium text-foreground">{product.product_name}</p>
              </div>
              {product.serial_number && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Serial Number:</p>
                  <p className="text-base font-medium text-foreground">{product.serial_number}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Status:</p>
                <p className="text-base font-medium text-foreground capitalize">
                  {product.status.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="pt-6 border-t-2 border-border">
          <h3 className="text-sm font-bold text-foreground mb-2">Terms & Conditions:</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Please keep this receipt for tracking your service request</li>
            <li>• Service timeline will be communicated separately</li>
            <li>• Additional charges may apply for parts and labor</li>
            <li>• Valid ID required for item pickup</li>
          </ul>
        </div>

        {/* Signature Section */}
        <div className="grid grid-cols-2 gap-8 pt-8 mt-8 border-t border-border">
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-8">Customer Signature:</p>
            <div className="border-t border-foreground"></div>
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-8">Staff Signature:</p>
            <div className="border-t border-foreground"></div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">Thank you for choosing I-TECH Service Management</p>
          <p className="text-xs text-muted-foreground mt-1">For inquiries, please contact us with your Receipt ID</p>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
