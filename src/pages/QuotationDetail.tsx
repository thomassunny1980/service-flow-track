import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const QuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchQuotation();
    }
  }, [id]);

  const fetchQuotation = async () => {
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      const quotationData = {
        ...data,
        items: data.items as unknown as QuotationItem[],
        subtotal: Number(data.subtotal),
        tax_rate: Number(data.tax_rate),
        tax_amount: Number(data.tax_amount),
        total_amount: Number(data.total_amount),
      } as Quotation;
      setQuotation(quotationData);
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
      fetchQuotation();
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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation - ${quotation?.customer_name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .logo { max-width: 150px; }
            .company-info { text-align: right; }
            .company-info h2 { color: #333; margin-bottom: 5px; }
            .title { text-align: center; font-size: 24px; margin: 20px 0; color: #333; }
            .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-box { width: 48%; }
            .info-box h3 { background: #f5f5f5; padding: 10px; margin-bottom: 10px; }
            .info-box p { padding: 5px 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #333; color: white; padding: 12px; text-align: left; }
            td { border: 1px solid #ddd; padding: 10px; }
            .totals { width: 300px; margin-left: auto; }
            .totals table { margin-bottom: 0; }
            .totals td { border: none; padding: 8px; }
            .totals tr:last-child { font-weight: bold; font-size: 1.1em; border-top: 2px solid #333; }
            .notes { margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 5px; }
            .notes h3 { margin-bottom: 10px; }
            .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            .status-approved { background: #d4edda; color: #155724; }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-rejected { background: #f8d7da; color: #721c24; }
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
              <div className="header flex justify-between items-start mb-8 pb-6 border-b-2">
                <img src={itechLogo} alt="iTech Logo" className="h-16" />
                <div className="text-right">
                  <h2 className="text-xl font-bold">iTech Service Center</h2>
                  <p className="text-muted-foreground">Professional IT Services</p>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center mb-8">QUOTATION</h1>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold bg-muted p-3 mb-3">Customer Details</h3>
                  <div className="space-y-2 px-3">
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
                  <div className="space-y-2 px-3">
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

              <table className="w-full mb-6">
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

              <div className="flex justify-end">
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

              {quotation.notes && (
                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Notes / Terms</h3>
                  <p className="whitespace-pre-wrap">{quotation.notes}</p>
                </div>
              )}

              <div className="mt-12 text-center text-sm text-muted-foreground">
                <p>Thank you for your business!</p>
                <p>This quotation is valid until {format(parseISO(quotation.validity_date), "dd MMM yyyy")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default QuotationDetail;
