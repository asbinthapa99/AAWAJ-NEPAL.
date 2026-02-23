# Awaaz Nepal (आवाज नेपाल)

**Voice of Nepali Youth** — A civic engagement platform for Nepali youth to raise their voices about problems affecting Nepal.

> Live: [https://aawaj-nepal-moii.vercel.app](https://aawaj-nepal-moii.vercel.app)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Security](#security)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

Awaaz Nepal is a full-stack web application that empowers Nepali citizens to report civic issues — from infrastructure failures to governance concerns — and rally community support. Users create posts categorized by topic and urgency, support others' posts, comment, and report inappropriate content.

## Features

| Feature | Description |
|---|---|
| **User Authentication** | Email/password registration and login via Supabase Auth |
| **Post Creation** | Create posts with title, content, category, urgency level, district, and optional image |
| **Category System** | 11 categories: Infrastructure, Education, Health, Environment, Governance, Safety, Employment, Social Issues, Culture, Technology, Other |
| **Urgency Levels** | Low, Medium, High, Critical — color-coded badges |
| **District Tagging** | Tag posts with any of Nepal's 77 districts |
| **Support (Upvote)** | Toggle support on posts; counts auto-update via database triggers |
| **Comments** | Add and delete comments on posts; counts auto-update via triggers |
| **Report System** | Report inappropriate posts with a reason; one report per user per post |
| **User Profiles** | Editable profile with name, bio, and district |
| **Image Upload** | Upload images (JPEG/PNG/GIF/WebP, max 5MB) to Supabase Storage |
| **Dark/Light Theme** | System-aware theme toggle with manual override |
| **Category Filtering** | Filter feed by category |
| **Responsive Design** | Mobile-first design with Tailwind CSS |

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS 4 |
| **Icons** | Lucide React |
| **Backend** | [Supabase](https://supabase.com) (Auth, Postgres, Storage, RLS) |
| **Auth** | Supabase Auth with `@supabase/ssr` |
| **Deployment** | Vercel |

## Architecture

```
┌──────────────────────────────────────────┐
│             Next.js App Router           │
│  ┌────────────────────────────────────┐  │
│  │   Client Components ('use client') │  │
│  │   - Pages (feed, post, profile)    │  │
│  │   - Components (PostCard, etc.)    │  │
│  └──────────────┬─────────────────────┘  │
│                 │                         │
│  ┌──────────────▼─────────────────────┐  │
│  │   Supabase Client (@supabase/ssr)  │  │
│  │   - Browser client (client.ts)     │  │
│  │   - Server client (server.ts)      │  │
│  │   - Middleware (session refresh)    │  │
│  └──────────────┬─────────────────────┘  │
│                 │                         │
│  ┌──────────────▼─────────────────────┐  │
│  │      Middleware (middleware.ts)     │  │
│  │   - Session refresh on every req   │  │
│  │   - Auth route protection          │  │
│  └──────────────┬─────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │
    ┌─────────────▼─────────────────┐
    │       Supabase Cloud          │
    │  ┌─────────┐ ┌────────────┐  │
    │  │  Auth    │ │  Storage   │  │
    │  └────┬────┘ │ (images)   │  │
    │       │      └────────────┘  │
    │  ┌────▼───────────────────┐  │
    │  │  PostgreSQL + RLS      │  │
    │  │  - profiles            │  │
    │  │  - posts               │  │
    │  │  - comments            │  │
    │  │  - supports            │  │
    │  │  - reports             │  │
    │  │  + triggers & indexes  │  │
    │  └────────────────────────┘  │
    └───────────────────────────────┘
```

### Data Flow

1. **Auth**: User signs up → Supabase Auth creates `auth.users` row → `handle_new_user()` trigger auto-creates `profiles` row
2. **Posts**: Authenticated user submits form → optional image uploaded to `post-images` bucket → post inserted into `posts` table
3. **Supports**: User clicks support → row inserted/deleted in `supports` → trigger auto-updates `posts.supports_count`
4. **Comments**: Similar trigger-based count management via `comments_count`

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/asbinthapa99/AAWAJ-NEPAL..git
cd AAWAJ-NEPAL.
npm install
```

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql)
3. Go to **Storage** and create a public bucket named `post-images`
4. Copy your project URL and anon key from **Settings → API**

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key |

> The app will throw an error at startup if these are missing.

## Database Schema

### Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `profiles` | User profiles (auto-created on signup) | `id`, `username`, `full_name`, `bio`, `district` |
| `posts` | Community posts | `title`, `content`, `category`, `urgency`, `district`, `image_url` |
| `comments` | Comments on posts | `post_id`, `author_id`, `content` |
| `supports` | Upvotes (unique per user per post) | `post_id`, `user_id` |
| `reports` | Content reports (unique per user per post) | `post_id`, `reporter_id`, `reason` |

### Row Level Security (RLS)

All tables have RLS enabled:

- **profiles**: Public read, owner insert/update
- **posts**: Public read, owner insert/update/delete
- **comments**: Public read, owner insert/update/delete
- **supports**: Public read, owner insert/delete
- **reports**: Owner insert/read only

### Database Triggers

| Trigger | Table | Function | Purpose |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` | `handle_new_user()` | Auto-create profile on signup |
| `on_support_added` | `supports` | `increment_supports_count()` | Update post support count |
| `on_support_removed` | `supports` | `decrement_supports_count()` | Update post support count |
| `on_comment_added` | `comments` | `increment_comments_count()` | Update post comment count |
| `on_comment_removed` | `comments` | `decrement_comments_count()` | Update post comment count |

### CHECK Constraints

- `posts.category` must be one of the 11 valid categories
- `posts.urgency` must be one of: `low`, `medium`, `high`, `critical`

## Security

### Implemented Measures

| Layer | Measure | Details |
|---|---|---|
| **HTTP Headers** | Security headers | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy` |
| **Auth** | Route protection | Middleware redirects unauthenticated users from `/post/create` to login |
| **Auth** | Session management | Supabase SSR cookie-based sessions, refreshed on every request |
| **Database** | Row Level Security | All tables enforce ownership checks via `auth.uid()` |
| **Database** | CHECK constraints | Category and urgency values validated at DB level |
| **Database** | UNIQUE constraints | One support and one report per user per post |
| **Database** | SECURITY DEFINER | Trigger functions run with elevated privileges, isolated from user context |
| **Upload** | File validation | Client-side MIME type check (JPEG/PNG/GIF/WebP only) and 5MB size limit |
| **Environment** | Env var validation | App crashes fast if Supabase credentials are missing |
| **Error Handling** | Graceful failures | All Supabase operations check for errors and handle gracefully |
| **Frontend** | Safe config access | URGENCY_CONFIG lookups use fallback to prevent crashes on invalid data |

### Security Headers (via `next.config.ts`)

```
X-Frame-Options: DENY                    — Prevents clickjacking
X-Content-Type-Options: nosniff          — Prevents MIME-sniffing
Strict-Transport-Security: max-age=2y    — Forces HTTPS
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Project Structure

```
awaaz-nepal/
├── public/                      # Static assets
├── supabase/
│   └── schema.sql               # Full database schema (tables, RLS, triggers, indexes)
├── src/
│   ├── middleware.ts             # Next.js middleware entry point
│   ├── app/
│   │   ├── layout.tsx            # Root layout (AuthProvider, ThemeProvider, Navbar)
│   │   ├── page.tsx              # Home feed with category filters
│   │   ├── globals.css           # Tailwind CSS imports
│   │   ├── auth/
│   │   │   ├── login/page.tsx    # Login page
│   │   │   └── register/page.tsx # Registration page
│   │   ├── post/
│   │   │   ├── create/page.tsx   # Create new post (protected)
│   │   │   └── [id]/page.tsx     # Post detail with comments
│   │   └── profile/
│   │       └── [id]/page.tsx     # User profile with posts
│   ├── components/
│   │   ├── AuthProvider.tsx      # Auth context (user, profile, signOut)
│   │   ├── CategoryFilter.tsx    # Category filter bar
│   │   ├── CommentSection.tsx    # Comments list and form
│   │   ├── Navbar.tsx            # Top navigation bar
│   │   ├── PostCard.tsx          # Post card for feed
│   │   ├── ReportDialog.tsx      # Report post modal
│   │   ├── SupportButton.tsx     # Support/upvote toggle button
│   │   ├── ThemeProvider.tsx     # Theme context (light/dark/system)
│   │   └── ThemeToggle.tsx       # Theme toggle button
│   └── lib/
│       ├── categories.ts         # Category definitions and districts list
│       ├── constants.ts          # App constants, urgency config
│       ├── types.ts              # TypeScript interfaces
│       └── supabase/
│           ├── client.ts         # Browser Supabase client
│           ├── middleware.ts      # Middleware Supabase client + route guards
│           └── server.ts         # Server-side Supabase client
├── next.config.ts                # Next.js config with security headers
├── package.json
└── tsconfig.json
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and commit: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Code Style

- TypeScript strict mode
- ESLint with Next.js config
- Tailwind CSS for styling
- `'use client'` directive for client components

---

Built with ❤️ for Nepal
