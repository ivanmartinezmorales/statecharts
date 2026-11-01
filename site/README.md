# Story site

A pixel-art bedtime story you can step through. The story is a statechart: a TLA+ model that the `/statechart` skill
checks with TLC, worded by a `view.mjs`. This site is built from the chart the skill wrote, so the pictures, the choices
and the map all follow the checked model.

## Build and look

```bash
cd ../pixel && npm install
cd ../site && npm run build && npm run serve
```

Then open http://localhost:5310. `dist/` is a static site: deploy it anywhere that serves files.

## How it fits together

| path | what it is |
|---|---|
| `../pixel/stories/fallen-star/model/` | the TLA+ model, its config, `view.mjs`, and `chart/`, which `/statechart` wrote |
| `../pixel/stories/fallen-star/scenes.js` | one painted scene per state of the chart |
| `stories/fallen-star.js` | the words for each state, its picture, and the rules in plain words |
| `build.js` | reads `chart/chart.mmd` and `chart/report.md`, draws each scene at 240 x 160, writes `dist/` |
| `src/` | the page: the picture with its reveal, the choices, the map and the checked rules |

The build stops if a rule in the report breaks, or if a state in the chart has no picture or words.

## Check the model again

```bash
cd ../pixel/stories/fallen-star/model
<statechart skill>/scripts/statechart FallenStar.tla --config FallenStar.cfg --view view.mjs --out chart-new
```

Without `mise`, set `TLA2TOOLS` to a `tla2tools.jar` and `JAVA` to a Java binary. Compare `chart-new/` with `chart/`.
