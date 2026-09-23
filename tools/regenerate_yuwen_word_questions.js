const fs = require('node:fs');
const path = require('node:path');
const { buildQuestions } = require('./word_question_options');
const externalExamples = require('./yuwen_word_external_examples');

const ROOT = path.resolve(__dirname, '..');
const SQL_DIR = path.join(ROOT, 'sql');
const SENSE_SQL = path.join(SQL_DIR, 'edu_chn_word_sense.sql');
const QUESTION_SQL = path.join(SQL_DIR, 'edu_chn_word_question.sql');

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
  if (!token.startsWith("'")) return token;
  return token.slice(1, -1).replace(/''/g, "'").replace(/\\\\/g, '\\');
}

function readSenseRows() {
  const text = fs.readFileSync(SENSE_SQL, 'utf8');
  return tuples(text)
    .map(splitTuple)
    .filter(row => row.length === 10 && /^\d+$/.test(row[0]))
    .map(row => row.map(sqlValue))
    .map(row => ({
      id: Number(row[0]),
      wordClass: Number(row[1]),
      word: row[2],
      pinyin: row[3],
      meaning: row[4],
      example: row[5],
      source: row[6],
      exampleTrans: row[7],
    }));
}

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\u0000/g, '')}'`;
}

function questionSql(rows) {
  const values = rows.map((row, index) => {
    const id = index + 1;
    return `(${id}, ${row.senseId}, ${row.type}, ${sqlString(row.stem)}, ${sqlString(JSON.stringify(row.options))}, 1, 0)`;
  }).join(',\n');
  return [
    '-- 语文积累本-高中与初中实虚词题目（统一生成）',
    '-- 题型一：首项为正确释义；题型二：首项为同义例句。缺失例句统一写入“暂无例句”。',
    'START TRANSACTION;',
    '',
    'INSERT INTO `edu_chn_word_question`',
    '(`id`, `sense_id`, `question_type`, `stem`, `options_json`, `status`, `is_del`)',
    'VALUES',
    values,
    'ON DUPLICATE KEY UPDATE',
    '`sense_id` = VALUES(`sense_id`),',
    '`question_type` = VALUES(`question_type`),',
    '`stem` = VALUES(`stem`),',
    '`options_json` = VALUES(`options_json`),',
    '`status` = VALUES(`status`),',
    '`is_del` = VALUES(`is_del`);',
    '',
    'COMMIT;',
    '',
  ].join('\n');
}

function regenerateQuestions() {
  const records = readSenseRows();
  const questions = buildQuestions(records, externalExamples);
  fs.writeFileSync(QUESTION_SQL, questionSql(questions));
  const unavailable = questions.reduce((count, question) => count + question.options.filter(item => item.content === '暂无例句').length, 0);
  const result = { senses: records.length, examples: records.filter(row => row.example).length, questions: questions.length, unavailable };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

if (require.main === module) regenerateQuestions();

module.exports = { regenerateQuestions, readSenseRows, questionSql };
