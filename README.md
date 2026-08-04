# Meka Musume (Browser)

Tokyo Kikai Academy · Team 07 command game.

**Play:** https://kairukun.github.io/meka-musume-browser/

**Repo:** https://github.com/kairukun/meka-musume-browser

## Run locally

```bash
npm install
npm run dev
```

## Systems

- Day / fatigue / INT / Squad STR
- Affinity + bond ranks (3 / 6 / 10)
- Briefings, drills, 5v5 sim
- Local save (`localStorage`)

## Stack

React + Vite + TypeScript + Zustand

## Deploy notes

The live site is served from the `gh-pages` branch.
After changing the game, rebuild and republish:

```bash
$env:VITE_BASE="/meka-musume-browser/"   # PowerShell
npm run build
# then copy dist/ onto the gh-pages branch and push
```
