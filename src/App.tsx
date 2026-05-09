import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CustomerAuth from "./pages/CustomerAuth";
import CustomerDashboard from "./pages/CustomerDashboard";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import ProductDetail from "./pages/ProductDetail";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import Quotations from "./pages/Quotations";
import QuotationForm from "./pages/QuotationForm";
import QuotationDetail from "./pages/QuotationDetail";
import Inventory from "./pages/Inventory";
import Invoices from "./pages/Invoices";
import InvoiceForm from "./pages/InvoiceForm";
import InvoiceDetail from "./pages/InvoiceDetail";
import Cashbook from "./pages/Cashbook";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import Companies from "./pages/Companies";
import Assets from "./pages/Assets";
import AssetForm from "./pages/AssetForm";
import AssetDetail from "./pages/AssetDetail";
import AssetPrint from "./pages/AssetPrint";
import Parties from "./pages/Parties";
import PartyForm from "./pages/PartyForm";
import PartyLedger from "./pages/PartyLedger";
import Purchases from "./pages/Purchases";
import PurchaseForm from "./pages/PurchaseForm";
import PurchaseDetail from "./pages/PurchaseDetail";

const queryClient = new QueryClient();

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/customer" element={<CustomerAuth />} />
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/new" element={<ProductForm />} />
            <Route path="/products/edit/:id" element={<ProductForm />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/quotations" element={<Quotations />} />
            <Route path="/quotations/new" element={<QuotationForm />} />
            <Route path="/quotations/edit/:id" element={<QuotationForm />} />
            <Route path="/quotations/:id" element={<QuotationDetail />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceForm />} />
            <Route path="/invoices/edit/:id" element={<InvoiceForm />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/cashbook" element={<Cashbook />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/assets/new" element={<AssetForm />} />
            <Route path="/assets/print" element={<AssetPrint />} />
            <Route path="/assets/:id" element={<AssetDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/parties" element={<Parties />} />
            <Route path="/parties/new" element={<PartyForm />} />
            <Route path="/parties/edit/:id" element={<PartyForm />} />
            <Route path="/parties/:id" element={<PartyLedger />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/purchases/new" element={<PurchaseForm />} />
            <Route path="/purchases/edit/:id" element={<PurchaseForm />} />
            <Route path="/purchases/:id" element={<PurchaseDetail />} />
            <Route path="/install" element={<Install />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
