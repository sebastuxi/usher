#!/usr/bin/env bash
# Publish Usher: the source to github.com/<owner>/usher (main) and the built site to GitHub Pages (gh-pages).
#
#   bash scripts/publish.sh                 # build and publish as is
#   bash scripts/publish.sh <PLAYBACK_ID>   # first set the Mux public playback ID the players stream from
#
# Needs: Node/npm, git, and the GitHub CLI signed in (`gh auth status`).
# The site is served at https://<owner>.github.io/usher/ (the build uses relative URLs, so a subfolder works).
set -euo pipefail

REPO_NAME="usher"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLAYER="$ROOT/apps/preview/src/frame/player.ts"
cd "$ROOT"

OWNER="$(gh api user --jq .login)"
OWNER_ID="$(gh api user --jq .id)"
REPO="$OWNER/$REPO_NAME"
REMOTE="https://github.com/$REPO.git"
AUTHOR_NAME="$(git config --global user.name || echo "$OWNER")"
AUTHOR_EMAIL="$OWNER_ID+$OWNER@users.noreply.github.com"
# Push with the GitHub CLI as the credential helper for this command only (no global git config changes).
export GIT_TERMINAL_PROMPT=0
GIT_GH=(git -c credential.helper= -c "credential.helper=!gh auth git-credential")

if [[ $# -ge 1 && -n "$1" ]]; then
  ID="$1"
  if [[ ! "$ID" =~ ^[A-Za-z0-9]{10,80}$ ]]; then
    echo "That does not look like a Mux playback ID (letters and digits only): $ID" >&2
    exit 1
  fi
  sed -i '' -E "s/^export const USHER_MUX_ID = '[^']*';/export const USHER_MUX_ID = '$ID';/" "$PLAYER"
  grep -q "USHER_MUX_ID = '$ID'" "$PLAYER" || { echo "Could not set the playback ID in $PLAYER" >&2; exit 1; }
  echo "Mux playback ID set: $ID"
fi

echo "Checking types and building…"
npm run typecheck
npm run build
touch dist/.nojekyll

echo "Publishing the source to $REPO (main)…"
if ! gh repo view "$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" --public \
    --description "Usher: a Video.js v10 skin where the playhead tells the time. Video.js Skins Design Challenge entry." \
    --homepage "https://$OWNER.github.io/$REPO_NAME/"
fi
if [[ ! -d .git ]]; then
  git init -q -b main
fi
git remote remove origin >/dev/null 2>&1 || true
git remote add origin "$REMOTE"
git add -A
if ! git diff --cached --quiet; then
  git -c user.name="$AUTHOR_NAME" -c user.email="$AUTHOR_EMAIL" commit -q -m "Publish Usher skin and showcase

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
fi
"${GIT_GH[@]}" push -q -u origin main

echo "Publishing the site to GitHub Pages (gh-pages)…"
SITE="$(mktemp -d)"
cp -R dist/. "$SITE/"
(
  cd "$SITE"
  git init -q -b gh-pages
  git add -A
  git -c user.name="$AUTHOR_NAME" -c user.email="$AUTHOR_EMAIL" commit -q -m "Deploy site"
  "${GIT_GH[@]}" push -q -f "$REMOTE" gh-pages
)
rm -rf "$SITE"

gh api -X POST "repos/$REPO/pages" -f "source[branch]=gh-pages" -f "source[path]=/" >/dev/null 2>&1 || true

echo
echo "Done. The site goes live in a minute or two at:"
echo "  https://$OWNER.github.io/$REPO_NAME/"
echo "Source: https://github.com/$REPO"
