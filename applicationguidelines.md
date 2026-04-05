
---

## `application guidelines.md`

```markdown
# Application Guidelines – Habit Arena

## Project Overview
**Daily Task Duel: Habit Arena** is a real-time competitive habit tracker where two users (Ajay and Selvaa) compete by completing daily tasks. Each task awards XP based on difficulty, and the app tracks streaks, levels, and weekly analytics.

## Tech Stack (Strict)
| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS + Lucide Icons |
| Animations | Framer Motion |
| Backend | Supabase (PostgreSQL + Realtime) |
| Charts | Recharts |
| AI (optional) | Google Gemini API |

## Core Features Checklist

- [x] Countdown timer to 11:59 PM with Rush Mode (red glow + pulse)
- [x] Live duel dashboard (Ajay vs Selvaa) with points, streak, XP bar
- [x] Real‑time task feed using Supabase subscriptions
- [x] Task creation form (title, difficulty, category)
- [x] Streak system (increments on consecutive active days)
- [x] Weekly analytics bar chart (points per day, win count)
- [x] Leveling system (Beginner → Warrior → Elite → Monster)
- [x] Winner crown animation and victory screen
- [x] Mobile responsive layout (sidebar collapses to bottom nav)

## UI/UX Standards

### Colors (Dark Theme)
- Background: `#000000`
- Primary (Ajay): `#81ecff` (cyan)
- Secondary (Selvaa): `#e966ff` (pink)
- Tertiary (Rush Mode): `#ff7076` (red)
- Glass card: `bg-white/5 backdrop-blur-xl`

### Typography
- Headlines: `Space Grotesk`, 700–900 weight
- Body: `Inter`, 300–600 weight
- Monospace: `JetBrains Mono` for stats and timers

### Animations
- Hover: scale(1.02) + y‑translate
- Click: scale(0.98)
- Winner crown: bounce infinite
- Rush Mode pulse: 0.5s opacity cycle

## Supabase Schema

### Tables
```sql
users (id, name)
tasks (id, user_id, title, difficulty, points, category, created_at)
streaks (user_id, current_streak, longest_streak, last_active_date)