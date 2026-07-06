-- 1. Drop existing check constraint on cars status if it exists
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_status_check;

-- 2. Add new check constraint allowing 'pending' and 'rejected'
ALTER TABLE public.cars ADD CONSTRAINT cars_status_check 
  CHECK (status = ANY (ARRAY['available'::text, 'sold'::text, 'reserved'::text, 'pending'::text, 'rejected'::text]));

-- 3. Add rejection_reason column to cars table if it doesn't exist
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS rejection_reason text;
