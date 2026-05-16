-- Create push_subscriptions table for Web Push Notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for development simplicity, or filter by authenticated later)
CREATE POLICY "Allow anonymous inserts" ON public.push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous select" ON public.push_subscriptions FOR SELECT USING (true);
