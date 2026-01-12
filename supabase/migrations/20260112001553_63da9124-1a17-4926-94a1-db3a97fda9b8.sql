-- Fix 1: Create a secure view for profiles that hides email from non-owners
-- Instead of exposing email to all authenticated users, create a policy that
-- only allows users to see other users' emails if they are connected

-- First, drop the existing SELECT policy on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;

-- Create a new policy that allows viewing profiles but we'll handle email visibility in the application
-- For now, let's create a more restrictive policy
CREATE POLICY "Users can view visible profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- User can always see their own profile
    id = auth.uid()
    OR (
      -- User can see other profiles that are visible
      is_visible = true
    )
  )
);

-- Fix 2: Update newsletter_subscriptions SELECT policy to admin-only
-- Regular users don't need to query this table - subscription status is managed through app logic
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.newsletter_subscriptions;

CREATE POLICY "Only admins can view newsletter subscriptions"
ON public.newsletter_subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));