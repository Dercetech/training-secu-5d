#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
REQUESTED_TARGET="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVERS_ROOT="$PROJECT_ROOT/_servers"
LOCAL_CONFIG="$PROJECT_ROOT/.env.local"

if [[ -f "$LOCAL_CONFIG" ]]; then
  # shellcheck disable=SC1090
  source "$LOCAL_CONFIG"
fi

# Targets are explicit so this script can never infer a remote destination from
# a directory name. A target is synced only when both local-only values exist.
TARGETS=(
  "training.dercetech.com"
  "training2.dercetech.com"
  "second-domain"
  "second-domain-root"
)
CONFIGURED_TARGETS=()
SSH_OPTS=(-o BatchMode=yes)
RSYNC_PUSH=(
  -az
  --delete
  --delete-delay
  --exclude=.DS_Store
  --exclude=.gitkeep
  --exclude=.well-known/
  --filter='P .well-known/'
  --exclude=cgi-bin/
  --filter='P cgi-bin/'
  -e "ssh ${SSH_OPTS[*]}"
)

usage() {
  cat <<'EOF'
Usage: bash scripts/sync-deploy.sh {sync|watch} [target]

Modes:
  sync [target]  Mirror one configured target, or every configured target.
  watch          Mirror every configured target, then watch all of _servers/.
                 A changed path syncs only its configured target.

Known targets:
  training.dercetech.com  _servers/training.dercetech.com/ -> /labs/
  training2.dercetech.com _servers/training2.dercetech.com/ -> its document root
  second-domain           _servers/second-domain/ -> the second domain document root
  second-domain-root      _servers/second-domain-root/ -> the Bad Sector document root

Configuration lives only in .env.local. Copy .env.local.tpl to get started.
EOF
}

fail() {
  echo "Error: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required but was not found on PATH."
}

target_source() {
  case "$1" in
    training.dercetech.com) printf '%s/' "$SERVERS_ROOT/training.dercetech.com" ;;
    training2.dercetech.com) printf '%s/' "$SERVERS_ROOT/training2.dercetech.com" ;;
    second-domain) printf '%s/' "$SERVERS_ROOT/second-domain" ;;
    second-domain-root) printf '%s/' "$SERVERS_ROOT/second-domain-root" ;;
    *) fail "Unknown deployment target: $1" ;;
  esac
}

target_host() {
  case "$1" in
    training.dercetech.com)
      # API_SYNC_* keeps the existing private local configuration working.
      printf '%s' "${DEPLOY_TRAINING_DERCETECH_COM_REMOTE_HOST:-${API_SYNC_REMOTE_HOST:-}}"
      ;;
    training2.dercetech.com) printf '%s' "${DEPLOY_TRAINING2_DERCETECH_COM_REMOTE_HOST:-}" ;;
    second-domain) printf '%s' "${DEPLOY_SECOND_DOMAIN_REMOTE_HOST:-}" ;;
    second-domain-root) printf '%s' "${DEPLOY_SECOND_DOMAIN_ROOT_REMOTE_HOST:-}" ;;
    *) fail "Unknown deployment target: $1" ;;
  esac
}

target_remote_dir() {
  case "$1" in
    training.dercetech.com)
      printf '%s' "${DEPLOY_TRAINING_DERCETECH_COM_REMOTE_DIR:-${API_SYNC_REMOTE_DIR:-}}"
      ;;
    training2.dercetech.com) printf '%s' "${DEPLOY_TRAINING2_DERCETECH_COM_REMOTE_DIR:-}" ;;
    second-domain) printf '%s' "${DEPLOY_SECOND_DOMAIN_REMOTE_DIR:-}" ;;
    second-domain-root) printf '%s' "${DEPLOY_SECOND_DOMAIN_ROOT_REMOTE_DIR:-}" ;;
    *) fail "Unknown deployment target: $1" ;;
  esac
}

load_configured_targets() {
  local target host remote_dir
  CONFIGURED_TARGETS=()

  for target in "${TARGETS[@]}"; do
    host="$(target_host "$target")"
    remote_dir="$(target_remote_dir "$target")"

    if [[ -z "$host" && -z "$remote_dir" ]]; then
      continue
    fi
    [[ -n "$host" && -n "$remote_dir" ]] ||
      fail "Target $target has incomplete local configuration. Set both its host and remote directory, or neither."
    CONFIGURED_TARGETS+=("$target")
  done

  ((${#CONFIGURED_TARGETS[@]} > 0)) ||
    fail "No deployment target is configured. Copy .env.local.tpl to .env.local and configure a target."
}

require_source() {
  local target="$1"
  local source
  source="$(target_source "$target")"
  [[ -d "$source" ]] || fail "Local deployment source does not exist for $target: $source"
}

is_configured_target() {
  local target="$1"
  local configured
  for configured in "${CONFIGURED_TARGETS[@]}"; do
    [[ "$configured" == "$target" ]] && return 0
  done
  return 1
}

push_target() {
  local target="$1"
  local source host remote_dir
  source="$(target_source "$target")"
  host="$(target_host "$target")"
  remote_dir="$(target_remote_dir "$target")"

  require_source "$target"
  echo "Mirroring configured target: $target"
  if [[ "$target" == "second-domain-root" ]]; then
    # The scoped lab is owned by the separate second-domain target.
    rsync "${RSYNC_PUSH[@]}" \
      --exclude=secu-5d/ \
      --filter='P secu-5d/' \
      --verbose "$source" "${host}:${remote_dir}"
  else
    rsync "${RSYNC_PUSH[@]}" --verbose "$source" "${host}:${remote_dir}"
  fi
}

sync_targets() {
  local target
  require_command rsync
  require_command ssh
  load_configured_targets

  if [[ -n "$REQUESTED_TARGET" ]]; then
    is_configured_target "$REQUESTED_TARGET" ||
      fail "Target $REQUESTED_TARGET is not configured locally."
    push_target "$REQUESTED_TARGET"
    return
  fi

  for target in "${CONFIGURED_TARGETS[@]}"; do
    push_target "$target"
  done
}

changed_target() {
  local changed_path="$1"
  local target source
  for target in "${CONFIGURED_TARGETS[@]}"; do
    source="$(target_source "$target")"
    if [[ "$changed_path" == "$source"* ]]; then
      printf '%s' "$target"
      return 0
    fi
  done
  return 1
}

watch() {
  local changed_path target
  [[ -z "$REQUESTED_TARGET" ]] || fail "watch monitors all configured targets; do not provide a target."
  require_command fswatch
  [[ -d "$SERVERS_ROOT" ]] || fail "Server staging root does not exist: $SERVERS_ROOT"

  sync_targets
  echo "Watching $SERVERS_ROOT. Configured targets sync automatically, including deletions."
  echo "Press Ctrl-C to stop."
  while IFS= read -r -d '' changed_path; do
    echo
    echo "Change detected at $(date '+%H:%M:%S')."
    if target="$(changed_target "$changed_path")"; then
      push_target "$target" </dev/tty
    else
      echo "Ignored: no configured target owns this path."
    fi
  done < <(fswatch -0 "$SERVERS_ROOT")
}

cd "$PROJECT_ROOT"

case "$MODE" in
  sync) sync_targets ;;
  watch) watch ;;
  *) usage; exit 1 ;;
esac
