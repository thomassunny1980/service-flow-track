import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Building2, CreditCard, FileText, Save, Percent, Plus, Trash2, Hash, RotateCcw } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaxRate {
  name: string;
  rate: number;
}

interface ShopSettings {
  id: string;
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
  invoice_terms: string | null;
  quotation_terms: string | null;
  tax_rates: TaxRate[];
  quotation_prefix: string;
  quotation_year_format: string;
  quotation_number_digits: number;
  last_quotation_number: number;
  invoice_prefix: string;
  invoice_year_format: string;
  invoice_number_digits: number;
  last_invoice_number: number;
  auto_reset_quotation_sequence: boolean;
  auto_reset_invoice_sequence: boolean;
  quotation_fy_year: string | null;
  invoice_fy_year: string | null;
}

// Helper function to get financial year string
const getFinancialYearString = (format: string): string => {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  
  // Financial year starts in April (month 3)
  // If current month is Jan-Mar (0-2), we're in the previous year's FY
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

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<ShopSettings>({
    id: "",
    shop_name: "iTech Service Center",
    shop_address: "",
    shop_city: "",
    shop_state: "",
    shop_pincode: "",
    shop_phone: "",
    shop_email: "",
    shop_website: "",
    shop_gst: "",
    bank_name: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_ifsc: "",
    bank_branch: "",
    upi_id: "",
    terms_and_conditions: "",
    tax_rates: [
      { name: "GST 18%", rate: 18 },
      { name: "GST 12%", rate: 12 },
      { name: "GST 5%", rate: 5 },
      { name: "No Tax", rate: 0 },
    ],
    quotation_prefix: "QT",
    quotation_year_format: "FY-YY",
    quotation_number_digits: 4,
    last_quotation_number: 0,
    invoice_prefix: "INV",
    invoice_year_format: "FY-YY",
    invoice_number_digits: 4,
    last_invoice_number: 0,
    auto_reset_quotation_sequence: true,
    auto_reset_invoice_sequence: true,
    quotation_fy_year: null,
    invoice_fy_year: null,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const adminRole = roles?.find(r => r.role === "admin");
    setIsAdmin(!!adminRole);

    fetchSettings();
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("shop_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          shop_name: data.shop_name || "",
          shop_address: data.shop_address || "",
          shop_city: data.shop_city || "",
          shop_state: data.shop_state || "",
          shop_pincode: data.shop_pincode || "",
          shop_phone: data.shop_phone || "",
          shop_email: data.shop_email || "",
          shop_website: data.shop_website || "",
          shop_gst: data.shop_gst || "",
          bank_name: data.bank_name || "",
          bank_account_name: data.bank_account_name || "",
          bank_account_number: data.bank_account_number || "",
          bank_ifsc: data.bank_ifsc || "",
          bank_branch: data.bank_branch || "",
          upi_id: data.upi_id || "",
          terms_and_conditions: data.terms_and_conditions || "",
          tax_rates: (data.tax_rates as unknown as TaxRate[]) || [
            { name: "GST 18%", rate: 18 },
            { name: "GST 12%", rate: 12 },
            { name: "GST 5%", rate: 5 },
            { name: "No Tax", rate: 0 },
          ],
          quotation_prefix: (data as any).quotation_prefix || "QT",
          quotation_year_format: (data as any).quotation_year_format || "FY-YY",
          quotation_number_digits: (data as any).quotation_number_digits || 4,
          last_quotation_number: (data as any).last_quotation_number || 0,
          invoice_prefix: (data as any).invoice_prefix || "INV",
          invoice_year_format: (data as any).invoice_year_format || "FY-YY",
          invoice_number_digits: (data as any).invoice_number_digits || 4,
          last_invoice_number: (data as any).last_invoice_number || 0,
          auto_reset_quotation_sequence: (data as any).auto_reset_quotation_sequence ?? true,
          auto_reset_invoice_sequence: (data as any).auto_reset_invoice_sequence ?? true,
          quotation_fy_year: (data as any).quotation_fy_year || null,
          invoice_fy_year: (data as any).invoice_fy_year || null,
        });
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only admins can update settings",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("shop_settings")
        .update({
          shop_name: settings.shop_name,
          shop_address: settings.shop_address || null,
          shop_city: settings.shop_city || null,
          shop_state: settings.shop_state || null,
          shop_pincode: settings.shop_pincode || null,
          shop_phone: settings.shop_phone || null,
          shop_email: settings.shop_email || null,
          shop_website: settings.shop_website || null,
          shop_gst: settings.shop_gst || null,
          bank_name: settings.bank_name || null,
          bank_account_name: settings.bank_account_name || null,
          bank_account_number: settings.bank_account_number || null,
          bank_ifsc: settings.bank_ifsc || null,
          bank_branch: settings.bank_branch || null,
          upi_id: settings.upi_id || null,
          terms_and_conditions: settings.terms_and_conditions || null,
          tax_rates: JSON.parse(JSON.stringify(settings.tax_rates)),
          quotation_prefix: settings.quotation_prefix,
          quotation_year_format: settings.quotation_year_format,
          quotation_number_digits: settings.quotation_number_digits,
          invoice_prefix: settings.invoice_prefix,
          invoice_year_format: settings.invoice_year_format,
          invoice_number_digits: settings.invoice_number_digits,
          auto_reset_quotation_sequence: settings.auto_reset_quotation_sequence,
          auto_reset_invoice_sequence: settings.auto_reset_invoice_sequence,
        } as any)
        .eq("id", settings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ShopSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const addTaxRate = () => {
    setSettings(prev => ({
      ...prev,
      tax_rates: [...prev.tax_rates, { name: "", rate: 0 }],
    }));
  };

  const removeTaxRate = (index: number) => {
    setSettings(prev => ({
      ...prev,
      tax_rates: prev.tax_rates.filter((_, i) => i !== index),
    }));
  };

  const updateTaxRate = (index: number, field: "name" | "rate", value: string | number) => {
    setSettings(prev => ({
      ...prev,
      tax_rates: prev.tax_rates.map((tax, i) =>
        i === index ? { ...tax, [field]: value } : tax
      ),
    }));
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage shop profile and bank details
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>

        <Tabs defaultValue="shop" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="shop" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Shop Profile</span>
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Bank Details</span>
            </TabsTrigger>
            <TabsTrigger value="tax" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              <span className="hidden sm:inline">Tax Rates</span>
            </TabsTrigger>
            <TabsTrigger value="numbering" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span className="hidden sm:inline">Numbering</span>
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Terms</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop">
            <Card>
              <CardHeader>
                <CardTitle>Shop Profile</CardTitle>
                <CardDescription>
                  This information will appear on quotations and receipts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shop_name">Shop Name *</Label>
                    <Input
                      id="shop_name"
                      value={settings.shop_name}
                      onChange={(e) => updateField("shop_name", e.target.value)}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shop_gst">GST Number</Label>
                    <Input
                      id="shop_gst"
                      value={settings.shop_gst || ""}
                      onChange={(e) => updateField("shop_gst", e.target.value)}
                      disabled={!isAdmin}
                      placeholder="e.g., 22AAAAA0000A1Z5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shop_address">Address</Label>
                  <Textarea
                    id="shop_address"
                    value={settings.shop_address || ""}
                    onChange={(e) => updateField("shop_address", e.target.value)}
                    disabled={!isAdmin}
                    placeholder="Street address"
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="shop_city">City</Label>
                    <Input
                      id="shop_city"
                      value={settings.shop_city || ""}
                      onChange={(e) => updateField("shop_city", e.target.value)}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shop_state">State</Label>
                    <Input
                      id="shop_state"
                      value={settings.shop_state || ""}
                      onChange={(e) => updateField("shop_state", e.target.value)}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shop_pincode">PIN Code</Label>
                    <Input
                      id="shop_pincode"
                      value={settings.shop_pincode || ""}
                      onChange={(e) => updateField("shop_pincode", e.target.value)}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Numbers</Label>
                    {(settings.shop_phone || "").split(",").filter(Boolean).length === 0 ? (
                      <div className="flex gap-2">
                        <Input
                          value=""
                          onChange={(e) => updateField("shop_phone", e.target.value)}
                          disabled={!isAdmin}
                          placeholder="+91 XXXXXXXXXX"
                        />
                        {isAdmin && (
                          <Button type="button" variant="outline" size="icon" onClick={() => {
                            const current = settings.shop_phone || "";
                            updateField("shop_phone", current ? current + "," : ",");
                          }}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      (settings.shop_phone || "").split(",").map((phone, index, arr) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={phone.trim()}
                            onChange={(e) => {
                              const phones = (settings.shop_phone || "").split(",");
                              phones[index] = e.target.value;
                              updateField("shop_phone", phones.join(","));
                            }}
                            disabled={!isAdmin}
                            placeholder="+91 XXXXXXXXXX"
                          />
                          {isAdmin && (
                            <div className="flex gap-1">
                              {index === arr.length - 1 && (
                                <Button type="button" variant="outline" size="icon" onClick={() => {
                                  updateField("shop_phone", (settings.shop_phone || "") + ",");
                                }}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                              {arr.length > 1 && (
                                <Button type="button" variant="outline" size="icon" onClick={() => {
                                  const phones = (settings.shop_phone || "").split(",");
                                  phones.splice(index, 1);
                                  updateField("shop_phone", phones.join(","));
                                }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="shop_email">Email</Label>
                      <Input
                        id="shop_email"
                        type="email"
                        value={settings.shop_email || ""}
                        onChange={(e) => updateField("shop_email", e.target.value)}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shop_website">Website</Label>
                      <Input
                        id="shop_website"
                        value={settings.shop_website || ""}
                        onChange={(e) => updateField("shop_website", e.target.value)}
                        disabled={!isAdmin}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle>Bank Account Details</CardTitle>
                <CardDescription>
                  Bank details will be shown on quotations for payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={settings.bank_name || ""}
                      onChange={(e) => updateField("bank_name", e.target.value)}
                      disabled={!isAdmin}
                      placeholder="e.g., State Bank of India"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_branch">Branch</Label>
                    <Input
                      id="bank_branch"
                      value={settings.bank_branch || ""}
                      onChange={(e) => updateField("bank_branch", e.target.value)}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank_account_name">Account Holder Name</Label>
                    <Input
                      id="bank_account_name"
                      value={settings.bank_account_name || ""}
                      onChange={(e) => updateField("bank_account_name", e.target.value)}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_account_number">Account Number</Label>
                    <Input
                      id="bank_account_number"
                      value={settings.bank_account_number || ""}
                      onChange={(e) => updateField("bank_account_number", e.target.value)}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank_ifsc">IFSC Code</Label>
                    <Input
                      id="bank_ifsc"
                      value={settings.bank_ifsc || ""}
                      onChange={(e) => updateField("bank_ifsc", e.target.value)}
                      disabled={!isAdmin}
                      placeholder="e.g., SBIN0000123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upi_id">UPI ID</Label>
                    <Input
                      id="upi_id"
                      value={settings.upi_id || ""}
                      onChange={(e) => updateField("upi_id", e.target.value)}
                      disabled={!isAdmin}
                      placeholder="e.g., shop@upi"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tax Rates</CardTitle>
                  <CardDescription>
                    Configure tax rates available for quotation items
                  </CardDescription>
                </div>
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={addTaxRate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tax
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.tax_rates.map((tax, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <Label>Tax Name</Label>
                      <Input
                        value={tax.name}
                        onChange={(e) => updateTaxRate(index, "name", e.target.value)}
                        disabled={!isAdmin}
                        placeholder="e.g., GST 18%"
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label>Rate (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={tax.rate}
                        onChange={(e) => updateTaxRate(index, "rate", parseFloat(e.target.value) || 0)}
                        disabled={!isAdmin}
                      />
                    </div>
                    {isAdmin && settings.tax_rates.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-6 text-destructive"
                        onClick={() => removeTaxRate(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="numbering">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quotation Numbering</CardTitle>
                  <CardDescription>
                    Configure auto-generated quotation numbers (e.g., QT-25-26-0001)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="quotation_prefix">Prefix</Label>
                      <Input
                        id="quotation_prefix"
                        value={settings.quotation_prefix}
                        onChange={(e) => setSettings(prev => ({ ...prev, quotation_prefix: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="e.g., QT"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quotation_year_format">Year Format</Label>
                      <Select
                        value={settings.quotation_year_format}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, quotation_year_format: value }))}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FY-YY">Financial Year Short (25-26)</SelectItem>
                          <SelectItem value="FY-YYYY">Financial Year Full (2025-26)</SelectItem>
                          <SelectItem value="YYYY">Calendar Year Full (2026)</SelectItem>
                          <SelectItem value="YY">Calendar Year Short (26)</SelectItem>
                          <SelectItem value="NONE">No Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quotation_number_digits">Number Digits</Label>
                      <Select
                        value={String(settings.quotation_number_digits)}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, quotation_number_digits: parseInt(value) }))}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select digits" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 digits (001)</SelectItem>
                          <SelectItem value="4">4 digits (0001)</SelectItem>
                          <SelectItem value="5">5 digits (00001)</SelectItem>
                          <SelectItem value="6">6 digits (000001)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm text-muted-foreground">Preview</Label>
                    <p className="text-lg font-mono mt-1">
                      {settings.quotation_prefix}
                      {settings.quotation_year_format !== "NONE" && "-"}
                      {getFinancialYearString(settings.quotation_year_format)}
                      -{String(settings.last_quotation_number + 1).padStart(settings.quotation_number_digits, "0")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Last quotation number: {settings.last_quotation_number}
                      {settings.quotation_fy_year && ` (FY: ${settings.quotation_fy_year})`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base">Auto-Reset Sequence</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically reset quotation numbering at the start of each new financial year (April 1st)
                      </p>
                    </div>
                    <Switch
                      checked={settings.auto_reset_quotation_sequence}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_reset_quotation_sequence: checked }))}
                      disabled={!isAdmin}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Invoice Numbering</CardTitle>
                  <CardDescription>
                    Configure auto-generated invoice numbers (e.g., INV-25-26-0001)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="invoice_prefix">Prefix</Label>
                      <Input
                        id="invoice_prefix"
                        value={settings.invoice_prefix}
                        onChange={(e) => setSettings(prev => ({ ...prev, invoice_prefix: e.target.value }))}
                        disabled={!isAdmin}
                        placeholder="e.g., INV"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoice_year_format">Year Format</Label>
                      <Select
                        value={settings.invoice_year_format}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, invoice_year_format: value }))}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FY-YY">Financial Year Short (25-26)</SelectItem>
                          <SelectItem value="FY-YYYY">Financial Year Full (2025-26)</SelectItem>
                          <SelectItem value="YYYY">Calendar Year Full (2026)</SelectItem>
                          <SelectItem value="YY">Calendar Year Short (26)</SelectItem>
                          <SelectItem value="NONE">No Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoice_number_digits">Number Digits</Label>
                      <Select
                        value={String(settings.invoice_number_digits)}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, invoice_number_digits: parseInt(value) }))}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select digits" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 digits (001)</SelectItem>
                          <SelectItem value="4">4 digits (0001)</SelectItem>
                          <SelectItem value="5">5 digits (00001)</SelectItem>
                          <SelectItem value="6">6 digits (000001)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm text-muted-foreground">Preview</Label>
                    <p className="text-lg font-mono mt-1">
                      {settings.invoice_prefix}
                      {settings.invoice_year_format !== "NONE" && "-"}
                      {getFinancialYearString(settings.invoice_year_format)}
                      -{String(settings.last_invoice_number + 1).padStart(settings.invoice_number_digits, "0")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Last invoice number: {settings.last_invoice_number}
                      {settings.invoice_fy_year && ` (FY: ${settings.invoice_fy_year})`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base">Auto-Reset Sequence</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically reset invoice numbering at the start of each new financial year (April 1st)
                      </p>
                    </div>
                    <Switch
                      checked={settings.auto_reset_invoice_sequence}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_reset_invoice_sequence: checked }))}
                      disabled={!isAdmin}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="terms">
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
                <CardDescription>
                  Default terms that will appear on quotations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
                  <RichTextEditor
                    value={settings.terms_and_conditions || ""}
                    onChange={(val) => updateField("terms_and_conditions", val)}
                    disabled={!isAdmin}
                    placeholder="Enter your default terms and conditions..."
                    rows={10}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {!isAdmin && (
          <p className="text-sm text-muted-foreground text-center">
            Only admins can modify settings. Contact your administrator for changes.
          </p>
        )}
      </div>
    </Layout>
  );
};

export default Settings;
