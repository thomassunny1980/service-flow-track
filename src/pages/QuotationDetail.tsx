import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Printer, Edit, CheckCircle, XCircle, Download, FileText, IndianRupee } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import PrintTemplate, { getPrintStyles } from "@/components/PrintTemplate";
import { escapeHtml } from "@/lib/htmlEscape";
import AdvancePaymentDialog from "@/components/AdvancePaymentDialog";

interface QuotationItem {
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

interface Quotation {
  id: string;
  quotation_number: string | null;
  customer_name: string;
  customer_contact: string | null;
  customer_email: string | null;
  customer_address: string | null;
  customer_state: string | null;
  items: QuotationItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  validity_date: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
  advance_paid: number;
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
  const [createdByName, setCreatedByName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
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
        quotation_number: (quotationRes.data as any).quotation_number,
        items: quotationRes.data.items as unknown as QuotationItem[],
        subtotal: Number(quotationRes.data.subtotal),
        tax_rate: Number(quotationRes.data.tax_rate),
        tax_amount: Number(quotationRes.data.tax_amount),
        total_amount: Number(quotationRes.data.total_amount),
        customer_address: (quotationRes.data as any).customer_address || null,
        customer_state: (quotationRes.data as any).customer_state || null,
        advance_paid: Number((quotationRes.data as any).advance_paid || 0),
      } as Quotation;
      setQuotation(quotationData);

      // Fetch creator name
      const createdById = (quotationRes.data as any).created_by;
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

      if (status === 'approved') {
        navigate(`/invoices/new?quotation=${id}`);
      } else {
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveAdvance = async (amount: number) => {
    try {
      const { error } = await supabase
        .from("quotations")
        .update({ advance_paid: amount } as any)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Advance payment of ₹${amount.toLocaleString('en-IN')} recorded`,
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

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const safeTitle = escapeHtml(quotation?.quotation_number || quotation?.customer_name);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation - ${safeTitle}</title>
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

    const safeTitle = escapeHtml(quotation?.quotation_number || quotation?.customer_name);

    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation - ${safeTitle}</title>
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
                {createdByName && <span> by <strong>{createdByName}</strong></span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
            {quotation.status === 'approved' && (
              <Button
                variant="outline"
                className="text-green-600 border-green-600"
                onClick={() => navigate(`/invoices/new?quotation=${id}`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Convert to Invoice
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/quotations/edit/${id}`)}>
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
                type="QUOTATION"
                documentNumber={quotation.quotation_number}
                customerName={quotation.customer_name}
                customerContact={quotation.customer_contact}
                customerEmail={quotation.customer_email}
                customerAddress={quotation.customer_address}
                customerState={quotation.customer_state}
                items={quotation.items}
                subtotal={quotation.subtotal}
                taxAmount={quotation.tax_amount}
                totalAmount={quotation.total_amount}
                createdDate={format(parseISO(quotation.created_at), "d-MMM-yyyy")}
                validityDate={format(parseISO(quotation.validity_date), "d-MMM-yyyy")}
                status={quotation.status}
                notes={quotation.notes}
                shopSettings={shopSettings}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default QuotationDetail;
