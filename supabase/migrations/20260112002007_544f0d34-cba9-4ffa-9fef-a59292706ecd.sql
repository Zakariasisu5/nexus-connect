-- Change the default status for matches from 'pending' to 'suggested'
-- This ensures new matches are created as suggestions until user explicitly connects
ALTER TABLE public.matches 
ALTER COLUMN status SET DEFAULT 'suggested';