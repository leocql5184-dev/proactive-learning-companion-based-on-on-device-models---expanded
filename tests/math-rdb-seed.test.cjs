const assert = require('assert');
const fs = require('fs');
const seed = JSON.parse(fs.readFileSync('entry/src/main/resources/rawfile/graph_seed_v1.json', 'utf8'));

const mathInserts = seed.operations.filter((operation) => operation.sql.startsWith('INSERT INTO math_'));
const questions = mathInserts.filter((operation) => operation.sql.startsWith('INSERT INTO math_question '));
const knowledge = mathInserts.filter((operation) => operation.sql.startsWith('INSERT INTO math_knowledge '));
const hints = mathInserts.filter((operation) => operation.sql.startsWith('INSERT INTO math_hint '));

assert.strictEqual(seed.seedId, 'dual-graph-v1');
assert.strictEqual(questions.length, 48, 'only the 48 adjudicated kept questions enter the math RDB');
assert.strictEqual(knowledge.length, 23);
assert.strictEqual(hints.length, 96);
assert.ok(mathInserts.every((operation) => operation.args.length > 0));
assert.ok(mathInserts.every((operation) => !operation.sql.includes('behavior_')));
console.log(`math RDB seed valid: ${questions.length} questions, ${knowledge.length} knowledge nodes, ${hints.length} hints`);
