# Reelhouse operations

The production site is designed to run on Vercel from this GitHub repository. ChatGPT Sites is not part of the production runtime or release process.

## One-time Vercel setup

1. In Vercel, import `Vilguinvyhypca/laughing-potato` from GitHub.
2. Keep the detected framework as **Next.js** and the production branch as **main**.
3. Deploy the project. No Jellyfin credentials or environment variables are required.
4. Add a custom domain in Vercel when desired.

Vercel creates a preview for pull requests and publishes production when an approved change is merged into `main`.

## Refresh the public catalog

From a clean local clone on Windows, run:

```powershell
npm run catalog:update
```

GitHub CLI must be authenticated once from your normal PowerShell session. The updater can locate the standard `C:\Program Files\GitHub CLI\gh.exe` installation even when `gh` is not on `PATH`.

The updater will:

1. update `main` from GitHub;
2. create a timestamped catalog branch;
3. ask for the Jellyfin credentials locally;
4. export only the public catalog fields and posters;
5. run catalog safety tests;
6. push the branch and open a draft pull request.

Review and merge the pull request. Vercel will deploy it automatically. Jellyfin credentials, server addresses, IDs, tokens, and playback URLs are never committed or sent to Vercel.

## Application changes

Create a feature branch, open a pull request, and review the GitHub validation check and Vercel preview. Merge the pull request to deploy production.
