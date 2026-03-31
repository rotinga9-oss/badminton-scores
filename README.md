# 🏆 Sport Score Tracker

A flexible web app to track match scores and player rankings for any racket sport (badminton, squash, table tennis, etc.).

## Features

- **First-run setup** – prompted to name your sport before anything else
- **Rankings** – live leaderboard; ties broken by head-to-head wins
- **3 scheduling modes** – see below
- **Tournament view** – fixture list with inline result recording + live standings
- **Match history** – view / delete all matches
- **Players** – add, rename, or remove players (dynamic roster)

---

## Scoring

| Result | Points |
|--------|--------|
| Win    | +2 per player on winning team |
| Loss   | +0 |

Ties broken by head-to-head wins between tied players.

---

## Scheduling Modes

### 1 — Match by Match
Record individual matches on the fly with no tournament setup.
- Choose team size (1–4 per team)
- Pick players, select winner, save

### 2 — Auto Schedule
Let the app generate a full schedule from your player roster.
- Set **total players** and **team size**
- App forms teams and generates a round-robin fixture list
- Toggle **Randomize** to shuffle player assignment and match order

### 3 — Custom Schedule
Full control over teams, players, and match order.
- Set **number of teams** and **players per team**
- Edit the fixture list: add, remove, reorder (▲▼) matches, or randomize order
- **Randomize player assignment** — randomly distributes players across teams at setup
- **Randomize players between each match** — before each fixture, players of the two participating teams are re-shuffled between the teams (great for casual round-robins)

---

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

### 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create sport-score-tracker --public --source=. --push
# or manually: git remote add origin <url> && git push -u origin main
```

### 2 — Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. All defaults work (Next.js auto-detected)
4. Click **Deploy** ✅

No environment variables or backend required — all data in localStorage.

---

## Project structure

```
app/
  page.js           → Rankings (home) + first-run sport setup
  schedule/page.js  → 3-mode schedule setup
  tournament/page.js→ Active tournament fixture list
  matches/page.js   → Quick match (match-by-match)
  history/page.js   → All match history
  settings/page.js  → Sport name + player roster
components/
  Navbar.js         → Dynamic sport name in header
  SportSetup.js     → First-run modal
lib/
  storage.js        → All localStorage operations
  schedule.js       → Round-robin, randomize, player assignment logic
  rankings.js       → Points + head-to-head tiebreaker logic
```
