# Dream Record 夢境紀錄器

A beautiful dream journal app with AI analysis, built with Next.js 16.

## Features

- 📝 Record dreams with rich text input
- 🏷️ Tag system with colorful chips
- 🤖 AI-powered dream analysis (OpenAI GPT-4.1)
- 📅 Calendar-based history view
- 🔥 Streak tracking
- 📤 Export/Import backup (JSON)
- 🌙 Beautiful dark theme

## Local Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up local database**:
   ```bash
   pnpm run db:dev:migrate
   ```

3. **Create `.env` file**:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   OPENAI_API_KEY="sk-..."
   ```

4. **Run dev server**:
   ```bash
   pnpm run dev
   ```

## Deploy to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Step 2: Create Database on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** tab → **Create Database** → **Postgres**
3. Name it `dream-record-db`
4. Click **Create**
5. The `DATABASE_URL` will be automatically added to your project

### Step 3: Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository `dream-record`
3. Add Environment Variables:
   - `OPENAI_API_KEY` = your OpenAI API key
   - (DATABASE_URL is auto-added if you created Vercel Postgres)
4. Click **Deploy**

### Step 4: Run Database Migration

After first deploy, push the schema to your database:

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Pull env variables
vercel env pull .env.production.local

# Push schema to database
pnpm run db:push
```

**Option B: Manual**
```bash
DATABASE_URL="postgresql://..." pnpm run db:push
```

## Future Features (Planned)

### Authentication
- [ ] User login with NextAuth.js
- [ ] OAuth providers (Google, GitHub)
- [ ] Email/password authentication

### Payments (Stripe)
- [ ] Premium subscription for unlimited AI analysis
- [ ] Stripe Checkout integration
- [ ] Webhook handling for subscription status

### Multi-user Support
- [ ] User-specific dream records
- [ ] Privacy settings
- [ ] Sharing dreams (optional)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for dream analysis | ✅ |
| `NEXTAUTH_SECRET` | NextAuth.js secret (for auth) | Future |
| `STRIPE_SECRET_KEY` | Stripe secret key (for payments) | Future |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (dev) / PostgreSQL (prod) via Prisma 7
- **UI**: Tailwind CSS 4, Framer Motion
- **AI**: OpenAI GPT-4.1
- **Deployment**: Vercel

## Database Schema

```prisma
model Dream {
  id        String   @id @default(cuid())
  content   String
  type      String   @default("dream") // "dream" | "no_dream"
  date      String   // YYYY-MM-DD
  tags      String   @default("[]") // JSON string of tags
  analysis  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## License

MIT
