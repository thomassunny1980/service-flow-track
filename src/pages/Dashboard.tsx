import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Wrench, Clock, CheckCircle, Send, Truck, FileCheck, IndianRupee, TrendingUp, AlertCircle, FileText, Receipt, XCircle, CreditCard } from "lucide-react";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";

type StatusCounts = {
  received: number;
  in_progress: number;
  awaiting_parts: number;
  completed: number;
  external_service: number;
  ready_for_pickup: number;
  delivered: number;
};

type PaymentSummary = {
  totalServiceAmount: number;
  totalReceived: number;
  totalBalance: number;
  paidCount: number;
  partialCount: number;
  pendingCount: number;
};

type QuotationSummary = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

type InvoiceSummary = {
  unpaid: number;
  partial: number;
  paid: number;
  overdue: number;
  total: number;
  totalAmount: number;
  totalPaid: number;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<StatusCounts>({
    received: 0,
    in_progress: 0,
    awaiting_parts: 0,
    completed: 0,
    external_service: 0,
    ready_for_pickup: 0,
    delivered: 0,
  });
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    totalServiceAmount: 0,
    totalReceived: 0,
    totalBalance: 0,
    paidCount: 0,
    partialCount: 0,
    pendingCount: 0,
  });
  const [quotationSummary, setQuotationSummary] = useState<QuotationSummary>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary>({
    unpaid: 0,
    partial: 0,
    paid: 0,
    overdue: 0,
    total: 0,
    totalAmount: 0,
    totalPaid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    fetchStatusCounts();
    fetchPaymentSummary();
    fetchUserProfile();
    fetchQuotationSummary();
    fetchInvoiceSummary();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserName(profile.full_name);
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching user profile:", error);
      }
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("status");

      if (error) throw error;

      const newCounts: StatusCounts = {
        received: 0,
        in_progress: 0,
        awaiting_parts: 0,
        completed: 0,
        external_service: 0,
        ready_for_pickup: 0,
        delivered: 0,
      };

      data?.forEach((product) => {
        if (product.status in newCounts) {
          newCounts[product.status as keyof StatusCounts]++;
        }
      });

      setCounts(newCounts);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching status counts:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSummary = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("service_charge, amount_paid, payment_status");

      if (error) throw error;

      let totalService = 0;
      let totalPaid = 0;
      let paidFull = 0;
      let partial = 0;
      let pending = 0;

      data?.forEach((product) => {
        const serviceCharge = product.service_charge || 0;
        const amountPaid = product.amount_paid || 0;
        
        totalService += serviceCharge;
        totalPaid += amountPaid;

        if (serviceCharge > 0) {
          if (amountPaid === 0) {
            pending++;
          } else if (amountPaid >= serviceCharge) {
            paidFull++;
          } else {
            partial++;
          }
        }
      });

      setPaymentSummary({
        totalServiceAmount: totalService,
        totalReceived: totalPaid,
        totalBalance: totalService - totalPaid,
        paidCount: paidFull,
        partialCount: partial,
        pendingCount: pending,
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching payment summary:", error);
      }
    }
  };

  const fetchQuotationSummary = async () => {
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select("status");

      if (error) throw error;

      let pending = 0;
      let approved = 0;
      let rejected = 0;

      data?.forEach((quotation) => {
        switch (quotation.status) {
          case 'pending':
            pending++;
            break;
          case 'approved':
            approved++;
            break;
          case 'rejected':
            rejected++;
            break;
        }
      });

      setQuotationSummary({
        pending,
        approved,
        rejected,
        total: data?.length || 0,
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching quotation summary:", error);
      }
    }
  };

  const fetchInvoiceSummary = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("status, total_amount, amount_paid");

      if (error) throw error;

      let unpaid = 0;
      let partial = 0;
      let paid = 0;
      let overdue = 0;
      let totalAmount = 0;
      let totalPaid = 0;

      data?.forEach((invoice) => {
        totalAmount += Number(invoice.total_amount) || 0;
        totalPaid += Number(invoice.amount_paid) || 0;
        
        switch (invoice.status) {
          case 'unpaid':
            unpaid++;
            break;
          case 'partial':
            partial++;
            break;
          case 'paid':
            paid++;
            break;
          case 'overdue':
            overdue++;
            break;
        }
      });

      setInvoiceSummary({
        unpaid,
        partial,
        paid,
        overdue,
        total: data?.length || 0,
        totalAmount,
        totalPaid,
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching invoice summary:", error);
      }
    }
  };

  const statusCards = [
    {
      title: "Received",
      count: counts.received,
      icon: Package,
      color: "text-status-received",
      bgColor: "bg-status-received/10",
    },
    {
      title: "In Progress",
      count: counts.in_progress,
      icon: Wrench,
      color: "text-status-inProgress",
      bgColor: "bg-status-inProgress/10",
    },
    {
      title: "Awaiting Parts",
      count: counts.awaiting_parts,
      icon: Clock,
      color: "text-status-awaitingParts",
      bgColor: "bg-status-awaitingParts/10",
    },
    {
      title: "Completed",
      count: counts.completed,
      icon: CheckCircle,
      color: "text-status-completed",
      bgColor: "bg-status-completed/10",
    },
    {
      title: "External Service",
      count: counts.external_service,
      icon: Send,
      color: "text-status-external",
      bgColor: "bg-status-external/10",
    },
    {
      title: "Ready for Pickup",
      count: counts.ready_for_pickup,
      icon: FileCheck,
      color: "text-status-ready",
      bgColor: "bg-status-ready/10",
    },
    {
      title: "Delivered",
      count: counts.delivered,
      icon: Truck,
      color: "text-status-delivered",
      bgColor: "bg-status-delivered/10",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Overview of all service operations and payments
              </p>
            </div>
            {userName && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Logged in as</p>
                <p className="text-lg font-semibold">{userName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary Section */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 rounded-lg border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Payment Summary</h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card 
              className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate('/products?payment=all')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <IndianRupee className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">₹{paymentSummary.totalServiceAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Service charges</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate('/products?payment=received')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Received</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">₹{paymentSummary.totalReceived.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Amount paid</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate('/products?payment=balance')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance</CardTitle>
                <AlertCircle className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">₹{paymentSummary.totalBalance.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Outstanding</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate('/products?payment=paid')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <CheckCircle className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{paymentSummary.paidCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Full payments</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate('/products?payment=partial')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Partial</CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{paymentSummary.partialCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Partial paid</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate('/products?payment=pending')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <AlertCircle className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{paymentSummary.pendingCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Not paid</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Service Status Section */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Service Status</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statusCards.map((card) => (
              <Card
                key={card.title}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate(`/products?status=${card.title.toLowerCase().replace(/ /g, '_')}`)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <div className={`${card.bgColor} rounded-full p-2`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "..." : card.count}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {card.count === 1 ? "item" : "items"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quotations & Invoices Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quotation Summary */}
          <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Quotations</h2>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="grid gap-3 grid-cols-2">
              <Card 
                className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate('/quotations?status=pending')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold text-amber-600">{quotationSummary.pending}</div>
                </CardContent>
              </Card>

              <Card 
                className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate('/quotations?status=approved')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">Approved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold text-green-600">{quotationSummary.approved}</div>
                </CardContent>
              </Card>

              <Card 
                className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate('/quotations?status=rejected')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold text-red-600">{quotationSummary.rejected}</div>
                </CardContent>
              </Card>

              <Card 
                className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate('/quotations')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold text-blue-600">{quotationSummary.total}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Invoice Payment Summary */}
          <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Invoice Payments</h2>
              <Receipt className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="grid gap-3 grid-cols-3 mb-4">
              <Card 
                className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate('/invoices')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                  <IndianRupee className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl font-bold text-foreground">₹{invoiceSummary.totalAmount.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card 
                className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate('/invoices?status=paid')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">Received</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl font-bold text-green-600">₹{invoiceSummary.totalPaid.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card 
                className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate('/invoices?status=unpaid')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">Balance</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xl font-bold text-red-600">₹{(invoiceSummary.totalAmount - invoiceSummary.totalPaid).toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-3 grid-cols-4">
              <Card 
                className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate('/invoices?status=unpaid')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold text-red-600">{invoiceSummary.unpaid}</div>
                </CardContent>
              </Card>

              <Card 
                className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate('/invoices?status=partial')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">Partial</CardTitle>
                  <CreditCard className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold text-amber-600">{invoiceSummary.partial}</div>
                </CardContent>
              </Card>

              <Card 
                className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate('/invoices?status=paid')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">Paid</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold text-green-600">{invoiceSummary.paid}</div>
                </CardContent>
              </Card>

              <Card 
                className="bg-card/50 backdrop-blur cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate('/invoices')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Receipt className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold text-emerald-600">{invoiceSummary.total}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Total Service Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {loading
                ? "..."
                : Object.values(counts).reduce((sum, count) => sum + count, 0)}
            </div>
            <p className="text-muted-foreground">
              Total products in service
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
