import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PartyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = !!id;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", contact: "", email: "", address: "", state: "",
    gstin: "", opening_balance: "0", party_type: "customer",
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
      if (data) {
        const d: any = data;
        setForm({
          name: d.name || "", contact: d.contact || "", email: d.email || "",
          address: d.address || "", state: d.state || "",
          gstin: d.gstin || "", opening_balance: String(d.opening_balance ?? 0),
          party_type: d.party_type || "customer",
        });
      }
    })();
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload: any = {
      name: form.name.trim(),
      contact: form.contact.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      state: form.state.trim() || null,
      gstin: form.gstin.trim() || null,
      opening_balance: Number(form.opening_balance) || 0,
      party_type: form.party_type,
    };
    const { data: { session } } = await supabase.auth.getSession();
    if (!editing) payload.created_by = session?.user.id;
    const res = editing
      ? await supabase.from("customers").update(payload).eq("id", id!)
      : await supabase.from("customers").insert(payload);
    setLoading(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? "Party updated" : "Party created");
    navigate("/parties");
  };

  return (
    <Layout>
      <form onSubmit={submit} className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">{editing ? "Edit Party" : "New Party"}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Name *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Mobile</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-2"><Label>GSTIN</Label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
          <div className="space-y-2"><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select value={form.party_type} onValueChange={(v) => setForm({ ...form, party_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Opening Balance</Label>
            <Input type="number" step="0.01" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} />
            <p className="text-xs text-muted-foreground">Positive = receivable, negative = payable</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/parties")}>Cancel</Button>
        </div>
      </form>
    </Layout>
  );
};

export default PartyForm;
