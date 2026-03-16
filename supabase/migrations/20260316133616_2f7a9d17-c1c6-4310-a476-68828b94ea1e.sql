
ALTER TABLE public.profiles
ADD COLUMN whatsapp_number TEXT,
ADD COLUMN whatsapp_verified BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_profiles_whatsapp ON public.profiles(whatsapp_number);
