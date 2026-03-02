# SmartShop (Next.js Pages Router + Supabase)

## Setup

1. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

2. Install dependencies:

```bash
npm install
```

3. Run dev server:

```bash
npm run dev
```

## Pages

- `/` — landing
- `/catalog` — smartphone catalog
- `/product/[id]` — product detail
- `/cart` — cart
- `/checkout` — pickup checkout
- `/branches` — branches map/list
- `/auth` — magic link auth
- `/account` — user orders
