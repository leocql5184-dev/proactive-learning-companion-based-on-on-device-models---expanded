const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../tools/local-llm/desktop/web/index.html'), 'utf8');
const source = html.match(/<script>\s*\/\/ The opening[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g, '');

function setup(reduced = false) {
  let now = 0, next = 1;
  const frames = new Map(), timers = new Map(), events = new Map();
  const elements = {};
  function element() {
    const classes = new Set();
    return { hidden: true, inert: false, textContent: '', events: {},
      classList: { add: s => classes.add(s), remove: s => classes.delete(s), contains: s => classes.has(s) },
      addEventListener(type, fn) { this.events[type] = fn; },
      focus() { document.activeElement = this; },
      querySelectorAll() { return []; } };
  }
  ['opening', 'opening-skip', 'opening-count', 'opening-dust', 'resume-button', '.phone', '.note'].forEach(id => elements[id] = element());
  const document = { body: element(), hidden: false, activeElement: null,
    getElementById: id => elements[id], querySelector: id => elements[id],
    addEventListener: (name, fn) => events.set(name, fn), removeEventListener: name => events.delete(name) };
  const window = { matchMedia: () => ({ matches: reduced }),
    addEventListener: (name, fn) => events.set(name, fn), removeEventListener: name => events.delete(name) };
  vm.runInNewContext(source, { document, window, performance: { now: () => now },
    requestAnimationFrame: fn => { const id = next++; frames.set(id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: (fn, delay) => { const id = next++; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout: id => timers.delete(id) });
  return { elements, events, document, frames, timers,
    advance(to, runFrame = true, runTimer = true) {
      now = to;
      if (runTimer) for (const [id, task] of [...timers]) if (task.at <= now) { timers.delete(id); task.fn(); }
      if (runFrame) for (const [id, fn] of [...frames]) { frames.delete(id); fn(); }
    } };
}
test('countdown and dissolve fit within four seconds; home unlocks and resources clear', () => {
  const s = setup(), e = s.elements;
  assert.equal(e['.phone'].inert, true);
  assert.equal(e.opening.hidden, false);
  s.advance(999); assert.equal(e['opening-count'].textContent, '4');
  s.advance(1000); assert.equal(e['opening-count'].textContent, '3');
  s.advance(2000); assert.equal(e['opening-count'].textContent, '2');
  s.advance(2799); assert.equal(e.opening.classList.contains('is-dissolving'), false);
  s.advance(2800); assert.equal(e.opening.classList.contains('is-dissolving'), true);
  s.advance(3000); assert.equal(e['opening-count'].textContent, '1');
  s.advance(3999); assert.equal(e.opening.hidden, false);
  s.advance(4000); assert.equal(e.opening.hidden, true);
  assert.equal(e['.phone'].inert, false);
  assert.equal(s.document.activeElement, e['resume-button']);
  assert.equal(s.frames.size + s.timers.size + s.events.size, 0);
});
test('skip is immediate and idempotent, including during dissolution', () => {
  for (const time of [100, 2950]) {
    const s = setup(); s.advance(time);
    s.elements['opening-skip'].events.click();
    s.elements['opening-skip'].events.click();
    assert.equal(s.elements.opening.hidden, true);
    assert.equal(s.elements['.phone'].inert, false);
    assert.equal(s.frames.size + s.timers.size, 0);
  }
});
test('background return after deadline finishes even if timers and frames were throttled', () => {
  const s = setup(); s.advance(9000, false, false);
  s.events.get('visibilitychange')();
  assert.equal(s.elements.opening.hidden, true);
  assert.equal(s.frames.size + s.timers.size, 0);
});
test('reduced motion retains countdown and deadline without dissolve; pagehide cleans up', () => {
  const s = setup(true); s.advance(3200);
  assert.equal(s.elements.opening.classList.contains('is-dissolving'), false);
  s.advance(4000); assert.equal(s.elements.opening.hidden, true);
  const leaving = setup(); leaving.events.get('pagehide')();
  assert.equal(leaving.elements['.phone'].inert, false);
  assert.equal(leaving.frames.size + leaving.timers.size + leaving.events.size, 0);
});
