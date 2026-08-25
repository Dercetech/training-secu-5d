#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_DIR="$PROJECT_ROOT/_servers/incinerator"
LOCAL_CONFIG="$PROJECT_ROOT/.env.local"
LOCAL_PASSWORD_FILE="$SOURCE_DIR/password.txt"

fail() {
  echo "Error: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required but was not found on PATH."
}

[[ -f "$LOCAL_CONFIG" ]] || fail ".env.local is missing. Copy .env.local.tpl and configure the SC8 target."

# shellcheck disable=SC1090
source "$LOCAL_CONFIG"

REMOTE_HOST="${DEPLOY_INCINERATOR_REMOTE_HOST:-}"
REMOTE_DIR="${DEPLOY_INCINERATOR_REMOTE_DIR:-}"

[[ -n "$REMOTE_HOST" ]] || fail "DEPLOY_INCINERATOR_REMOTE_HOST is not configured in .env.local."
[[ -n "$REMOTE_DIR" ]] || fail "DEPLOY_INCINERATOR_REMOTE_DIR is not configured in .env.local."
[[ -d "$SOURCE_DIR" ]] || fail "Incinerator source is missing: $SOURCE_DIR"

require_command rsync
require_command ssh

echo "Scratching the isolated SC8 Incinerator target."
echo "Source: $SOURCE_DIR/"
echo "Remote: $REMOTE_HOST:$REMOTE_DIR"

rsync \
  -az \
  --delete \
  --delete-delay \
  --exclude=.DS_Store \
  --exclude=.gitignore \
  --exclude=password.txt \
  --exclude=.well-known/ \
  --filter='P .well-known/' \
  --exclude=cgi-bin/ \
  --filter='P cgi-bin/' \
  --exclude=.incinerator-state/ \
  --filter='P .incinerator-state/' \
  -e "ssh -o BatchMode=yes" \
  --verbose \
  "$SOURCE_DIR/" \
  "${REMOTE_HOST}:${REMOTE_DIR}"

printf -v REMOTE_DIR_QUOTED '%q' "$REMOTE_DIR"
RESET_OUTPUT="$(ssh -o BatchMode=yes "$REMOTE_HOST" \
  "cd $REMOTE_DIR_QUOTED && php reset-lab.php --yes")"
printf '%s\n' "$RESET_OUTPUT"

NEW_PASSWORD="$(printf '%s\n' "$RESET_OUTPUT" | sed -n 's/^New classroom access password: //p' | tail -n 1)"
if [[ -n "$NEW_PASSWORD" ]]; then
  umask 077
  printf '%s\n' "$NEW_PASSWORD" > "$LOCAL_PASSWORD_FILE"
  echo "Saved the latest classroom password to $LOCAL_PASSWORD_FILE"
fi

echo "SC8 Incinerator was mirrored and reset to its clean fixture."
