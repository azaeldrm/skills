#!/usr/bin/env bash
# Expo cloud devices (Expo Simulators) with local egress: start, run commands against, check, and stop one.
#
#   cloud-device.sh start --platform android|ios --allow HOST:PORT [--allow ...] [--minutes N] [--name NAME]
#                         [--device NAME] [--build-id ID | --expo-go] [--open-url URL]
#   cloud-device.sh exec ID -- COMMAND...     e.g. exec ID -- npx --yes agent-device@latest snapshot -i
#   cloud-device.sh status ID
#   cloud-device.sh stop ID
#   cloud-device.sh list
#
# Run `start` from inside the Expo app's folder (the one with app.json or app.config.*). Secrets stay in
# ${XDG_STATE_HOME:-~/.local/state}/expo-cloud-device/<session id>/ (owner-only) and are never printed.
set -u

EAS=(npx --yes eas-cli@latest)
STATE_ROOT="${XDG_STATE_HOME:-$HOME/.local/state}/expo-cloud-device"
UUID='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

die() { echo "cloud-device: $*" >&2; exit 1; }

session_dir() {
  # The private folder kept for a session started here.
  local id="$1"
  [[ "$id" =~ ^$UUID$ ]] || die "not a session id: $id"
  [ -d "$STATE_ROOT/$id" ] || die "no session $id was started with this script (see: cloud-device.sh list)"
  echo "$STATE_ROOT/$id"
}

egress_alive() {
  # Whether the session's egress client is still running.
  local dir="$1" pid
  pid=$(cat "$dir/egress.pid" 2>/dev/null) || return 1
  kill -0 "$pid" 2>/dev/null
}

start_egress() {
  # The egress client for a session, detached so it outlives this shell; it must run for the session's life.
  local dir="$1"
  ( cd "$(cat "$dir/project")" && set -a && . "$dir/env.sh" && set +a && exec setsid "${EAS[@]}" simulator:egress --config-type env ) \
    > "$dir/egress.log" 2>&1 < /dev/null &
  echo $! > "$dir/egress.pid"
  for _ in $(seq 1 30); do
    grep -q "tunnel connected" "$dir/egress.log" 2>/dev/null && return 0
    egress_alive "$dir" || break
    sleep 1
  done
  return 1
}

stop_session() {
  # The session stopped on Expo, its egress client ended, and its private folder removed.
  local id="$1" dir="$STATE_ROOT/$1" project
  project=$(cat "$dir/project" 2>/dev/null || pwd)
  if [ -f "$dir/egress.pid" ]; then kill -- "-$(cat "$dir/egress.pid")" 2>/dev/null || kill "$(cat "$dir/egress.pid")" 2>/dev/null; fi
  (cd "$project" && "${EAS[@]}" simulator:stop --id "$id" --json --non-interactive 2>/dev/null) | grep -E '"status"' || echo "  (stop request sent)"
  rm -rf "$dir"
}

