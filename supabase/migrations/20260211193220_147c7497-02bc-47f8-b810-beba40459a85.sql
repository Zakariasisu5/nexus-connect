-- Allow attendees to view sponsor leads about themselves
CREATE POLICY "Attendees can view leads about themselves"
ON public.sponsor_leads
FOR SELECT
USING (auth.uid() = attendee_id);