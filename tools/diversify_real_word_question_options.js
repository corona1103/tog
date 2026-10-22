const fs = require('node:fs');
const path = require('node:path');
const externalExamples = require('./yuwen_word_external_examples');

const ROOT = path.resolve(__dirname, '..');
const SQL_DIR = path.join(ROOT, 'sql');
const SENSE_SQL = path.join(SQL_DIR, 'edu_chn_word_sense.sql');
const QUESTION_SQL = path.join(SQL_DIR, 'edu_chn_word_question.sql');
const TARGET_WORDS = new Set('方 冠 让 得 安 保 辟 举 度 治 爱 诚 故 解 中 族 发 养 技 经'.split(' '));

// 其他真实释义不足三项时使用的具体释义。每一项都带词性，不再使用“反义/字面义”占位文本。
const SAFE_FALLBACK_MEANINGS = {
  方: ['<名>道理；礼义', '<名>方形；与“圆”相对', '<名>方向；方位', '<名>区域；地方', '<形>正直', '<介>当；在', '<副>正，正在'],
  冠: ['<名>帽子', '<名>鸟类头顶上突出的肉或翎毛', '<动>行冠礼', '<动>戴帽子'],
  让: ['<动>推辞；拒绝', '<动>退让；退避', '<动>责备；责怪', '<动>请；邀请'],
  得: ['<动>获得；得到；取得', '<动>能够', '<形>合适；恰当', '<形>得意；满足', '<助>表示动作完成或补充说明结果', '<动>实现；达到'],
  安: ['<副>怎么；哪里', '<动>养；奉养', '<形>安定；安稳；安宁；安全', '<形>安适；安逸', '<使动>使……安定'],
  保: ['<名>保人', '<动>保护', '<动>保全；保存', '<动>保持；保守'],
  辟: ['<动>开辟', '<动>批驳', '<动>征召', '<动>躲避；逃避'],
  举: ['<动>推及', '<动>攻取；占领', '<副>全；所有', '<动>举起；抬起', '<动>推荐；推举', '<动>提出'],
  度: ['<动>衡量', '<动>估计', '<动>考虑', '<名>尺度；标准', '<动>渡过'],
  治: ['<动>治理', '<动>医治', '<名>治所', '<动>研究；学习', '<动>惩治'],
  爱: ['<动>吝惜', '<动>爱护', '<名>恩惠', '<动>喜欢；喜爱', '<动>爱好'],
  诚: ['<副>果真', '<副>确实', '<副>确实；的确', '<动>真正；确实', '<名>诚心；真心', '<形>诚实'],
  故: ['<副>所以', '<连>所以；因此', '<名>缘故；原因', '<形>旧的', '<名>事故'],
  解: ['<动>分解；剖开', '<动>解开；解脱', '<动>解释；说明', '<名>押送的差役', '<动>押送'],
  中: ['<动>合乎', '<动>射中', '<形>中等', '<名>中间', '<动>击中'],
  族: ['<名>筋骨交错的地方', '<名>家族', '<动>灭族', '<名>同类的人', '<名>种类'],
  发: ['<动>出；发出声音', '<动>打开', '<动>出发', '<名>头发', '<动>发射'],
  养: ['<动>保养', '<动>养育', '<动>奉养', '<动>培养', '<名>供养'],
  技: ['<名>技艺', '<名>技能', '<动>擅长', '<名>本领', '<动>掌握技巧'],
  经: ['<名>经脉', '<名>经典', '<动>经过', '<动>经历', '<名>经书'],
};

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
      const fieldCase = statement[1].match(new RegExp('`' + field + '`\\s*=\\s*CASE\\s+`id`([\s\S]*?)END'));
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

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function meaningText(value) {
  return String(value || '').replace(/^<[^>]+>/, '').replace(/[，；。、“”‘’（）()：:]/g, '');
}

function tooSimilar(left, right) {
  const a = meaningText(left);
  const b = meaningText(right);
  if (!a || !b) return true;
  return a === b || a.includes(b) || b.includes(a);
}

function distinctCandidates(candidates, correctMeaning) {
  const selected = [];
  for (const candidate of unique(candidates)) {
    if (tooSimilar(candidate, correctMeaning)) continue;
    if (selected.some(item => tooSimilar(item, candidate))) continue;
    selected.push(candidate);
  }
  return selected;
}

function distractorPools(row, senses) {
  const current = senses
    .filter(item => item.word === row.word && item.meaning !== row.meaning)
    .sort((a, b) => a.id - b.id)
    .map(item => item.meaning);
  const external = externalExamples
    .filter(item => item.word === row.word && item.meaning !== row.meaning)
    .map(item => item.meaning);
  const real = distinctCandidates([
    ...current,
    ...external,
  ], row.meaning);
  const fallback = distinctCandidates(SAFE_FALLBACK_MEANINGS[row.word] || [], row.meaning)
    .filter(item => !real.some(realItem => tooSimilar(realItem, item)));
  return { real, fallback };
}

function rotate(items, offset, count) {
  if (!items.length) return [];
  return Array.from({ length: count }, (_, index) => items[(offset + index) % items.length]);
}

function makeDistractors(row, senses, groupIndex) {
  const { real, fallback } = distractorPools(row, senses);
  // 有三个及以上真实释义时，只从真实释义中轮换，避免混入反义/字面义。
  if (real.length >= 3) return rotate(real, groupIndex % real.length, 3);
  // 真实释义不足三个时，必须全部保留，再用兜底项补足。
  return [...real, ...rotate(fallback, groupIndex % Math.max(fallback.length, 1), 3 - real.length)];
}

const senseRows = applySenseCaseUpdates(readRows(SENSE_SQL, 10)).map(row => ({
  id: Number(row[0]),
  word: row[2],
  meaning: row[4],
  example: row[5],
}));
const questionRows = readRows(QUESTION_SQL, 7);
const q1BySense = new Map(questionRows.filter(row => row[2] === '1').map(row => [Number(row[1]), row]));
const targetRows = senseRows
  .filter(row => TARGET_WORDS.has(row.word) && row.example)
  .sort((a, b) => a.id - b.id);
const groupCounts = new Map();
const updates = [];

for (const row of targetRows) {
  const question = q1BySense.get(row.id);
  if (!question) continue;
  const groupKey = `${row.word}|${row.meaning}`;
  const groupIndex = groupCounts.get(groupKey) || 0;
  groupCounts.set(groupKey, groupIndex + 1);
  const distractors = makeDistractors(row, senseRows, groupIndex);
  updates.push({
    questionId: Number(question[0]),
    senseId: row.id,
    word: row.word,
    meaning: row.meaning,
    options: [{ content: row.meaning, correct: true }, ...distractors.map(content => ({ content, correct: false }))],
  });
}

if (updates.length) {
  const cases = updates.map(update => `  WHEN ${update.questionId} THEN ${sqlString(JSON.stringify(update.options))}`).join(',\n');
  const ids = updates.map(update => update.questionId).join(', ');
  const block = [
    '',
    '-- 2026-10-22：20个目标实词题型一混淆项分散处理（保留正确答案与题目ID）',
    'START TRANSACTION;',
    '',
    'UPDATE `edu_chn_word_question` SET `options_json` = CASE `id`',
    cases,
    '  ELSE `options_json`',
    'END;',
    `WHERE \`id\` IN (${ids});`,
    '',
    'COMMIT;',
    '',
  ].join('\n');
  fs.appendFileSync(QUESTION_SQL, block);
}

console.log(JSON.stringify({
  updatedQuestionCount: updates.length,
  sample: updates.filter(item => item.senseId === 229 || item.senseId === 1759),
}, null, 2));
