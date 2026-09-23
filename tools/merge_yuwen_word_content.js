const fs = require('fs');
const path = require('path');

const ROOT = '/Users/tal/Desktop/tog';
const SQL_DIR = path.join(ROOT, 'sql');
const q = name => `${String.fromCharCode(96)}${name}${String.fromCharCode(96)}`;

function tuples(text) {
  const out = [];
  let i = 0;
  while ((i = text.indexOf('\n(', i)) >= 0) {
    const start = i + 1;
    let j = start;
    let quoted = false;
    for (; j < text.length; j += 1) {
      const c = text[j];
      if (c === "'") {
        if (quoted && text[j + 1] === "'") { j += 1; continue; }
        quoted = !quoted;
      } else if (!quoted && c === ')') {
        out.push(text.slice(start, j + 1));
        i = j + 1;
        break;
      }
    }
    if (j >= text.length) break;
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

function readRows(file, fieldCount) {
  const text = fs.readFileSync(path.join(SQL_DIR, file), 'utf8');
  return tuples(text)
    .map(splitTuple)
    .filter(row => row.length === fieldCount && /^\d+$/.test(row[0]));
}

// 初高中已经共用统一 SQL，脚本仅做幂等整理与题目重生成，不再读取已删除的中间 SQL。
const unifiedSense = readRows('edu_chn_word_sense.sql', 10);
const unifiedQuestion = readRows('edu_chn_word_question.sql', 7);
const unifiedCatalog = readRows('edu_chn_word_catalog.sql', 9);

function insertSql(table, columns, rows, header) {
  const updates = columns.slice(1).map(name => `${q(name)} = VALUES(${q(name)})`).join(',\n');
  return [
    header,
    '',
    'START TRANSACTION;',
    '',
    `INSERT INTO ${q(table)}`,
    `(${columns.map(q).join(', ')})`,
    'VALUES',
    rows.map(row => `(${row.join(', ')})`).join(',\n'),
    'ON DUPLICATE KEY UPDATE',
    `${updates};`,
    '',
    'COMMIT;',
    '',
  ].join('\n');
}

const senseColumns = ['id', 'word_class', 'word', 'pinyin', 'meaning', 'example', 'source', 'example_trans', 'status', 'is_del'];
const questionColumns = ['id', 'sense_id', 'question_type', 'stem', 'options_json', 'status', 'is_del'];
const catalogColumns = ['id', 'version_id', 'version_name', 'volume_id', 'volume_name', 'sense_id', 'sort', 'status', 'is_del'];

const catalogDdl = [
  '-- 语文积累本-高中与初中实虚词教材关系（统一目录结构）',
  '-- 初高中数据共用同一张表，通过 version_id + volume_id 区分教材版本与分册。',
  `CREATE TABLE IF NOT EXISTS ${q('edu_chn_word_catalog')} (`,
  `${q('id')} int(10) NOT NULL AUTO_INCREMENT COMMENT '主键',`,
  `${q('version_id')} varchar(64) NOT NULL COMMENT '学校管理平台教材版本ID',`,
  `${q('version_name')} varchar(512) DEFAULT NULL COMMENT '版本名称',`,
  `${q('volume_id')} varchar(64) NOT NULL COMMENT '分册/书目ID',`,
  `${q('volume_name')} varchar(512) DEFAULT NULL COMMENT '分册/书目名称',`,
  `${q('sense_id')} int(10) NOT NULL COMMENT '词义ID，关联 edu_chn_word_sense.id',`,
  `${q('sort')} int(10) NOT NULL DEFAULT '0' COMMENT '词表顺序',`,
  `${q('status')} tinyint(2) NOT NULL DEFAULT '0' COMMENT '0=草稿，1=上架',`,
  `${q('is_del')} tinyint(2) NOT NULL DEFAULT '0' COMMENT '0=未删除，1=已删除',`,
  `${q('create_time')} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',`,
  `${q('update_time')} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',`,
  `PRIMARY KEY (${q('id')}),`,
  `KEY ${q('version_id')} (${q('version_id')}),`,
  `KEY ${q('volume_id')} (${q('volume_id')}),`,
  `KEY ${q('idx_sense')} (${q('sense_id')})`,
  ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='语文积累本-实虚词目录挂载';",
].join('\n');

const mergedSense = unifiedSense.sort((a, b) => Number(a[0]) - Number(b[0]));
const mergedQuestion = unifiedQuestion.sort((a, b) => Number(a[0]) - Number(b[0]));
const mergedCatalog = unifiedCatalog.sort((a, b) => Number(a[0]) - Number(b[0]));

fs.writeFileSync(path.join(SQL_DIR, 'edu_chn_word_sense.sql'), insertSql('edu_chn_word_sense', senseColumns, mergedSense, '-- 语文积累本-高中与初中实虚词词义例句（统一数据表）'));
fs.writeFileSync(path.join(SQL_DIR, 'edu_chn_word_question.sql'), insertSql('edu_chn_word_question', questionColumns, mergedQuestion, '-- 语文积累本-高中与初中实虚词题目（统一数据表）'));
fs.writeFileSync(path.join(SQL_DIR, 'edu_chn_word_catalog.sql'), `${catalogDdl}\n\n${insertSql('edu_chn_word_catalog', catalogColumns, mergedCatalog, '')}`);

console.log(JSON.stringify({
  sense: mergedSense.length,
  question: mergedQuestion.length,
  catalog: mergedCatalog.length,
  source: 'edu_chn_word_* 统一数据表',
}, null, 2));

// 统一题目必须基于合并后的高中+初中词义生成。
require('./regenerate_yuwen_word_questions').regenerateQuestions();
