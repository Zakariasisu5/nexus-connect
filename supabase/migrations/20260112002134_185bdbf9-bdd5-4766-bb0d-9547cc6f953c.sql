-- Update the check constraint to include 'suggested' status
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE public.matches ADD CONSTRAINT matches_status_check 
CHECK (status = ANY (ARRAY['suggested'::text, 'pending'::text, 'accepted'::text, 'rejected'::text, 'expired'::text]));

-- Update all existing pending matches to suggested (resetting auto-created connections)
UPDATE matches SET status = 'suggested' WHERE status = 'pending';