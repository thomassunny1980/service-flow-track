-- Create shop_settings table
CREATE TABLE public.shop_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name TEXT NOT NULL DEFAULT 'iTech Service Center',
  shop_address TEXT,
  shop_city TEXT,
  shop_state TEXT,
  shop_pincode TEXT,
  shop_phone TEXT,
  shop_email TEXT,
  shop_website TEXT,
  shop_gst TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_branch TEXT,
  upi_id TEXT,
  terms_and_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage shop settings"
ON public.shop_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Staff can view settings
CREATE POLICY "Staff can view shop settings"
ON public.shop_settings
FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- Add trigger for updated_at
CREATE TRIGGER update_shop_settings_updated_at
BEFORE UPDATE ON public.shop_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.shop_settings (shop_name) VALUES ('iTech Service Center');