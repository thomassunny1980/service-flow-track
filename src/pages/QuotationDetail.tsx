import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Printer, Edit, CheckCircle, XCircle } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import itechLogo from "@/assets/itechlogo.png";

interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Quotation {
  id: string;
  customer_name: string;
  customer_contact: string | null;
  customer_email: string | null;
  items: QuotationItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  validity_date: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
}

interface ShopSettings {
  shop_name: string;
  shop_address: string | null;
  shop_city: string | null;
  shop_state: string | null;
  shop_pincode: string | null;
  shop_phone: string | null;
  shop_email: string | null;
  shop_website: string | null;
  shop_gst: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_branch: string | null;
  upi_id: string | null;
  terms_and_conditions: string | null;
}

const QuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [quotationRes, settingsRes] = await Promise.all([
        supabase.from("quotations").select("*").eq("id", id).single(),
        supabase.from("shop_settings").select("*").limit(1).maybeSingle()
      ]);

      if (quotationRes.error) throw quotationRes.error;

      const quotationData = {
        ...quotationRes.data,
        items: quotationRes.data.items as unknown as QuotationItem[],
        subtotal: Number(quotationRes.data.subtotal),
        tax_rate: Number(quotationRes.data.tax_rate),
        tax_amount: Number(quotationRes.data.tax_amount),
        total_amount: Number(quotationRes.data.total_amount),
      } as Quotation;
      setQuotation(quotationData);

      if (settingsRes.data) {
        setShopSettings(settingsRes.data as ShopSettings);
      }
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

  const updateStatus = async (status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from("quotations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Quotation ${status} successfully`,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getShopAddress = () => {
    if (!shopSettings) return "";
    const parts = [
      shopSettings.shop_address,
      shopSettings.shop_city,
      shopSettings.shop_state,
      shopSettings.shop_pincode
    ].filter(Boolean);
    return parts.join(", ");
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation - ${quotation?.customer_name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }
            .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .logo { max-width: 120px; }
            .company-info { text-align: right; }
            .company-info h2 { color: #333; margin-bottom: 5px; font-size: 18px; }
            .company-info p { font-size: 12px; color: #666; margin: 2px 0; }
            .title { text-align: center; font-size: 22px; margin: 15px 0; color: #333; font-weight: bold; }
            .info-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .info-box { width: 48%; }
            .info-box h3 { background: #f0f0f0; padding: 8px 10px; margin-bottom: 8px; font-size: 14px; }
            .info-box p { padding: 3px 10px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th { background: #333; color: white; padding: 10px; text-align: left; font-size: 13px; }
            td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
            .totals { width: 280px; margin-left: auto; }
            .totals table { margin-bottom: 0; }
            .totals td { border: none; padding: 6px 8px; }
            .totals tr:last-child { font-weight: bold; font-size: 1.1em; border-top: 2px solid #333; }
            .bank-details { margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px; }
            .bank-details h3 { margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .bank-details p { font-size: 12px; margin: 4px 0; }
            .notes { margin-top: 15px; padding: 12px; background: #fff8e1; border-radius: 5px; border: 1px solid #ffe082; }
            .notes h3 { margin-bottom: 8px; font-size: 13px; }
            .notes p { font-size: 12px; white-space: pre-wrap; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 11px; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 15px; font-weight: bold; font-size: 12px; }
            .status-approved { background: #d4edda; color: #155724; }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-rejected { background: #f8d7da; color: #721c24; }
            .two-col { display: flex; gap: 20px; }
            .two-col > div { flex: 1; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const getStatusBadge = (status: string, validityDate: string) => {
    const isExpired = isPast(parseISO(validityDate)) && status === 'pending';
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!quotation) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Quotation not found</p>
          <Button variant="link" onClick={() => navigate("/quotations")}>
            Back to Quotations
          </Button>
        </div>
      </Layout>
    );
  }

  const items = quotation.items as QuotationItem[];
  const shopAddress = getShopAddress();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/quotations")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Quotation Details</h1>
              <p className="text-muted-foreground">
                Created on {format(parseISO(quotation.created_at), "dd MMM yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(quotation.status, quotation.validity_date)}
            {quotation.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  className="text-green-600 border-green-600"
                  onClick={() => updateStatus('approved')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-600"
                  onClick={() => updateStatus('rejected')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => navigate(`/quotations/edit/${id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div ref={printRef}>
              {/* Header with Logo and Company Info */}
              <div className="header flex justify-between items-start mb-6 pb-4 border-b-2">
                <img src={itechLogo} alt="Logo" className="h-16" />
                <div className="text-right">
                  <h2 className="text-xl font-bold">{shopSettings?.shop_name || "iTech Service Center"}</h2>
                  {shopAddress && <p className="text-sm text-muted-foreground">{shopAddress}</p>}
                  {shopSettings?.shop_phone && <p className="text-sm text-muted-foreground">Phone: {shopSettings.shop_phone}</p>}
                  {shopSettings?.shop_email && <p className="text-sm text-muted-foreground">Email: {shopSettings.shop_email}</p>}
                  {shopSettings?.shop_gst && <p className="text-sm text-muted-foreground">GST: {shopSettings.shop_gst}</p>}
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center mb-6">QUOTATION</h1>

              {/* Customer and Quotation Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold bg-muted p-3 mb-3">Customer Details</h3>
                  <div className="space-y-1 px-3">
                    <p><strong>Name:</strong> {quotation.customer_name}</p>
                    {quotation.customer_contact && (
                      <p><strong>Contact:</strong> {quotation.customer_contact}</p>
                    )}
                    {quotation.customer_email && (
                      <p><strong>Email:</strong> {quotation.customer_email}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold bg-muted p-3 mb-3">Quotation Info</h3>
                  <div className="space-y-1 px-3">
                    <p><strong>Date:</strong> {format(parseISO(quotation.created_at), "dd MMM yyyy")}</p>
                    <p><strong>Valid Until:</strong> {format(parseISO(quotation.validity_date), "dd MMM yyyy")}</p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={`status status-${quotation.status}`}>
                        {quotation.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-4">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="p-3 text-left">#</th>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">₹{item.unit_price.toFixed(2)}</td>
                      <td className="p-3 text-right">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-72">
                  <div className="flex justify-between py-2">
                    <span>Subtotal:</span>
                    <span>₹{quotation.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Tax ({quotation.tax_rate}%):</span>
                    <span>₹{quotation.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{quotation.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              {shopSettings && (shopSettings.bank_name || shopSettings.upi_id) && (
                <div className="bank-details bg-muted/50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold mb-3 border-b pb-2">Bank Details for Payment</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {shopSettings.bank_name && (
                      <div className="space-y-1">
                        {shopSettings.bank_name && <p><strong>Bank:</strong> {shopSettings.bank_name}</p>}
                        {shopSettings.bank_branch && <p><strong>Branch:</strong> {shopSettings.bank_branch}</p>}
                        {shopSettings.bank_account_name && <p><strong>Account Name:</strong> {shopSettings.bank_account_name}</p>}
                        {shopSettings.bank_account_number && <p><strong>Account No:</strong> {shopSettings.bank_account_number}</p>}
                        {shopSettings.bank_ifsc && <p><strong>IFSC:</strong> {shopSettings.bank_ifsc}</p>}
                      </div>
                    )}
                    {shopSettings.upi_id && (
                      <div>
                        <p><strong>UPI ID:</strong> {shopSettings.upi_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes / Terms */}
              {(quotation.notes || shopSettings?.terms_and_conditions) && (
                <div className="notes bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                  {quotation.notes && <p className="whitespace-pre-wrap text-sm mb-2">{quotation.notes}</p>}
                  {shopSettings?.terms_and_conditions && !quotation.notes && (
                    <p className="whitespace-pre-wrap text-sm">{shopSettings.terms_and_conditions}</p>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 text-center text-sm text-muted-foreground">
                <p>Thank you for your business!</p>
                <p>This quotation is valid until {format(parseISO(quotation.validity_date), "dd MMM yyyy")}</p>
                {shopSettings?.shop_website && <p className="mt-1">{shopSettings.shop_website}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default QuotationDetail;
