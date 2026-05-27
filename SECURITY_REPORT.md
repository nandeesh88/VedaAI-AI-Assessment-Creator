# Security Report — Hardcoded Secrets Scan

Summary
-------
- I scanned the repository for common secret patterns (API keys, DB URLs, tokens).
- Findings: some environment files with secrets exist locally; their values are NOT included in this report.

Files of concern
----------------
- `backend/.env` — contains environment secrets (MONGODB_URI, REDIS_URL, GROQ_API_KEY).
- `SETUP_GUIDE.txt` — contains example env lines (safe), but review before publishing.

Files already present for safe publishing
---------------------------------------
- `backend/.env.example` and `frontend/.env.example` — use these in the repo instead of real secrets.
- Root `.gitignore` already lists `.env` and `.env.local` (ensures `.env` files are ignored going forward).

Recommended immediate actions (run locally)
-------------------------------------------
1. Check if the sensitive files are tracked in git:

```bash
git ls-files --cached | grep -E '^backend/\.env$' || echo "backend/.env not tracked"
```

2. If `backend/.env` is tracked, remove it from the index and commit:

```bash
git rm --cached backend/.env
git commit -m "Remove backend .env from repository"
git push origin main
```

3. If the sensitive file was already pushed and needs history removal, use the BFG (recommended) or git filter-branch.
   Example using BFG:

```bash
# install BFG (https://rtyley.github.io/bfg-repo-cleaner/)
java -jar bfg.jar --delete-files backend/.env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

4. Rotate credentials immediately for any secrets that were committed (MongoDB user, Upstash/Redis, GROQ/API keys).

5. Add secret scanning to CI (optional): tools such as `detect-secrets`, `git-secrets` or `trufflehog`.

Notes & cautions
----------------
- Do NOT push secrets to a public repo. If any secret was pushed, assume compromise and rotate it.
- This repo already has `.env.example` files — ensure developers populate their own local `.env` from those templates.

If you want, I can:
- automatically remove `backend/.env` from the working tree and commit the removal for you (I will not add or expose the secret), or
- generate a short bash script to automate the removal and history-clean steps that you can run locally.
