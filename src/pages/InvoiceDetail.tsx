import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Printer, Edit, Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import itechLogo from "@/assets/itechlogo.png";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  tax_name?: string;
  tax_amount?: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string | null;
  customer_name: string;
  customer_contact: string | null;
  customer_email: string | null;
  items: InvoiceItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  due_date: string | null;
  status: string;
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

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
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
      const [invoiceRes, settingsRes] = await Promise.all([
        supabase.from("invoices").select("*").eq("id", id).single(),
        supabase.from("shop_settings").select("*").limit(1).maybeSingle()
      ]);

      if (invoiceRes.error) throw invoiceRes.error;

      const invoiceData = {
        ...invoiceRes.data,
        items: invoiceRes.data.items as unknown as InvoiceItem[],
        subtotal: Number(invoiceRes.data.subtotal),
        tax_amount: Number(invoiceRes.data.tax_amount),
        total_amount: Number(invoiceRes.data.total_amount),
      } as Invoice;
      setInvoice(invoiceData);

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

  const getPrintStyles = () => `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }
    .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
    .logo { max-width: 120px; }
    .company-info { text-align: right; }
    .company-info h2 { color: #333; margin-bottom: 5px; font-size: 18px; }
    .company-info p { font-size: 12px; color: #666; margin: 2px 0; }
    .title { text-align: center; font-size: 22px; margin: 15px 0; color: #333; font-weight: bold; }
    .invoice-number { text-align: center; font-size: 14px; color: #666; margin-bottom: 15px; }
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
    .status-paid { background: #d4edda; color: #155724; }
    .status-unpaid { background: #fff3cd; color: #856404; }
    .status-overdue { background: #f8d7da; color: #721c24; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  `;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoice?.invoice_number || invoice?.customer_name}</title>
          <style>${getPrintStyles()}</style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = async () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoice?.invoice_number || invoice?.customer_name}</title>
          <style>${getPrintStyles()}</style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    iframeDoc.close();

    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);

    toast({
      title: "Download PDF",
      description: "Use 'Save as PDF' in the print dialog to download",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500">Partial</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Unpaid</Badge>;
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

  if (!invoice) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Invoice not found</p>
          <Button variant="link" onClick={() => navigate("/invoices")}>
            Back to Invoices
          </Button>
        </div>
      </Layout>
    );
  }

  const items = invoice.items as InvoiceItem[];
  const shopAddress = getShopAddress();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Invoice Details</h1>
              <p className="text-muted-foreground">
                Created on {format(parseISO(invoice.created_at), "dd MMM yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(invoice.status)}
            <Button variant="outline" onClick={() => navigate(`/invoices/edit/${id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
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

              <h1 className="text-2xl font-bold text-center mb-2">INVOICE</h1>
              {invoice.invoice_number && (
                <p className="invoice-number text-center text-muted-foreground mb-6">
                  #{invoice.invoice_number}
                </p>
              )}

              {/* Customer and Invoice Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold bg-muted p-3 mb-3">Customer Details</h3>
                  <div className="space-y-1 px-3">
                    <p><strong>Name:</strong> {invoice.customer_name}</p>
                    {invoice.customer_contact && (
                      <p><strong>Contact:</strong> {invoice.customer_contact}</p>
                    )}
                    {invoice.customer_email && (
                      <p><strong>Email:</strong> {invoice.customer_email}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold bg-muted p-3 mb-3">Invoice Info</h3>
                  <div className="space-y-1 px-3">
                    <p><strong>Date:</strong> {format(parseISO(invoice.created_at), "dd MMM yyyy")}</p>
                    {invoice.due_date && (
                      <p><strong>Due Date:</strong> {format(parseISO(invoice.due_date), "dd MMM yyyy")}</p>
                    )}
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={`status status-${invoice.status}`}>
                        {invoice.status.toUpperCase()}
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
                    <span>₹{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Tax:</span>
                    <span>₹{invoice.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{invoice.total_amount.toFixed(2)}</span>
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
              {(invoice.notes || shopSettings?.terms_and_conditions) && (
                <div className="notes bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Terms & Notes</h3>
                  {invoice.notes && <p className="text-sm mb-2">{invoice.notes}</p>}
                  {shopSettings?.terms_and_conditions && (
                    <p className="text-sm whitespace-pre-wrap">{shopSettings.terms_and_conditions}</p>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="footer mt-8 text-center text-muted-foreground text-sm">
                <p>Thank you for your business!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InvoiceDetail;
