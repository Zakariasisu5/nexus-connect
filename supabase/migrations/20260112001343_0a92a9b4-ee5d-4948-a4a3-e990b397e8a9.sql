-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.newsletter_subscriptions;

-- Create a new secure policy that only allows authenticated users to view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.newsletter_subscriptions
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
);