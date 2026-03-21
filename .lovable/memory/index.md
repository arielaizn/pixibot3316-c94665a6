Design system: Pixi SaaS, RTL Hebrew-first (Heebo), English (Inter)
Colors: Primary #25D366 (WhatsApp green), Secondary #128C7E, Accent #6366F1
Luxury tokens: --luxury-gold (43 96% 56%), --luxury-purple (262 83% 58%)
Light bg: white, Dark bg: #0F172A
Theme toggle via next-themes (class-based), persisted automatically
Mascot: src/assets/pixi-mascot.png (lightbulb character)
Floating mascot links to /signup (NOT WhatsApp)
Tooltip: "התחל בחינם"
No direct WhatsApp links on home page — WhatsApp is post-auth only
User flow: Home → Signup/Login → Auth → Dashboard → WhatsApp handoff
Placeholder routes: /pricing, /login, /signup, /dashboard, /projects
Auth: Lovable Cloud (Supabase) with Google OAuth + email/password
Profiles table: user_id, full_name, avatar_url (auto-created on signup via trigger)
Luxury design system: glass-morphism, gradient-text, luxury-card, luxury-border-gradient CSS classes
Button variants: luxury, luxury-outline, luxury-ghost
Shadows: shadow-luxury-md, shadow-luxury-lg, shadow-luxury-xl
Border radius: rounded-luxury-lg (16px), rounded-luxury-xl (24px)
