

# Pixi — AI Video via WhatsApp — Home Page

## Overview
Build a premium, RTL-first landing page for Pixi, an AI video creation platform powered by WhatsApp. The page will feature Hebrew as the primary language, dark/light mode toggle, smooth animations, and a floating mascot.

## Setup & Design System
- Import **Heebo** and **Inter** from Google Fonts
- Configure the color palette (WhatsApp green #25D366, teal #128C7E, indigo accent #6366F1) as CSS variables for light and dark modes
- Set `dir="rtl"` as default with `lang="he"`
- Add dark mode toggle using `next-themes`
- Copy the uploaded lightbulb mascot image into project assets

## Sticky Navbar
- RTL layout: Logo + "Pixi" brand on the **right**, menu links on the **left**
- Links: Home, Pricing, Login, Signup
- Primary CTA button: "התחל עכשיו" → `/signup`
- Dark/light mode toggle icon
- Sticky with subtle backdrop blur
- Mobile: hamburger menu with slide-in drawer

## Hero Section
- Split layout: bold Hebrew headline on the right, WhatsApp chat mockup on the left
- Headline: "סרטוני AI שמניעים פעולה"
- Subheadline + CTA button "התחל עכשיו - חינם" + trust line
- Chat mockup with sequentially animated message bubbles (user → Pixi processing → video ready with preview card)
- Mascot image near the chat UI

## Features Section (3 Cards)
- Three rounded cards with soft shadows and hover elevation
- "יצירה מהירה", "AI מתקדם", "WhatsApp נוח"
- Icons from Lucide (Zap, Sparkles, MessageCircle)

## How It Works (3 Steps)
- Horizontal step flow with icons, connecting lines/dots
- Steps: הירשם → ספר לנו → קבל סרטון
- Fade-in animation on scroll

## Pricing Preview
- Centered section with headline, description, and CTA linking to `/pricing`

## Final CTA
- Large centered block with gradient/glow background
- "מוכן ליצור סרטון AI?" + action button

## Footer
- Links: Pricing, Terms, Privacy
- Social icons: LinkedIn, Twitter
- © 2026 Pixi

## Floating Mascot
- Fixed position bottom-left corner (since RTL, opposite to reading flow)
- Gentle CSS floating animation + soft glow
- Hover: scale up; Click: opens `https://wa.me/972525515776`
- Tooltip: "צריך סרטון AI?"

## Pages/Routes
- `/` — Home page (this build)
- `/pricing`, `/login`, `/signup` — placeholder pages with coming-soon state