cmd_start() {
  local platform="" minutes=10 name="Cloud device check" device="" source=() open_url="" allow=()
  while [ $# -gt 0 ]; do
    case "$1" in
      --platform) platform="$2"; shift 2 ;;
      --allow) allow+=(--egress-allow "$2"); shift 2 ;;
      --minutes) minutes="$2"; shift 2 ;;
      --name) name="$2"; shift 2 ;;
      --device) device="$2"; shift 2 ;;
      --build-id) source=(--build-id "$2"); shift 2 ;;
      --expo-go) source=(--expo-go); shift ;;
      --open-url) open_url="$2"; shift 2 ;;
      *) die "unknown option: $1" ;;
    esac
  done
  [[ "$platform" =~ ^(android|ios)$ ]] || die "--platform android or ios is required"
  [ ${#allow[@]} -gt 0 ] || die "give at least one --allow HOST:PORT (what the device may reach on this machine)"
  [[ "$minutes" =~ ^[0-9]+$ ]] && [ "$minutes" -ge 1 ] && [ "$minutes" -le 115 ] || die "--minutes must be 1 to 115"
  { [ -e app.json ] || compgen -G "app.config.*" >/dev/null; } || die "run start from the Expo app's folder (no app.json or app.config.* here)"
  "${EAS[@]}" simulator:availability --json 2>/dev/null | grep -q '"available": true' || die "Expo Simulators isn't available for this account"

  umask 077; mkdir -p "$STATE_ROOT"
  local tmp; tmp=$(mktemp -d "$STATE_ROOT/starting.XXXXXX")
  local args=(simulator:start --platform "$platform" --type agent-device --name "$name" --tag agent
    --max-duration-minutes "$minutes" --egress local "${allow[@]}" --out-config-type env --non-interactive)
  [ -n "$device" ] && args+=(--device "$device")
  [ ${#source[@]} -gt 0 ] && args+=("${source[@]}")
  [ -n "$open_url" ] && args+=(--open-url "$open_url")

  echo "Starting a cloud $platform device (up to $minutes min; startup usually takes about 2 minutes)..."
  "${EAS[@]}" "${args[@]}" > "$tmp/start.out" 2> "$tmp/start.err"
  local rc=$? id
  id=$(grep -h -o -E "$UUID" "$tmp/start.out" "$tmp/start.err" | head -1)
  grep -E '^export ' "$tmp/start.out" > "$tmp/env.sh"
  if [ $rc -ne 0 ] || [ -z "$id" ] || ! grep -q AGENT_DEVICE_DAEMON_BASE_URL "$tmp/env.sh"; then
    echo "Start failed:" >&2
    grep -v -E '^export |^npm notice' "$tmp/start.out" "$tmp/start.err" | sed -E 's#(https?://)[^ ]+#\1<redacted>#g' | tail -8 >&2
    if [ -n "$id" ]; then mv "$tmp" "$STATE_ROOT/$id"; pwd > "$STATE_ROOT/$id/project"; stop_session "$id"; else rm -rf "$tmp"; fi
    exit 1
  fi
  mv "$tmp" "$STATE_ROOT/$id"
  local dir="$STATE_ROOT/$id"
  pwd > "$dir/project"
  if ! start_egress "$dir"; then
    echo "The egress client didn't connect; stopping the session." >&2
    sed -E 's#(https?://)[^ ]+#\1<redacted>#g' "$dir/egress.log" | grep -v '^npm notice' | tail -5 >&2
    stop_session "$id"; exit 1
  fi
  local page
  page=$("${EAS[@]}" simulator:list --name "$name" --status in-progress --json --non-interactive 2>/dev/null \
    | python3 -c 'import json,sys; s=sys.stdin.read(); d=json.loads(s[s.find("{"):]); print(next((x.get("deviceRunSessionUrl","") for x in d.get("sessions",[]) if x.get("id")==sys.argv[1]), ""))' "$id" 2>/dev/null)
  echo "Ready: session $id ($platform), egress connected."
  [ -n "$page" ] && echo "Watch it (Expo login required): $page"
  echo "Drive it:  $0 exec $id -- npx --yes agent-device@latest snapshot -i"
  echo "Stop it:   $0 stop $id"
}

cmd_exec() {
  local id="$1"; shift
  [ "${1:-}" = "--" ] && shift
  [ $# -gt 0 ] || die "give a command after --"
  local dir; dir=$(session_dir "$id")
  if ! egress_alive "$dir"; then echo "Egress client had stopped; starting it again." >&2; start_egress "$dir" || die "egress client won't connect"; fi
  ( set -a && . "$dir/env.sh" && set +a && unset EAS_SIMULATOR_EGRESS_TOKEN EAS_SIMULATOR_EGRESS_URL && exec "$@" )
}

cmd_status() {
  local id="$1" dir; dir=$(session_dir "$id")
  (cd "$(cat "$dir/project")" && "${EAS[@]}" simulator:get --id "$id" --json --non-interactive 2>/dev/null) \
    | python3 -c 'import json,sys; s=sys.stdin.read(); d=json.loads(s[s.find("{"):]); print("status:", d.get("status"), " platform:", d.get("platform"), " name:", d.get("name"))' 2>/dev/null || echo "status: unknown"
  egress_alive "$dir" && echo "egress client: running" || echo "egress client: stopped"
}

cmd_list() {
  [ -d "$STATE_ROOT" ] || { echo "No sessions started here."; return; }
  local found=
  for d in "$STATE_ROOT"/*/; do
    local id; id=$(basename "$d"); [[ "$id" =~ ^$UUID$ ]] || continue
    found=1; echo "$id  project: $(cat "$d/project" 2>/dev/null)  egress: $(egress_alive "$d" && echo running || echo stopped)"
  done
  [ -n "$found" ] || echo "No sessions started here."
}

case "${1:-}" in
  start) shift; cmd_start "$@" ;;
  exec) shift; [ $# -ge 1 ] || die "usage: exec ID -- COMMAND..."; cmd_exec "$@" ;;
  status) shift; [ $# -eq 1 ] || die "usage: status ID"; cmd_status "$1" ;;
  stop) shift; [ $# -eq 1 ] || die "usage: stop ID"; session_dir "$1" >/dev/null; stop_session "$1" ;;
  list) cmd_list ;;
  *) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
