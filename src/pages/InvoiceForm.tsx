import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowLeft, Package } from "lucide-react";
import InventoryItemSelect from "@/components/InventoryItemSelect";
import { addDays, format } from "date-fns";
import { CustomerSearchInput } from "@/components/CustomerSearchInput";
import CreateInventoryItemDialog from "@/components/CreateInventoryItemDialog";

interface TaxRate {
  name: string;
  rate: number;
}

interface InventoryItem {
  id: string;
  item_name: string;
  item_code: string | null;
  sale_rate: number;
  quantity: number;
  unit: string | null;
}

interface Customer {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  address: string | null;
  state: string | null;
}

interface InvoiceItem {
  id: string;
  inventory_id: string | null;
  item_name: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  tax_rate: number;
  tax_name: string;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total: number;
  unit?: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const InvoiceForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const quotationId = searchParams.get('quotation');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shopState, setShopState] = useState<string>("Kerala");
  const [taxRates, setTaxRates] = useState<TaxRate[]>([
    { name: "GST 18%", rate: 18 },
    { name: "GST 12%", rate: 12 },
    { name: "GST 5%", rate: 5 },
    { name: "No Tax", rate: 0 },
  ]);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_contact: "",
    customer_email: "",
    customer_address: "",
    customer_state: "Kerala",
    invoice_date: format(new Date(), "yyyy-MM-dd"),
    due_date: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    notes: "",
    status: "unpaid",
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), inventory_id: null, item_name: "", description: "", quantity: 1, unit_price: 0, tax_rate: 18, tax_name: "GST 18%", tax_amount: 0, cgst_amount: 0, sgst_amount: 0, igst_amount: 0, total: 0 },
  ]);

  useEffect(() => {
    checkAuth();
    fetchTaxRates();
    fetchInventory();
    fetchCustomers();
    if (id) {
      fetchInvoice();
    } else if (quotationId) {
      convertQuotation();
    }
  }, [id, quotationId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchTaxRates = async () => {
    try {
      const { data, error } = await supabase
        .from("shop_settings")
        .select("tax_rates, shop_state")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data?.tax_rates) {
        setTaxRates(data.tax_rates as unknown as TaxRate[]);
      }
      if (data?.shop_state) {
        setShopState(data.shop_state);
      }
    } catch (error) {
      console.log("Using default tax rates");
    }
  };

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, item_name, item_code, sale_rate, quantity, unit")
        .order("item_name");

      if (error) throw error;
      setInventoryItems((data || []) as InventoryItem[]);
    } catch (error) {
      console.log("Error fetching inventory");
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, contact, email, address, state")
        .order("name");

      if (error) throw error;
      setCustomers((data || []) as Customer[]);
    } catch (error) {
      console.log("Error fetching customers");
    }
  };

  // Helper function to get financial year string from a specific date
  const getFinancialYearStringFromDate = (dateString: string, format: string): string => {
    const date = new Date(dateString);
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    const fyEndYear = fyStartYear + 1;
    
    switch (format) {
      case "FY-YY":
        return `${String(fyStartYear).slice(-2)}-${String(fyEndYear).slice(-2)}`;
      case "FY-YYYY":
        return `${fyStartYear}-${String(fyEndYear).slice(-2)}`;
      case "YYYY":
        return String(currentYear);
      case "YY":
        return String(currentYear).slice(-2);
      default:
        return "";
    }
  };

  const getCurrentFYKey = (dateString: string): string => {
    const date = new Date(dateString);
    const month = date.getMonth();
    const year = date.getFullYear();
    const fyStartYear = month < 3 ? year - 1 : year;
    return `${fyStartYear}-${fyStartYear + 1}`;
  };

  const generateInvoiceNumber = async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from("shop_settings")
        .select("invoice_prefix, invoice_year_format, invoice_number_digits, last_invoice_number, invoice_fy_year, invoice_fy_last_number, auto_reset_invoice_sequence, id")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const prefix = (data as any)?.invoice_prefix || "INV";
      const yearFormat = (data as any)?.invoice_year_format || "FY-YY";
      const digits = (data as any)?.invoice_number_digits || 4;
      const autoReset = (data as any)?.auto_reset_invoice_sequence ?? true;
      const storedFyYear = (data as any)?.invoice_fy_year || null;
      
      // Get financial year based on the invoice date
      const currentFY = getCurrentFYKey(formData.invoice_date);
      
      let newNumber: number;
      
      if (autoReset && storedFyYear !== currentFY) {
        // New financial year - reset to 1
        newNumber = 1;
        await supabase
          .from("shop_settings")
          .update({ 
            last_invoice_number: newNumber,
            invoice_fy_year: currentFY,
            invoice_fy_last_number: newNumber
          } as any)
          .eq("id", data?.id);
      } else {
        // Same financial year - increment
        const lastNumber = (data as any)?.last_invoice_number || 0;
        newNumber = lastNumber + 1;
        await supabase
          .from("shop_settings")
          .update({ 
            last_invoice_number: newNumber,
            invoice_fy_year: currentFY,
            invoice_fy_last_number: newNumber
          } as any)
          .eq("id", data?.id);
      }

      const yearPart = getFinancialYearStringFromDate(formData.invoice_date, yearFormat);

      return `${prefix}${yearPart ? `-${yearPart}` : ""}-${String(newNumber).padStart(digits, "0")}`;
    } catch (error) {
      console.error("Error generating invoice number:", error);
      return `INV-${Date.now()}`;
    }
  };

  const isInterState = () => {
    // Case-insensitive comparison for state matching
    const customerStateLower = formData.customer_state?.toLowerCase().trim() || "";
    const shopStateLower = shopState?.toLowerCase().trim() || "";
    return customerStateLower !== "" && shopStateLower !== "" && customerStateLower !== shopStateLower;
  };

  const calculateItemTax = (subtotal: number, taxRate: number) => {
    const taxAmount = (subtotal * taxRate) / 100;
    const interState = isInterState();
    
    return {
      tax_amount: taxAmount,
      cgst_amount: interState ? 0 : taxAmount / 2,
      sgst_amount: interState ? 0 : taxAmount / 2,
      igst_amount: interState ? taxAmount : 0,
    };
  };

  const convertQuotation = async () => {
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", quotationId)
        .single();

      if (error) throw error;

      if (data) {
        const advancePaid = Number((data as any).advance_paid || 0);
        setFormData({
          customer_name: data.customer_name,
          customer_contact: data.customer_contact || "",
          customer_email: data.customer_email || "",
          customer_address: (data as any).customer_address || "",
          customer_state: (data as any).customer_state || "Kerala",
          invoice_date: format(new Date(), "yyyy-MM-dd"),
          due_date: format(addDays(new Date(), 30), "yyyy-MM-dd"),
          notes: data.notes || "",
          status: advancePaid > 0 ? "partial" : "unpaid",
          amount_paid: advancePaid,
        });
        const quotationItems = (data.items as unknown as InvoiceItem[]) || [];
        setItems(quotationItems.map(item => ({
          ...item,
          inventory_id: item.inventory_id ?? null,
          item_name: item.item_name ?? "",
          tax_rate: item.tax_rate ?? 18,
          tax_name: item.tax_name ?? "GST 18%",
          tax_amount: item.tax_amount ?? 0,
          cgst_amount: item.cgst_amount ?? 0,
          sgst_amount: item.sgst_amount ?? 0,
          igst_amount: item.igst_amount ?? 0,
        })));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          customer_name: data.customer_name,
          customer_contact: data.customer_contact || "",
          customer_email: data.customer_email || "",
          customer_address: (data as any).customer_address || "",
          customer_state: (data as any).customer_state || "Kerala",
          invoice_date: data.created_at ? format(new Date(data.created_at), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
          due_date: data.due_date || format(addDays(new Date(), 30), "yyyy-MM-dd"),
          notes: data.notes || "",
          status: data.status || "unpaid",
        });
        const fetchedItems = (data.items as unknown as InvoiceItem[]) || [];
        setItems(fetchedItems.map(item => ({
          ...item,
          inventory_id: item.inventory_id ?? null,
          item_name: item.item_name ?? "",
          tax_rate: item.tax_rate ?? 18,
          tax_name: item.tax_name ?? "GST 18%",
          tax_amount: item.tax_amount ?? 0,
          cgst_amount: item.cgst_amount ?? 0,
          sgst_amount: item.sgst_amount ?? 0,
          igst_amount: item.igst_amount ?? 0,
        })));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const selectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customer_name: customer.name,
      customer_contact: customer.contact || "",
      customer_email: customer.email || "",
      customer_address: customer.address || "",
      customer_state: customer.state || "Kerala",
    }));
  };

  const addItem = () => {
    const defaultTax = taxRates.length > 0 ? taxRates[0] : { name: "No Tax", rate: 0 };
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      inventory_id: null,
      item_name: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: defaultTax.rate,
      tax_name: defaultTax.name,
      tax_amount: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      total: 0,
    };
    setItems((prevItems) => [...prevItems, newItem]);
  };

  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== itemId));
    }
  };

  const selectInventoryItem = (itemId: string, inventoryId: string) => {
    const inventoryItem = inventoryItems.find(inv => inv.id === inventoryId);
    if (!inventoryItem) return;

    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity;
          const subtotal = qty * inventoryItem.sale_rate;
          const taxCalc = calculateItemTax(subtotal, item.tax_rate);
          return {
            ...item,
            inventory_id: inventoryId,
            item_name: inventoryItem.item_name,
            unit_price: inventoryItem.sale_rate,
            unit: inventoryItem.unit || 'Nos',
            ...taxCalc,
            total: subtotal + taxCalc.tax_amount,
          };
        }
        return item;
      })
    );
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "unit_price" || field === "tax_rate") {
            const qty = typeof updatedItem.quantity === 'string' ? parseFloat(updatedItem.quantity) || 0 : updatedItem.quantity;
            const price = typeof updatedItem.unit_price === 'string' ? parseFloat(updatedItem.unit_price) || 0 : updatedItem.unit_price;
            const subtotal = qty * price;
            const taxCalc = calculateItemTax(subtotal, updatedItem.tax_rate);
            return {
              ...updatedItem,
              ...taxCalc,
              total: subtotal + taxCalc.tax_amount,
            };
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const updateItemTax = (itemId: string, taxName: string) => {
    const selectedTax = taxRates.find(t => t.name === taxName);
    if (!selectedTax) return;
    
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity;
          const price = typeof item.unit_price === 'string' ? parseFloat(item.unit_price) || 0 : item.unit_price;
          const subtotal = qty * price;
          const taxCalc = calculateItemTax(subtotal, selectedTax.rate);
          return {
            ...item,
            tax_rate: selectedTax.rate,
            tax_name: selectedTax.name,
            ...taxCalc,
            total: subtotal + taxCalc.tax_amount,
          };
        }
        return item;
      })
    );
  };

  // Recalculate taxes when customer state changes
  useEffect(() => {
    setItems(prevItems =>
      prevItems.map(item => {
        const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity;
        const price = typeof item.unit_price === 'string' ? parseFloat(item.unit_price) || 0 : item.unit_price;
        const subtotal = qty * price;
        const taxCalc = calculateItemTax(subtotal, item.tax_rate);
        return {
          ...item,
          ...taxCalc,
          total: subtotal + taxCalc.tax_amount,
        };
      })
    );
  }, [formData.customer_state]);

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity;
      const price = typeof item.unit_price === 'string' ? parseFloat(item.unit_price) || 0 : item.unit_price;
      return sum + (qty * price);
    }, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0);
    const cgstTotal = items.reduce((sum, item) => sum + item.cgst_amount, 0);
    const sgstTotal = items.reduce((sum, item) => sum + item.sgst_amount, 0);
    const igstTotal = items.reduce((sum, item) => sum + item.igst_amount, 0);
    const total = subtotal + taxAmount;
    const roundedTotal = Math.round(total);
    return { subtotal, taxAmount, cgstTotal, sgstTotal, igstTotal, total: roundedTotal };
  };

  const saveCustomer = async () => {
    if (!formData.customer_name) return;

    try {
      const existingCustomer = customers.find(
        c => c.name.toLowerCase() === formData.customer_name.toLowerCase()
      );

      if (existingCustomer) {
        await supabase
          .from("customers")
          .update({
            contact: formData.customer_contact || null,
            email: formData.customer_email || null,
            address: formData.customer_address || null,
            state: formData.customer_state || null,
          })
          .eq("id", existingCustomer.id);
      } else {
        await supabase.from("customers").insert([{
          name: formData.customer_name,
          contact: formData.customer_contact || null,
          email: formData.customer_email || null,
          address: formData.customer_address || null,
          state: formData.customer_state || null,
        }]);
      }
    } catch (error) {
      console.log("Error saving customer");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (e.target !== e.currentTarget) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { subtotal, taxAmount, total } = calculateTotals();

      // Convert string values to numbers for storage
      const itemsForStorage = items.map(item => ({
        ...item,
        quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity,
        unit_price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) || 0 : item.unit_price,
      }));

      const invoiceData = {
        customer_name: formData.customer_name,
        customer_contact: formData.customer_contact || null,
        customer_email: formData.customer_email || null,
        customer_address: formData.customer_address || null,
        customer_state: formData.customer_state || null,
        due_date: formData.due_date,
        notes: formData.notes || null,
        status: formData.status,
        items: JSON.parse(JSON.stringify(itemsForStorage)),
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        quotation_id: quotationId || null,
        created_by: session.user.id,
      };

      // Save customer details
      await saveCustomer();

      if (id) {
        const { error } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Invoice updated successfully",
        });
      } else {
        const invoiceNumber = await generateInvoiceNumber();
        
        const { error } = await supabase
          .from("invoices")
          .insert([{ ...invoiceData, invoice_number: invoiceNumber }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Invoice created successfully",
        });
      }

      navigate("/invoices");
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

  const { subtotal, taxAmount, cgstTotal, sgstTotal, igstTotal, total } = calculateTotals();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {id ? "Edit Invoice" : quotationId ? "Convert to Invoice" : "New Invoice"}
            </h1>
            <p className="text-muted-foreground">
              {id ? "Update invoice details" : "Create a new invoice"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <CustomerSearchInput
                  customers={customers}
                  value={formData.customer_name}
                  onCustomerSelect={selectCustomer}
                  onValueChange={(value) =>
                    setFormData({ ...formData, customer_name: value })
                  }
                />
                <div className="space-y-2">
                  <Label htmlFor="customer_contact">Contact Number</Label>
                  <Input
                    id="customer_contact"
                    value={formData.customer_contact}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_contact: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_email">Email</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_address">Address</Label>
                  <Textarea
                    id="customer_address"
                    value={formData.customer_address}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_address: e.target.value })
                    }
                    placeholder="Customer address"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_state">State</Label>
                  <Select 
                    value={formData.customer_state} 
                    onValueChange={(value) => setFormData({ ...formData, customer_state: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInterState() && (
                    <p className="text-xs text-orange-600">Interstate supply - IGST will apply</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_date">Invoice Date *</Label>
                <Input
                  id="invoice_date"
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) =>
                    setFormData({ ...formData, invoice_date: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This date determines the financial year for numbering
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-3 md:p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
                    <div className="col-span-2 sm:col-span-3 space-y-1">
                      <Label className="text-xs">Item</Label>
                      <div className="flex gap-1">
                        <InventoryItemSelect
                          inventoryItems={inventoryItems}
                          value={item.inventory_id}
                          onSelect={(invId) => selectInventoryItem(item.id, invId)}
                        />
                        <CreateInventoryItemDialog
                          onItemCreated={(newItem) => {
                            setInventoryItems(prev => [...prev, newItem]);
                            setItems(prev => prev.map(i => {
                              if (i.id === item.id) {
                                const qty = typeof i.quantity === 'string' ? parseFloat(i.quantity) || 0 : i.quantity;
                                const stotal = qty * newItem.sale_rate;
                                const taxCalc = calculateItemTax(stotal, i.tax_rate);
                                return {
                                  ...i,
                                  inventory_id: newItem.id,
                                  item_name: newItem.item_name,
                                  unit_price: newItem.sale_rate,
                                  unit: newItem.unit || 'Nos',
                                  ...taxCalc,
                                  total: stotal + taxCalc.tax_amount,
                                };
                              }
                              return i;
                            }));
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-3 space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        placeholder="Description"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-1 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Price (₹)</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, "unit_price", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Tax</Label>
                      <Select
                        value={item.tax_name}
                        onValueChange={(value) => updateItemTax(item.id, value)}
                      >
                        <SelectTrigger className="min-w-0">
                          <SelectValue placeholder="Tax" />
                        </SelectTrigger>
                        <SelectContent>
                          {taxRates.map((tax) => (
                            <SelectItem key={tax.name} value={tax.name}>
                              {tax.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 sm:col-span-1 space-y-1">
                      <Label className="text-xs">Total (₹)</Label>
                      <Input value={item.total.toFixed(2)} readOnly className="bg-muted" />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {isInterState() ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IGST:</span>
                      <span>₹{igstTotal.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CGST:</span>
                        <span>₹{cgstTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SGST:</span>
                        <span>₹{sgstTotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total (Rounded):</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate("/invoices")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : id ? "Update Invoice" : "Create Invoice"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default InvoiceForm;
