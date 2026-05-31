https://github-profiler-j1e3.onrender.com
# GitHub Profiler API

A Node.js REST API that fetches GitHub user profiles, calculates insight metrics, persists them in MySQL, and exposes endpoints to analyze and retrieve stored profiles.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MySQL (mysql2 connection pool) |
| External API | GitHub REST API (`axios`) |
| Config | dotenv |

## Project Structure

```
Github_Profiler/
├── config/db.js              # MySQL connection pool
├── controllers/              # Request handlers
├── models/                   # Database access (upsert, queries)
├── routes/                   # Express route definitions
├── services/githubService.js # GitHub API client & metric calculations
├── schema.sql                # Database CREATE TABLE script
├── server.js                 # App entry point
└── .env                      # Local secrets (not committed)
```

## Local Setup

### Prerequisites

- Node.js 18+
- MySQL 8+ (local or cloud instance)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `3000`) |
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name (`github_profiler`) |
| `DB_PORT` | MySQL port (default: `3306`) |
| `GITHUB_TOKEN` | GitHub Personal Access Token (recommended) |

### 3. Create the database

```bash
mysql -u root -p < schema.sql
```

### 4. Start the server

```bash
npm start
```

The API will be available at `http://localhost:3000`.

## API Endpoints

### `POST /api/profiles/:username/analyze`

Fetches a GitHub user, calculates metrics, saves (or updates) the profile in MySQL, and returns the insight object.

**Example**

```bash
curl -X POST http://localhost:3000/api/profiles/octocat/analyze
```

**Success response (200)**

```json
{
  "status": "success",
  "message": "Profile for \"octocat\" analyzed and saved successfully",
  "data": {
    "id": 1,
    "username": "octocat",
    "display_name": "The Octocat",
    "bio": null,
    "followers": 22804,
    "following": 9,
    "public_repos": 8,
    "account_age_days": 5604,
    "influence_score": 22994,
    "last_analyzed_at": "2026-05-31T10:55:20.000Z"
  }
}
```

**Calculated metrics**

- `account_age_days` — days since the GitHub account was created
- `influence_score` — `followers + (public_repos × 5) + (years on GitHub × 10)`

**Error responses**

| Status | Body |
|--------|------|
| 404 | `{ "error": "GitHub user not found" }` |
| 429 | `{ "error": "GitHub API rate limit exceeded..." }` |

---

### `GET /api/profiles`

Returns all profiles stored in the database.

**Query parameters**

| Param | Description | Example |
|-------|-------------|---------|
| `sort` | Sort field: `followers`, `following`, `repos`, `account_age`, `influence`, `username`, `analyzed` | `?sort=followers` |
| `order` | `ASC` or `DESC` (default: `DESC`) | `?order=asc` |
| `minRepos` | Minimum public repo count | `?minRepos=10` |
| `minFollowers` | Minimum follower count | `?minFollowers=1000` |

**Example**

```bash
curl "http://localhost:3000/api/profiles?sort=followers&minRepos=5"
```

**Success response (200)**

```json
{
  "status": "success",
  "count": 2,
  "data": [ /* array of profile objects */ ]
}
```

---

### `GET /api/profiles/:username`

Returns a single saved profile from the database.

**Example**

```bash
curl http://localhost:3000/api/profiles/octocat
```

**Success response (200)**

```json
{
  "status": "success",
  "data": { /* profile object */ }
}
```

**Not found (404)**

```json
{
  "error": "No saved profile found for username \"unknownuser\""
}
```

---

### `GET /api/profiles/stats/summary` *(bonus feature)*

Returns aggregate analytics across every profile stored in your database — useful for dashboards and demos.

**Example**

```bash
curl http://localhost:3000/api/profiles/stats/summary
```

**Success response (200)**

```json
{
  "status": "success",
  "data": {
    "total_profiles": 3,
    "avg_followers": 15200,
    "avg_public_repos": 42.5,
    "avg_influence_score": 18500,
    "max_influence_score": 45000,
    "total_followers_across_profiles": 45600,
    "top_by_influence": {
      "username": "torvalds",
      "display_name": "Linus Torvalds",
      "influence_score": 45000,
      "followers": 220000,
      "public_repos": 5
    },
    "most_followed": {
      "username": "torvalds",
      "display_name": "Linus Torvalds",
      "followers": 220000,
      "influence_score": 45000
    }
  }
}
```

---

### `GET /health`

Simple health check endpoint.

## Deployment Notes

1. **Database** — Host MySQL on Aiven, Railway, Clever Cloud, or similar. Run `schema.sql` against the production database.
2. **API** — Deploy to Render, Railway, or Fly.io. Set all `.env` variables in the platform dashboard.
3. **GitHub token** — Add `GITHUB_TOKEN` in production to avoid anonymous rate limits (60 requests/hour).

## Features

- GitHub API integration with optional Bearer token authentication
- Account age and custom influence score calculations
- MySQL upsert via `ON DUPLICATE KEY UPDATE`
- Query filtering (`minRepos`, `minFollowers`) and sorting on list endpoint
- **Dashboard stats** — `GET /api/profiles/stats/summary` with averages and top profiles
- Graceful handling of non-existent GitHub users (404)

## Submission Checklist

- [ ] GitHub PAT added to `.env` (`GITHUB_TOKEN`)
- [ ] All 3 required endpoints tested locally
- [ ] Bonus feature tested (`/stats/summary`)
- [ ] `schema.sql` included in repo
- [ ] README documents setup, env vars, and API shapes
- [ ] Cloud MySQL created and schema applied
- [ ] API deployed with production env vars set
- [ ] Live deployment URL added to README or submission form
