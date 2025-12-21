-- Add unique constraint to prevent duplicate matches
-- First, remove any existing duplicates keeping only the most recent
DELETE FROM public.matches a
USING public.matches b
WHERE a.user_id = b.user_id 
  AND a.matched_user_id = b.matched_user_id 
  AND COALESCE(a.event_id::text, '') = COALESCE(b.event_id::text, '')
  AND a.created_at < b.created_at;

-- Create unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS matches_unique_pair_idx 
ON public.matches (user_id, matched_user_id, COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid));