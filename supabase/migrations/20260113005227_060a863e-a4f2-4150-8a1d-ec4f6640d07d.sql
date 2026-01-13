-- Add qr_token column to events table for secure QR code links
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;

-- Add event_id column to connections table for tracking connections made at events
ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS event_id UUID;

-- Create index for faster event token lookups
CREATE INDEX IF NOT EXISTS idx_events_qr_token ON public.events(qr_token);

-- Create unique constraint on event_attendees to prevent duplicate joins
ALTER TABLE public.event_attendees DROP CONSTRAINT IF EXISTS event_attendees_unique_user;
ALTER TABLE public.event_attendees ADD CONSTRAINT event_attendees_unique_user UNIQUE (event_id, user_id);

-- Drop the restrictive insert policy for events (requires organizer role)
DROP POLICY IF EXISTS "Organizers can create events" ON public.events;

-- Create new policy allowing any authenticated user to create events (they become organizer)
CREATE POLICY "Authenticated users can create events"
ON public.events
FOR INSERT
WITH CHECK (auth.uid() = organizer_id);

-- Update select policy to allow viewing events by token (for join page)
DROP POLICY IF EXISTS "Events are viewable by all authenticated users" ON public.events;

CREATE POLICY "Active events are viewable"
ON public.events
FOR SELECT
USING (is_active = true);

-- Allow event organizers to update their own events
DROP POLICY IF EXISTS "Organizers can manage their events" ON public.events;

CREATE POLICY "Organizers can update their events"
ON public.events
FOR UPDATE
USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their events"
ON public.events
FOR DELETE
USING (auth.uid() = organizer_id);

-- Enable realtime for events and event_attendees
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_attendees;