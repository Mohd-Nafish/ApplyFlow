# ApplyFlow


ApplyFlow is a cross-platform job application tracker built with Expo and React Native. It helps you manage your application pipeline, visualize progress with analytics, and evaluate resume fit against job descriptions using secure AI-powered analysis.

---

## Overview

ApplyFlow combines a modern mobile experience with a Supabase backend. Users sign in, track applications through each hiring stage, and receive structured AI feedback on how well a resume matches a role—without exposing API keys in the client.

**Platform support:** iOS, Android, and Web (via Expo)

---

## Features

### Job tracking
- Create, read, update, and delete job applications
- Track company, role, status, applied date, and notes
- Pipeline statuses: Applied, Interview, Offer, Rejected
- Search and filter applications on the home screen
- Dashboard summary cards (total, interviews, offers, rejections)

### Analytics
- Application pipeline breakdown by status
- Visual progress indicators for hiring stages

### AI Resume Match
- Compare resume text against a job description
- Match score with strengths, missing skills, and improvement suggestions
- Powered by **Google Gemini** via a **Supabase Edge Function** (`resume-match`)
- Gemini API key stored server-side as a Supabase secret (never shipped in the app)
- Loading skeletons, animated results, and auto-scroll to analysis

### Authentication & data
- Email/password auth with **Supabase Auth**
- Protected routes—app content requires a signed-in session
- **Persistent cloud storage** in Supabase Postgres (`jobs` table, scoped per user)
- One-time migration from legacy local AsyncStorage data

### UI & navigation
- Clean, modern React Native UI with card-based layouts
- **Expo Router** file-based routing with bottom tab navigation
- Stack screens for add/edit job flows

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | [Expo](https://expo.dev) 54, [React Native](https://reactnative.dev) 0.81 |
| Language | TypeScript |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) 6 |
| Backend | [Supabase](https://supabase.com) (Auth, Postgres, Edge Functions) |
| AI | Google Gemini (`gemini-2.5-flash`) via Edge Function |
| Client SDK | `@supabase/supabase-js` |
| Local persistence | AsyncStorage (auth session + legacy migration) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  ApplyFlow (Expo / React Native)                          │
│  ┌─────────┐  ┌───────────┐  ┌─────────────────────────┐ │
│  │  Home   │  │ Analytics │  │     Resume Match        │ │
│  │  (CRUD) │  │ (stats)   │  │  → services/ai.ts       │ │
│  └────┬────┘  └─────┬─────┘  └───────────┬─────────────┘ │
│       │             │                     │               │
│       └─────────────┴─────────────────────┘               │
│                     │                                     │
│         context/auth-context · context/jobs-context       │
│                     │                                     │
│              lib/supabase.ts · lib/jobs-service.ts          │
└─────────────────────┼─────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
   Supabase Postgres        Supabase Edge Function
   (jobs + RLS)             (resume-match → Gemini API)
```

---

## Project structure

```
ApplyFlow/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigator
│   │   ├── index.tsx             # Home — job list & dashboard
│   │   ├── analytics.tsx         # Pipeline analytics
│   │   └── resume-match.tsx      # AI resume analysis
│   ├── add-job.tsx               # Create application
│   ├── edit-job/[id].tsx         # Edit application
│   └── _layout.tsx               # Root layout & auth gate
├── components/                   # UI components (forms, badges, auth)
├── context/                      # Auth & jobs React context
├── lib/                          # Supabase client, jobs API, DB types
├── services/                     # AI service (Edge Function client)
├── supabase/
│   ├── functions/resume-match/   # Deno Edge Function (Gemini)
│   └── config.toml
├── constants/                    # Theme tokens
└── assets/                       # App icons & splash
```

---

## Getting started

### Prerequisites

- Node.js **≥ 20.19.4** (see `package.json` engines)
- npm
- [Expo Go](https://expo.dev/go) or iOS Simulator / Android Emulator
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com/apikey) API key (for Resume Match)

### Installation

```bash
git clone <your-repo-url>
cd JobTrackerApp
npm install
```

### Environment variables (client)

Create a `.env` file in the project root (see `.env.example`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Restart the Expo dev server after changing env vars:

```bash
npm start
```

### Supabase setup

1. Create a Supabase project and enable **Email** auth.
2. Create a `jobs` table with RLS policies so users can only access their own rows (`user_id` = authenticated user).
3. Set the Edge Function secret:

   ```bash
   supabase secrets set GEMINI_API_KEY=your_gemini_api_key
   ```

4. Deploy the resume-match function:

   ```bash
   supabase functions deploy resume-match
   ```

See `supabase/.env.example` for the server-side secret name. The Gemini key must **not** be added to the Expo `.env` file.

### Run the app

```bash
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser
npm run lint       # ESLint
```

---

## Screenshots

> Add screenshots or a short demo GIF here once available.

| Home | Analytics | Resume Match |
| --- | --- | --- |
| _Screenshot placeholder_ | _Screenshot placeholder_ | _Screenshot placeholder_ |

---

## Future improvements

- PDF resume upload and parsing
- Job application reminders and follow-up dates
- Export pipeline data (CSV/PDF)
- OAuth providers (Google, GitHub)
- Offline-first sync improvements
- Dark mode polish across all screens
- Rate limiting and usage analytics for AI features

---

## Contributing

This repository is currently marked **private** in `package.json`. If you fork or open-source the project:

1. Open an issue to discuss significant changes.
2. Create a feature branch and submit a pull request with a clear description.
3. Ensure `npm run lint` passes before requesting review.

---

## License

No license file is included yet. All rights reserved unless a license is added to the repository.
=======
ApplyFlow is a React Native application built to help users track and manage their job applications efficiently.

The app allows users to:
- add and manage job applications
- track application status
- filter and search applications
- monitor analytics and progress
- persist data locally using AsyncStorage

## Features

- Add, edit, and delete job applications
- Search and filter functionality
- Application status tracking
- Analytics dashboard
- Persistent local storage with AsyncStorage
- Clean modern mobile UI
- Built using Expo Router

## Tech Stack

- React Native
- Expo
- TypeScript
- Expo Router
- AsyncStorage

## Screenshots

<p>
<img width="30%" alt="Simulator Screenshot - iPhone 17 Pro - 2026-05-10 at 22 01 46" src="https://github.com/user-attachments/assets/daf366dd-b4c2-45ea-b22a-0a95abb340a9" />

<img width="30%" alt="Simulator Screenshot - iPhone 17 Pro - 2026-05-10 at 22 06 58" src="https://github.com/user-attachments/assets/bc121f87-3dd8-470d-8e8a-30014a1ceb5b" />

<img width="30%" alt="Simulator Screenshot - iPhone 17 Pro - 2026-05-10 at 22 05 35" src="https://github.com/user-attachments/assets/38a6ddbe-c4eb-4ad6-849d-dca09793c6d4" />

<img width="30%" alt="Simulator Screenshot - iPhone 17 Pro - 2026-05-10 at 22 07 06" src="https://github.com/user-attachments/assets/f560150e-a436-46da-9b20-60f7ed3be5fd" />
</p>




## Demo

[_Demo Video Link_](https://drive.google.com/file/d/1y5fDINij_U6hxlLN404etqhnvTjpbSfV/view?usp=sharing)
[_Demo Video Link_](https://drive.google.com/file/d/1ZvX1XhWpbQiIUcU6H12pSftZtqC7bpmF/view?usp=sharing)

## Installation

```bash
npm install
npx expo start
>>>>>>> 0afc0f30ee48c0e40453d261559094917b8eb849
