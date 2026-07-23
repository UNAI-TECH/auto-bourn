-- Add seating_capacity column to public.cars table if it doesn't already exist
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS seating_capacity INTEGER DEFAULT 5;
