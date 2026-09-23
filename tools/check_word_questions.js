const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { UNAVAILABLE_EXAMPLE, buildQuestions } = require('./word_question_options');
const externalExamples = require('./yuwen_word_external_examples');

const ROOT = path.resolve(__dirname, '..');
const SQL_DIR = path.join(ROOT, 'sql');

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

function readRows(file, fieldCount) {
  return tuples(fs.readFileSync(path.join(SQL_DIR, file), 'utf8'))
    .map(splitTuple)
    .filter(row => row.length === fieldCount && /^\d+$/.test(row[0]))
    .map(row => row.map(sqlValue));
}

function stripTags(value) {
  return String(value || '').replace(/<[^>]+>/g, '');
}

function checkGeneratedSql() {
  const senseRows = readRows('edu_chn_word_sense.sql', 10);
  const questionRows = readRows('edu_chn_word_question.sql', 7);
  const bySense = new Map(senseRows.map(row => [String(row[0]), row]));
  const groups = new Map();
  const availableExamples = new Set(senseRows.filter(row => row[5]).map(row => stripTags(row[5])));
  for (const item of externalExamples) availableExamples.add(stripTags(item.example));

  assert.equal(senseRows.length, 500, '统一词义数量应为 500');
  assert.equal(questionRows.length, senseRows.filter(row => row[5]).length * 2, '每条有例句词义应有两道题');
  for (const row of questionRows) {
    const sense = bySense.get(String(row[1]));
    assert.ok(sense, `题目 ${row[0]} 的 sense_id 不存在`);
    const options = JSON.parse(row[4]);
    const expectedLength = row[2] === '1' ? 4 : 2;
    assert.equal(options.length, expectedLength, `题目 ${row[0]} 选项数量错误`);
    assert.equal(options[0].correct, true, `题目 ${row[0]} 首项必须正确`);
    assert.ok(options.slice(1).every(option => option.correct === false), `题目 ${row[0]} 后续选项必须错误`);
    if (row[2] === '1') {
      assert.equal(options[0].content, sense[4], `题型一 ${row[0]} 首项必须等于词义`);
      assert.equal(new Set(options.map(option => option.content)).size, 4, `题型一 ${row[0]} 选项不能重复`);
    } else {
      for (const option of options) {
        assert.ok(option.content === UNAVAILABLE_EXAMPLE || availableExamples.has(stripTags(option.content)), `题型二 ${row[0]} 含未登记例句`);
        assert.ok(!String(option.content).includes('在该句中表示'), `题型二 ${row[0]} 不得使用伪例句`);
      }
    }
    if (!groups.has(String(row[1]))) groups.set(String(row[1]), []);
    groups.get(String(row[1])).push(row);
  }
  for (const sense of senseRows) {
    const own = groups.get(String(sense[0])) || [];
    assert.equal(own.length, sense[5] ? 2 : 0, `sense_id ${sense[0]} 的题目数量错误`);
  }
  return { senses: senseRows.length, examples: senseRows.filter(row => row[5]).length, questions: questionRows.length, unavailable: questionRows.reduce((n, row) => n + JSON.parse(row[4]).filter(option => option.content === UNAVAILABLE_EXAMPLE).length, 0) };
}

function checkPureLogic() {
  const records = [
    { id: 1, word: '望', meaning: '<动>远看', example: '吾尝跂而望矣。' },
    { id: 2, word: '望', meaning: '<名>农历每月十五日', example: '七月既望。' },
    { id: 3, word: '望', meaning: '<动>远看', example: '西北望长安。' },
    { id: 4, word: '绝', meaning: '<动>横渡', example: '而绝江河。' },
  ];
  const questions = buildQuestions(records, []);
  const q1 = questions.find(row => row.senseId === 1 && row.type === 1);
  const q2 = questions.find(row => row.senseId === 1 && row.type === 2);
  assert.equal(q1.options[0].content, '<动>远看');
  assert.equal(q1.options[1].content, '<名>农历每月十五日');
  assert.equal(q1.options.length, 4);
  assert.equal(q2.options[0].content, '西北<b>望</b>长安。');
  assert.equal(q2.options[1].content, '七月既<b>望</b>。');
  const q2NoOther = questions.find(row => row.senseId === 4 && row.type === 2);
  assert.equal(q2NoOther.options[0].correct, true);
  assert.equal(q2NoOther.options[1].correct, false);
  assert.equal(q2NoOther.options[0].content, UNAVAILABLE_EXAMPLE);
  assert.equal(q2NoOther.options[1].content, UNAVAILABLE_EXAMPLE);
}

checkPureLogic();
const result = checkGeneratedSql();
console.log(JSON.stringify({ ...result, pureLogic: 'ok' }, null, 2));
