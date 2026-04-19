-- Add customer_id to products table to link products to customers
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users(id);

-- Drop existing overly permissive policies on products table
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can create products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Create new role-based RLS policies for products
-- Admins can do everything
CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create products" ON public.products
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all products" ON public.products
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Staff can view and manage products
CREATE POLICY "Staff can view all products" ON public.products
  FOR SELECT USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can create products" ON public.products
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can update all products" ON public.products
  FOR UPDATE USING (public.has_role(auth.uid(), 'staff'));

-- Customers can only view their own products
CREATE POLICY "Customers can view their own products" ON public.products
  FOR SELECT USING (
    public.has_role(auth.uid(), 'customer') AND customer_id = auth.uid()
  );

-- Update remarks policies
DROP POLICY IF EXISTS "Authenticated users can view remarks" ON public.remarks;
DROP POLICY IF EXISTS "Authenticated users can create remarks" ON public.remarks;
DROP POLICY IF EXISTS "Users can update their own remarks" ON public.remarks;
DROP POLICY IF EXISTS "Admins can delete remarks" ON public.remarks;

CREATE POLICY "Admins can view all remarks" ON public.remarks
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create remarks" ON public.remarks
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all remarks" ON public.remarks
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete remarks" ON public.remarks
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view all remarks" ON public.remarks
  FOR SELECT USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can create remarks" ON public.remarks
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can update their own remarks" ON public.remarks
  FOR UPDATE USING (public.has_role(auth.uid(), 'staff') AND created_by = auth.uid());

CREATE POLICY "Customers can view remarks on their products" ON public.remarks
  FOR SELECT USING (
    public.has_role(auth.uid(), 'customer') AND 
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = remarks.product_id 
      AND products.customer_id = auth.uid()
    )
  );