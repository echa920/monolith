# MONOLITH

A training app that runs entirely in your browser. No account, no server, no
tracking. Your log, your photos and your measurements never leave the device
you are using.

**Open it:** https://echa920.github.io/monolith/

On a phone, use your browser's **Add to Home Screen** and it installs like a
normal app — full screen, its own icon, and it works with no signal.

## What it does

- **Push / Pull / Legs**, three days a week, on whatever days suit you
- **Double progression** — it tells you when you have earned more weight, and how much
- **Technique diagrams** for every exercise: start position, end position, and the muscles worked
- **Your own photos** pinned to any exercise, if a drawing is not enough
- **Progress photos** with a shoulder-to-waist ratio measured off the image
- **Strength ranks** — Bronze to Olympic God, worked out from your logged weight and reps relative to your bodyweight
- **An adventure layer** — energy earned only by training, a map, turn-based fights, gear
- **Monolith AI** — a coach that reads your real log. Free offline planner by default; optional Claude API or a local Ollama model
- **English and Spanish**, switchable at any time

## Your data

Everything lives in the browser's `localStorage` and `IndexedDB` on the device
you are using. That means:

- Nothing is uploaded anywhere. There is no backend to upload to.
- **Devices do not sync.** Your phone and your laptop keep separate logs.
  Settings → Export moves a backup between them.
- Clearing site data erases everything. Export now and then.

The one exception is Monolith AI's optional Claude engine: if you paste an API
key, your questions and a summary of your training are sent to Anthropic to
answer them. The free engine sends nothing anywhere.

## Running it locally

```
node server.js
```

Serves on `http://localhost:5173` and prints a LAN address so a phone on the
same Wi-Fi can reach it. `localhost` is a secure context, so the offline
service worker registers there too.

## Tests

```
node test/suite.js
```

Loads the real app into a `vm` with a DOM stub and checks the things that break
silently: the split, the schedule, progression, the energy economy, the rank
maths, the diagrams, the photo store, and the language switch.

## Licence

MIT. Take it and change it.
