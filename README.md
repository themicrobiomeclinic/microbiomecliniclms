# TMC Education Platform

**Microbiome Medicine for General Practice** — by The Microbiome Clinic

A clinical education platform built with Next.js, Supabase, and Tailwind CSS.

## Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **Backend**: Supabase (Auth, Database, Row Level Security)
- **Styling**: Tailwind CSS with custom TMC brand tokens
- **Hosting**: Vercel
- **Store**: Shopify (purchase flow only — webhook integration pending)

## Setup

### 1. Supabase
- Create a project at [supabase.com](https://supabase.com)
- Run `supabase/schema.sql` in the SQL Editor
- Enable Email auth in Authentication → Providers
- Copy your project URL and anon key

### 2. Environment Variables
```bash
cp .env.local.example .env.local
```
Fill in your Supabase credentials.

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. Deploy to Vercel
- Push to GitHub
- Import project in Vercel
- Add environment variables
- Deploy

## Project Structure

```
src/
├── app/
│   ├── auth/           # Login, forgot password
│   ├── dashboard/      # Main course interface
│   │   ├── modules/
│   │   │   └── [moduleSlug]/
│   │   │       ├── [chapterSlug]/  # Chapter reading page
│   │   │       ├── quiz/           # Module quiz
│   │   │       └── ask/            # Question submission
│   │   ├── layout.tsx  # Dashboard shell (sidebar + topbar)
│   │   └── page.tsx    # Course overview
│   ├── no-access/      # Paywall gate
│   └── layout.tsx      # Root layout
├── components/
│   ├── auth/           # AuthProvider context
│   └── dashboard/      # Sidebar, TopBar
├── lib/
│   ├── supabase/       # Client + server Supabase clients
│   └── types.ts        # TypeScript types matching DB schema
└── middleware.ts        # Auth session refresh
```

## Content Management

Chapters are stored in the `chapters` table. To add content:

1. Go to Supabase → Table Editor → chapters
2. Find the chapter row
3. Edit `content_html` with the chapter's HTML content
4. Optionally fill in `key_takeaways` (JSON array), `clinical_application`, and `references`

## Future: Shopify Webhook

When ready, run `supabase/webhook-handler.sql` and configure a Shopify webhook to call the Supabase Edge Function on order creation. This will auto-grant course access when a GP purchases.
