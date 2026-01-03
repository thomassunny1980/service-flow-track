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
import { Building2, CreditCard, FileText, Save } from "lucide-react";

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
}

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
        })
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
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="shop" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Shop Profile</span>
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Bank Details</span>
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

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="shop_phone">Phone</Label>
                    <Input
                      id="shop_phone"
                      value={settings.shop_phone || ""}
                      onChange={(e) => updateField("shop_phone", e.target.value)}
                      disabled={!isAdmin}
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>
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
                  <Textarea
                    id="terms_and_conditions"
                    value={settings.terms_and_conditions || ""}
                    onChange={(e) => updateField("terms_and_conditions", e.target.value)}
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
