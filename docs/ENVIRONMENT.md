# ResumeSprint Environment Variables

| Variable | Description | Required / Default |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string (e.g., `mongodb://localhost:27017/resumesprint` or Atlas URI) | Optional in test/dev (falls back to memory store); Required for production MongoDB replica-set |
| `MONGODB_DB_NAME` | Target MongoDB database name | Default: `resumesprint` |
| `GEMINI_API_KEY` | Google Gemini API Key for AI-assisted proposals and evidence analysis | Required for live AI; graceful deterministic fallback provided |
| `GEMINI_MODEL` | Gemini Model identifier | Default: `gemini-3.8-flash` |
| `BETTER_AUTH_SECRET` | Secret key for Better-Auth session signature verification | Required for production authentication |
| `BETTER_AUTH_URL` | Base URL of the application for callbacks and session management | Default: `http://localhost:3000` |
| `GITHUB_CLIENT_ID` | GitHub OAuth application client ID | Optional (for OAuth sign-in) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth application client secret | Optional (for OAuth sign-in) |
