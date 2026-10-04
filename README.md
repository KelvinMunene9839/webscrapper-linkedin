# LinkedIn Software Engineering Job Scraper

A robust, headless **Node.js & Puppeteer** web scraper designed to extract software engineering job opportunities directly from LinkedIn's public search pages.

---

## 🌟 Key Features

- **Public Guest Scraping**: Operates on LinkedIn's public guest job search portal—**no personal LinkedIn login or credentials required**, protecting your personal account from bans or rate limits.
- **Stealth Protection**: Utilizes `puppeteer-extra-plugin-stealth` to bypass automated bot detection techniques.
- **Configurable Filters**: Custom search keywords (e.g., "Software Engineer", "Frontend Developer"), target location, time posted (past 24h, past week, etc.), and experience levels.
- **Full Detail Extraction**: Optionally opens each posting to fetch the complete job description, requirements, and tech stack details.
- **Dual Export Formats**: Exports structured results to both **JSON** (`data/jobs.json`) and **CSV** (`data/jobs.csv`) files for easy import into Excel, databases, or job tracker dashboards.

---

## 📁 Project Structure

```text
linkedin-job-scraper/
├── .env                  # Local environment configuration file
├── .env.example          # Environment variables template
├── config.js             # Configuration loader & defaults
├── index.js              # Main CLI entrypoint
├── package.json          # Dependencies & npm scripts
├── README.md             # Documentation
└── src/
    ├── scraper.js        # Core Puppeteer browser automation & DOM parser
    └── utils.js          # Helpers (URL building, CSV/JSON export handlers)
```

---

## 🚀 Quick Start

### 1. Installation

Ensure Node.js (v18+) is installed on your system.

```bash
cd linkedin-job-scraper
npm install
```

### 2. Configuration

You can configure options in the `.env` file or pass CLI flags.

Example `.env`:
```env
KEYWORDS=Software Engineer
LOCATION=Remote
TIME_POSTED=week
MAX_JOBS=25
HEADLESS=true
EXTRACT_FULL_DESCRIPTION=true
```

---

## 🛠️ Usage

### Run Default Scraper
```bash
npm start
```
*or*
```bash
node index.js
```

### Run with Custom Command-Line Arguments
Override options directly from the command line:

```bash
# Scrape top 10 Remote Backend Engineer jobs posted in the past 24 hours
node index.js --keywords "Backend Engineer" --location "Remote" --max 10 --time "24h"

# Run in non-headless mode (visible browser window for debugging)
node index.js --keywords "Full Stack Engineer" --no-headless

# Fast preview mode without fetching full job descriptions
node index.js --keywords "DevOps Engineer" --no-description --max 50
```

---

## 📊 Sample Output Data

### `data/jobs.csv` / `data/jobs.json`
Scraped fields include:
- `ID`: Unique LinkedIn Entity URN
- `Job Title`: Title of the posting
- `Company`: Employer / Company Name
- `Location`: Job location / Remote status
- `Posted Date`: Posting age or timestamp
- `Job URL`: Direct link to apply or view on LinkedIn
- `Company URL`: Company page link
- `Description`: Full job description text & requirements
- `Scraped At`: Timestamp when scraped

---

## ⚠️ Responsible Scraping Guidelines

- **Respect Rate Limits**: Keep `DELAY_MS` set to at least `1500ms` to avoid overloading target servers.
- **Educational / Personal Job Search**: Built for personal job hunting and career opportunity discovery.
