const fs = require('node:fs');
const path = require('node:path');
const { buildQuestions } = require('./word_question_options');
const externalExamples = require('./yuwen_word_external_examples');

const ROOT = path.resolve(__dirname, '..');
const SQL_DIR = path.join(ROOT, 'sql');
const SENSE_SQL = path.join(SQL_DIR, 'edu_chn_word_sense.sql');
const QUESTION_SQL = path.join(SQL_DIR, 'edu_chn_word_question.sql');
const TARGET_WORDS = new Set('方 冠 让 得 安 保 辟 举 度 治 爱 诚 故 解 中 族 发 养 技 经'.split(' '));

function tuples(text) {
  const out = [];
  let i = 0;
  while ((i = text.indexOf('\n(', i)) >= 0) {
    const start = i + 1;
    let end = start;
    let quoted = false;
    for (; end < text.length; end += 1) {
      const c = text[end];
      if (c === "'") {
        if (quoted && text[end + 1] === "'") { end += 1; continue; }
        quoted = !quoted;
      } else if (!quoted && c === ')') {
        out.push(text.slice(start, end + 1));
        i = end + 1;
        break;
      }
    }
    if (end >= text.length) break;
  }
  return out;
}

function splitTuple(tuple) {
  const body = tuple.slice(1, -1);
  const fields = [];
  let start = 0;
  let quoted = false;
  for (let i = 0; i < body.length; i += 1) {
    const c = body[i];
    if (c === "'") {
      if (quoted && body[i + 1] === "'") { i += 1; continue; }
      quoted = !quoted;
    } else if (!quoted && c === ',') {
      fields.push(body.slice(start, i).trim());
      start = i + 1;
    }
  }
  fields.push(body.slice(start).trim());
  return fields;
}

function sqlValue(token) {
  if (token === 'NULL') return null;
  if (token.startsWith("'")) return token.slice(1, -1).replace(/''/g, "'").replace(/\\\\/g, '\\');
  return token;
}

function sqlString(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function readRows(file, count) {
  return tuples(fs.readFileSync(file, 'utf8'))
    .map(tuple => splitTuple(tuple).map(sqlValue))
    .filter(row => row.length === count && /^\d+$/.test(String(row[0])));
}

function applySenseCaseUpdates(rows) {
  const text = fs.readFileSync(SENSE_SQL, 'utf8');
  const indexes = { meaning: 4, example: 5, source: 6, example_trans: 7, status: 8, is_del: 9 };
  const updates = new Map();
  for (const statement of text.matchAll(/UPDATE\s+`edu_chn_word_sense`\s+SET\s+([\s\S]*?)\nWHERE[\s\S]*?;/g)) {
    for (const [field, index] of Object.entries(indexes)) {
      const fieldCase = statement[1].match(new RegExp('`' + field + '`\\s*=\\s*CASE\\s+`id`([\\s\\S]*?)END'));
      if (!fieldCase) continue;
      for (const match of fieldCase[1].matchAll(/WHEN\s+(\d+)\s+THEN\s+(NULL|'(?:''|[^'])*'|-?\d+)/g)) {
        if (!updates.has(match[1])) updates.set(match[1], {});
        updates.get(match[1])[index] = sqlValue(match[2]);
      }
    }
  }
  return rows.map(row => {
    const changed = updates.get(String(row[0]));
    if (!changed) return row;
    const next = row.slice();
    for (const [index, value] of Object.entries(changed)) next[Number(index)] = value;
    return next;
  });
}

const senseRows = applySenseCaseUpdates(readRows(SENSE_SQL, 10)).map(row => ({
  id: Number(row[0]),
  wordClass: Number(row[1]),
  word: row[2],
  pinyin: row[3],
  meaning: row[4],
  example: row[5],
}));
const questionRows = readRows(QUESTION_SQL, 7);
const existingKeys = new Set(questionRows.map(row => `${row[1]}|${row[2]}`));
let nextQuestionId = Math.max(0, ...questionRows.map(row => Number(row[0]))) + 1;

const generated = buildQuestions(senseRows, externalExamples)
  .filter(row => TARGET_WORDS.has(senseRows.find(sense => sense.id === row.senseId)?.word))
  .filter(row => !existingKeys.has(`${row.senseId}|${row.type}`));

const newRows = generated.map(question => [
  nextQuestionId++,
  question.senseId,
  question.type,
  sqlString(question.stem),
  sqlString(JSON.stringify(question.options)),
  1,
  0,
]);

if (newRows.length) {
  const values = newRows.map(row => `(${row.join(', ')})`).join(',\n');
  const block = [
    '',
    '-- 2026-10-22：20个目标实词新增例句补充题目（仅补缺失题目，不覆盖已有题目）',
    'START TRANSACTION;',
    '',
    'INSERT INTO `edu_chn_word_question`',
    '(`id`, `sense_id`, `question_type`, `stem`, `options_json`, `status`, `is_del`)',
    'VALUES',
    values + ';',
    '',
    'COMMIT;',
    '',
  ].join('\n');
  fs.appendFileSync(QUESTION_SQL, block);
}

console.log(JSON.stringify({
  addedQuestionCount: newRows.length,
  addedSenseIds: [...new Set(newRows.map(row => row[1]))],
  firstQuestionId: newRows[0]?.[0] || null,
  lastQuestionId: newRows.at(-1)?.[0] || null,
}, null, 2));
