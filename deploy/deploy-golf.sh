#!/bin/bash
# Forced command for the GitHub Actions deploy key. Install on the server as ~/bin/deploy-golf.sh and
# lock the key to it in ~/.ssh/authorized_keys:
#
#   restrict,command="/home/tom/bin/deploy-golf.sh" ssh-ed25519 AAAA... github-actions-deploy
#
# sshd runs THIS script no matter what the client asked for; the client's request arrives in
# SSH_ORIGINAL_COMMAND and is only ever treated as data: "deploy <branch>", "check <branch>" or
# "dry-run". Anything else is rejected.
set -euo pipefail

REPO=/home/tom/ri-tee-times
IMAGE=tapontikes/golf-ri.com:latest

req="${SSH_ORIGINAL_COMMAND:-}"
action=""
branch=master
# Look for "deploy|check|dry-run [branch]" in the request. It is only ever matched against a
# fixed pattern, never executed, and anything that does not match is rejected (no deploy).
if [[ "$req" =~ (^|[[:space:]])(deploy|check|dry-run)([[:space:]]+([A-Za-z0-9][A-Za-z0-9._/-]{0,79}))?([[:space:]]|$) ]]; then
  action=${BASH_REMATCH[2]}
  [[ -n "${BASH_REMATCH[4]}" ]] && branch=${BASH_REMATCH[4]}
else
  echo "unsupported request; expected: deploy|check|dry-run [branch]" >&2
  exit 2
fi

cd "$REPO"
git fetch --quiet origin
# Only ever deploy a branch that really exists on the remote.
git rev-parse --verify --quiet "refs/remotes/origin/$branch" >/dev/null || branch=master

case "$action" in
  dry-run) echo "dry-run ok (would deploy origin/$branch)"; exit 0 ;;
  check)   echo "check ok: origin/$branch at $(git rev-parse --short "origin/$branch")"; exit 0 ;;
esac

echo "Deploying origin/$branch ($(git rev-parse --short "origin/$branch"))"
git checkout --quiet "$branch"
# Sync the working tree exactly with the remote so the deploy always matches the repo.
git reset --hard "origin/$branch"

docker pull "$IMAGE"
docker compose up -d --no-deps --force-recreate app
docker image prune -f
echo "Deploy finished."
