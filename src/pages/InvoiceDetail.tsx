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
import PrintTemplate, { getPrintStyles } from "@/components/PrintTemplate";
import { escapeHtml } from "@/lib/htmlEscape";

interface InvoiceItem {
  id: string;
  item_name?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  tax_name?: string;
  tax_amount?: number;
  total: number;
  unit?: string;
}

interface Invoice {
  id: string;
  invoice_number: string | null;
  customer_name: string;
  customer_contact: string | null;
  customer_email: string | null;
  customer_address: string | null;
  customer_state: string | null;
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
  const [createdByName, setCreatedByName] = useState<string | null>(null);
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
        customer_address: (invoiceRes.data as any).customer_address || null,
        customer_state: (invoiceRes.data as any).customer_state || null,
      } as Invoice;
      setInvoice(invoiceData);

      // Fetch creator name
      const createdById = (invoiceRes.data as any).created_by;
      if (createdById) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", createdById)
          .maybeSingle();
        if (profileData) setCreatedByName(profileData.full_name);
      }

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

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const safeTitle = escapeHtml(invoice?.invoice_number || invoice?.customer_name);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${safeTitle}</title>
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

    const safeTitle = escapeHtml(invoice?.invoice_number || invoice?.customer_name);

    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${safeTitle}</title>
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
                {createdByName && <span> by <strong>{createdByName}</strong></span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
              <PrintTemplate
                type="INVOICE"
                documentNumber={invoice.invoice_number}
                customerName={invoice.customer_name}
                customerContact={invoice.customer_contact}
                customerEmail={invoice.customer_email}
                customerAddress={invoice.customer_address}
                customerState={invoice.customer_state}
                items={invoice.items}
                subtotal={invoice.subtotal}
                taxAmount={invoice.tax_amount}
                totalAmount={invoice.total_amount}
                createdDate={format(parseISO(invoice.created_at), "d-MMM-yyyy")}
                dueDate={invoice.due_date ? format(parseISO(invoice.due_date), "d-MMM-yyyy") : null}
                status={invoice.status}
                notes={invoice.notes}
                shopSettings={shopSettings}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InvoiceDetail;
