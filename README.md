# StudyShelf 📖

A personal study app for UPSC/APPSC preparation. No login, no backend — your GitHub repo is the database.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## GitHub Repo Structure

Create a **private** GitHub repo (e.g. `upsc-notes`) with this folder layout:

```
upsc-notes/
├── notes/
│   ├── polity/
│   │   ├── fundamental-rights.pdf
│   │   └── dpsp.pdf
│   └── history/
│       └── modern-india.pdf
├── mcq/
│   ├── polity/
│   │   ├── fundamental-rights.json
│   │   └── parliament.json
│   └── economy/
│       └── budget-2024.json
└── current-affairs/
    ├── jan-2025/
    │   ├── notes.pdf
    │   └── mcq.json
    └── feb-2025/
```

- **notes/** → Tabs open the "Notes & Files" tab
- **mcq/** → Tabs open the "MCQ Practice" tab  
- **current-affairs/** → Tabs open the "Current Affairs" tab

## MCQ JSON Format

```json
{
  "title": "Polity — Fundamental Rights",
  "questions": [
    {
      "id": 1,
      "q": "Which Article abolishes untouchability?",
      "options": ["Article 14", "Article 15", "Article 17", "Article 21"],
      "answer": 2,
      "explanation": "Article 17 abolishes untouchability. (optional)"
    }
  ]
}
```

`answer` is the **0-indexed** position in options array.

A sample MCQ file is provided as `sample_mcq.json`.

## GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Create token with **Contents: Read** permission on your notes repo
3. Paste it in StudyShelf Settings

The token is stored only in your browser's localStorage.

## Deploy (Access Anywhere)

### Option A: GitHub Pages (free)
```bash
npm run build
# Push the dist/ folder to gh-pages branch
# or use: npx gh-pages -d dist
```

### Option B: Netlify (simplest)
1. `npm run build`
2. Drag & drop the `dist/` folder to https://app.netlify.com/drop
3. Get a URL like `https://studyshelf-abc123.netlify.app`

### Option C: Just open locally
```bash
npm run build
npm run preview
```
Then access from any device on the same Wi-Fi: `http://your-pc-ip:4173`
