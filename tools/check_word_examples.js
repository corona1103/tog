const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SQL = path.join(ROOT, 'sql', 'edu_chn_word_sense.sql');
const REPORT = path.join(ROOT, 'sql', 'edu_chn_word_missing_examples.md');

function tuples(text) {
  const out = [];
  let i = 0;
  while ((i = text.indexOf('\n(', i)) >= 0) {
    const start = i + 1;
    let end = start;
    let quoted = false;
    for (; end < text.length; end += 1) {
      const char = text[end];
      if (char === "'") {
        if (quoted && text[end + 1] === "'") { end += 1; continue; }
        quoted = !quoted;
      } else if (!quoted && char === ')') {
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
    if (body[i] === "'") {
      if (quoted && body[i + 1] === "'") { i += 1; continue; }
      quoted = !quoted;
    } else if (!quoted && body[i] === ',') {
      fields.push(body.slice(start, i).trim());
      start = i + 1;
    }
  }
  fields.push(body.slice(start).trim());
  return fields;
}

function value(token) {
  if (token === 'NULL') return null;
  if (!token.startsWith("'")) return token;
  return token.slice(1, -1).replace(/''/g, "'").replace(/\\\\/g, '\\');
}

const rows = tuples(fs.readFileSync(SQL, 'utf8'))
  .map(splitTuple)
  .filter(row => row.length === 10 && /^\d+$/.test(row[0]))
  .map(row => ({
    id: Number(row[0]), wordClass: Number(row[1]), word: value(row[2]), meaning: value(row[4]),
    example: value(row[5]), source: value(row[6]), translation: value(row[7]), status: Number(row[8]),
  }));

const missing = rows.filter(row => !row.example);
const high = missing.filter(row => row.source.startsWith('部编版'));
const junior = missing.filter(row => row.source.startsWith('统编版'));
const line = row => `| ${row.id} | ${row.wordClass === 1 ? '实词' : '虚词'} | ${row.word} | ${row.meaning} | ${row.source} | ${row.status === 0 ? '草稿' : row.status} |`;

const markdown = [
  '# 语文实虚词空白例句待补清单',
  '',
  `更新时间：${new Date().toISOString().slice(0, 10)}`,
  '',
  `统一词义数据共 ${rows.length} 条，已补充原文 ${rows.length - missing.length} 条，当前仍有 ${missing.length} 条未能从项目现有篇目原文中确认。以下记录保持草稿状态，未生成题目；如能提供对应原文，可按 sense_id 回填。`,
  '',
  `高中 ${high.length} 条，初中 ${junior.length} 条。`,
  '',
  '## 高中',
  '',
  '| sense_id | 词类 | 原词 | 释义 | 来源 | 状态 |',
  '| ---: | --- | --- | --- | --- | --- |',
  ...(high.length ? high.map(line) : ['| - | - | 无 | - | - | - |']),
  '',
  '## 初中',
  '',
  '| sense_id | 词类 | 原词 | 释义 | 来源 | 状态 |',
  '| ---: | --- | --- | --- | --- | --- |',
  ...(junior.length ? junior.map(line) : ['| - | - | 无 | - | - | - |']),
  '',
].join('\n');

fs.writeFileSync(REPORT, markdown);
console.log(JSON.stringify({ total: rows.length, resolved: rows.length - missing.length, missing: missing.length, high: high.length, junior: junior.length, report: REPORT }, null, 2));
