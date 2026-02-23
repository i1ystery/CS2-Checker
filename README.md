# CS2 Checker

A web application for tracking Counter-Strike 2 player statistics with heatmap visualizations. Search any player by their Faceit nickname or profile link, view detailed stats, match history, and generate heatmaps from demo files.

## Prerequisites

- **Node.js** 18 or newer — [download here](https://nodejs.org/)
- **Faceit API Key** (free) — see instructions below

No database installation is needed. The app uses SQLite, which is embedded and creates its data file automatically on first run.

## Getting a Faceit API Key

1. Go to [developers.faceit.com](https://developers.faceit.com/) and sign in with your Faceit account.
2. Navigate to **App Studio** and create a new application.
3. Generate a **Server side API Key**.
4. Copy the key — you will paste it during setup.

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd CS2-Checker
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
npm install
```

Open `backend/.env` and replace `your_faceit_api_key_here` with your actual Faceit API key.

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env.local
npm install
```

The default `NEXT_PUBLIC_API_URL=http://localhost:4000` should work out of the box.

## Running the App

Open two terminal windows:

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

The app will be available at **http://localhost:3000**.

## How It Works

1. Search for any CS2 player using their Faceit nickname or profile URL.
2. View their overall statistics (ELO, K/D, HS%, Win Rate) and recent match history.
3. Open a match detail and upload a `.dem` demo file to generate kill/death heatmaps.
4. Parsed demo data is stored locally in SQLite so it loads instantly on subsequent visits.

## Project Structure

```
CS2-Checker/
├── backend/          Node.js + Express API server
│   ├── src/
│   │   ├── database/ SQLite connection, models, services
│   │   ├── routes/   API endpoints
│   │   ├── services/ Faceit API integration, demo parser
│   │   └── types/    TypeScript type definitions
│   └── data/         SQLite database file (auto-created)
│
└── frontend/         Next.js + React UI
    └── src/
        ├── app/      Pages (home, player profile, match detail)
        └── components/
```
