'use strict';
// Builds the story site into dist/: reads the chart and report that /statechart wrote, draws each scene at its true
// 240 x 160 pixels, and writes story.json for the page.
const fs = require('fs');
const path = require('path');
const { render } = require('../pixel/lib/pixel');

const DIST = path.join(__dirname, 'dist');
const SRC = path.join(__dirname, 'src');

// The chart is Mermaid: `sN: Label` names a state, `a --> b: label` is a step, `[*] --> sN` is the start.
function parseChart(text) {
  const states = {}, steps = [], groups = {};
  let initial = null, inLegend = false;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('state "Legend"')) { inLegend = true; continue; }
    if (inLegend) { if (line === '}') inLegend = false; continue; }
    let m;
    if ((m = line.match(/^\[\*\] --> (\w+)$/))) initial = m[1];
    else if ((m = line.match(/^(\w+) --> (\w+): (.+)$/))) steps.push({ from: m[1], to: m[2], label: m[3] });
    else if ((m = line.match(/^(s\d+): (.+)$/))) states[m[1]] = m[2];
    else if ((m = line.match(/^class (s\d+) (\w+)$/))) (groups[m[1]] ||= []).push(m[2]);
  }
  if (!initial) throw new Error('chart has no start state');
  return { states, steps, groups, initial };
}

function parseReport(text) {
  const held = text.match(/## Rules that hold\n([^\n]+)/);
  const broke = /## Rules that break/.test(text);
  const reached = text.match(/TLC reached (\d+) states and (\d+) steps/);
  return { holds: held ? held[1].split(',').map((s) => s.trim()) : [], broke, states: +reached?.[1], steps: +reached?.[2] };
}

async function buildStory(story) {
  const chart = parseChart(fs.readFileSync(path.join(story.chart, 'chart.mmd'), 'utf8'));
  const report = parseReport(fs.readFileSync(path.join(story.chart, 'report.md'), 'utf8'));
  if (report.broke) throw new Error(`${story.id}: a rule breaks; fix the model before shipping the story`);

  const outDir = path.join(DIST, story.id);
  const states = await Promise.all(Object.entries(chart.states).map(async ([id, label]) => {
    const words = story.states[label];
    if (!words) throw new Error(`${story.id}: no scene or words for the state "${label}"`);
    const scene = story.scenes[words.scene];
    let faces;
    await render({
      id: words.scene, outDir, upscale: 1, seed: `${story.id}:${words.scene}`,
      paint: (P) => { faces = scene.paint(P); }, details: (G, R) => scene.details(G, faces, R),
    });
    const group = (chart.groups[id] || []).find((c) => !['breaks', 'mayBreak', 'bugPath', 'repeats'].includes(c));
    return { id, label, group, image: `${story.id}/${words.scene}.png`, text: words.text, alt: words.alt };
  }));

  const rules = report.holds.map((name) => {
    if (name === 'TypeOK') return null;
    if (!story.rules[name]) throw new Error(`${story.id}: no words for the rule ${name}`);
    return { name, text: story.rules[name] };
  }).filter(Boolean);

  return { id: story.id, title: story.title, tagline: story.tagline, initial: chart.initial, states, steps: chart.steps, rules, checked: { states: report.states, steps: report.steps } };
}

(async () => {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  const stories = [require('./stories/fallen-star')];
  const built = [];
  for (const s of stories) built.push(await buildStory(s));
  fs.writeFileSync(path.join(DIST, 'story.json'), JSON.stringify(built[0], null, 2));
  for (const f of fs.readdirSync(SRC)) fs.copyFileSync(path.join(SRC, f), path.join(DIST, f));
  fs.copyFileSync(path.join(__dirname, '../rendering/browser/loop.mjs'), path.join(DIST, 'render-loop.mjs'));
  fs.copyFileSync(path.join(__dirname, '../rendering/browser/bloom.mjs'), path.join(DIST, 'bloom.mjs'));
  for (const b of built) console.log(`${b.title}: ${b.states.length} scenes, ${b.steps.length} steps, ${b.rules.length} rules`);
  console.log(`Wrote ${DIST}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
