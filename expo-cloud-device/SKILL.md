---
name: expo-cloud-device
description: Start, drive, and stop an Expo cloud device (Expo Simulators, an Android emulator or iOS Simulator on Expo's servers) that reaches this machine's dev servers through local egress. Use when asked to test or verify an app on a cloud device, an iPhone or iPad without a Mac, or Expo Simulators. Not for local emulators or physical devices over adb, and not for starting Metro (use expo-session for that).
---

# Expo cloud device

A cloud device is a remote Android emulator or iOS Simulator. With local egress its network
traffic leaves from this machine, so it can reach dev servers here (Metro, the dev API) without
a public tunnel. Every minute is billed to the owner's Expo account.

## Before you start

- **Ask the owner first.** Sessions cost money ($0.10/min past the plan's included minutes).
  Say what you'll check, the platform, and the time limit.
- Know what the device must reach on this machine: each dev server as an exact `host:port`.
  Prefer `localhost:PORT` entries: they're forwarded like `adb reverse` (Android also gets
  `10.0.2.2:PORT`). If Metro or the app uses this machine's Tailscale IP, allow that
  `100.x.y.z:PORT` too; private addresses are refused unless listed. Ports below 1024 can't be
  forwarded.
- Metro must already be running (expo-session) for a development build to load JavaScript.
- Have the app ready: an EAS build ID (Android APK, or an iOS simulator build), `--expo-go` for
  projects without custom native code, or nothing for a blank device.

## Run it

Use the helper, from the Expo app's folder (the one with `app.json` or `app.config.*`):

```bash
~/skills/expo-cloud-device/scripts/cloud-device.sh start --platform android \
  --allow localhost:9020 --allow localhost:8082 --minutes 10 --name "Login screen check"
~/skills/expo-cloud-device/scripts/cloud-device.sh exec <id> -- npx --yes agent-device@latest snapshot -i
~/skills/expo-cloud-device/scripts/cloud-device.sh stop <id>
```

`start` checks access, starts the device (about 2 minutes), starts the egress client, and prints
the session id, the expo.dev page to watch it (login required), and the next commands. Give the
command at least 5 minutes before any timeout. `status <id>` and `list` show what's running.

The helper keeps the session's credentials in `~/.local/state/expo-cloud-device/<id>/`
(owner-only), writes nothing into the repository, restarts the egress client if it stopped, and
stops the session if anything in `start` fails.

## Drive it

- Run every agent-device command through `exec`: `open <app or URL> --platform <p>`,
  `snapshot -i` (refs like `@e3`), `press @e3`, `fill @e4 "text"`, `scroll down`,
  `screenshot ./.local/shot.png`, `record start ./.local/flow.mp4` / `record stop`.
  Refs only hold for the latest snapshot.
- Check the first command's output: `Session state:` must start with `/home/expo/` (Android) or
  `/Users/expo/` (iOS). Anything else means agent-device fell back to a local device: stop.
- A fresh Android device's Chrome opens on its welcome screen: press
  `'label="Use without an account"'`, then `'label="No thanks"'`, then open the URL again.
- To check a dev server is reachable, open `http://localhost:PORT/...` on the device and read it
  with `snapshot`.
- iOS-only extras: `eas simulator:control` (rotate, location, screenshots) and
  `eas simulator:logs`. Android has no app logs through EAS.

## When things go wrong

- `ERR_NGROK_3200` or "Remote daemon is unavailable": the device connection is gone and the app's
  state with it. Don't retry: `stop`, `start` a new one, reinstall, continue.
- A slow start is normal (queueing, boot). Never start a second session to retry; wait for the
  first or stop it.
- Requests to this machine failing while the device works: the egress client dropped. `exec`
  restarts it; `status` shows it.
- A session ends at its time limit (at most 115 minutes) and can't be extended.

## Always

- **Stop the session when done**, even after a failure. Closing the terminal does not stop it.
- Never print, log, or commit tokens, connection URLs, or the files in the state folder.
- Keep captures in the project's gitignored `.local/` and delete ones that show anything private.
- Report the session id, what you checked, the result, and that the session is stopped.
