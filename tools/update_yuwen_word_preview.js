const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = '/Users/tal/Desktop/tog';
const SQL_DIR = process.env.YUWEN_SQL_DIR || path.join(ROOT, 'sql');
const PREVIEW = process.env.YUWEN_PREVIEW || path.join(ROOT, 'demo/yuwen/accumulation/word-student-preview.html');
const md5 = value => crypto.createHash('md5').update(value).digest('hex');

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

function sqlValue(value) {
  if (value === 'NULL') return null;
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'").replace(/\\\\/g, '\\');
  }
  return value;
}

function readRows(file, fieldCount) {
  const text = fs.readFileSync(path.join(SQL_DIR, file), 'utf8');
  return tuples(text).map(tuple => splitTuple(tuple).map(sqlValue)).filter(row => row.length === fieldCount && /^\d+$/.test(String(row[0])));
}

function splitAssignments(setClause) {
  const parts = [];
  let start = 0;
  let quoted = false;
  for (let i = 0; i < setClause.length; i += 1) {
    const c = setClause[i];
    if (c === "'") {
      if (quoted && setClause[i + 1] === "'") { i += 1; continue; }
      quoted = !quoted;
    } else if (!quoted && c === ',') {
      parts.push(setClause.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(setClause.slice(start).trim());
  return parts;
}

function parseSqlScalar(raw) {
  const value = raw.trim();
  if (value === 'NULL') return null;
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'").replace(/\\\\/g, '\\');
  }
  return value;
}

function applyExactIdUpdates(text, table, rows, columns) {
  const indexByColumn = new Map(columns.map((column, index) => [column, index]));
  const updates = new Map();
  const pattern = new RegExp('UPDATE\\s+`' + table + '`\\s+SET\\s+([^;]*?)\\s+WHERE\\s+`id`\\s*=\\s*(\\d+)\\s*;', 'g');
  for (const match of text.matchAll(pattern)) {
    const values = new Map();
    for (const assignment of splitAssignments(match[1])) {
      const item = assignment.match(/^`([^`]+)`\s*=\s*([\s\S]*)$/);
      if (!item || !indexByColumn.has(item[1])) continue;
      values.set(indexByColumn.get(item[1]), parseSqlScalar(item[2]));
    }
    updates.set(String(match[2]), values);
  }
  return rows.map(row => {
    const values = updates.get(String(row[0]));
    if (!values) return row;
    const next = [...row];
    for (const [index, value] of values) next[index] = value;
    return next;
  });
}

function applyDeleteUpdates(text, table, rows, keyColumn, keyIndex) {
  const indexByColumn = { status: 5, is_del: 6 };
  if (table === 'edu_chn_word_sense') {
    indexByColumn.status = 8;
    indexByColumn.is_del = 9;
  } else if (table === 'edu_chn_word_catalog') {
    indexByColumn.status = 7;
    indexByColumn.is_del = 8;
  }
  const deleted = new Set();
  const pattern = new RegExp('UPDATE\\s+`' + table + '`\\s+SET\\s+`status`\\s*=\\s*0\\s*,\\s*`is_del`\\s*=\\s*1\\s+WHERE\\s+`' + keyColumn + '`\\s+IN\\s*\\(([^)]*)\\)\\s*;', 'g');
  for (const match of text.matchAll(pattern)) {
    for (const value of match[1].split(',')) deleted.add(value.trim());
  }
  if (!deleted.size) return rows;
  return rows.map(row => deleted.has(String(row[keyIndex])) ? Object.assign([...row], {
    [indexByColumn.status]: '0',
    [indexByColumn.is_del]: '1',
  }) : row);
}

function applyFieldCaseUpdates(text, rows, field, index) {
  const updates = new Map();
  const statements = text.matchAll(/UPDATE\s+`edu_chn_word_sense`\s+SET\s+([\s\S]*?)\nWHERE[\s\S]*?;/g);
  for (const statement of statements) {
    const fieldCase = statement[1].match(new RegExp('`' + field + '`\\s*=\\s*CASE\\s+`id`([\\s\\S]*?)END\\s*(?:,|$)'));
    if (!fieldCase) continue;
    for (const match of fieldCase[1].matchAll(/WHEN\s+(\d+)\s+THEN\s+'((?:''|[^'])*)'/g)) {
      updates.set(match[1], match[2].replace(/''/g, "'"));
    }
  }
  return rows.map(row => updates.has(String(row[0])) ? [...row.slice(0, index), updates.get(String(row[0])), ...row.slice(index + 1)] : row);
}

function applyQuestionOptionUpdates(text, rows) {
  const updates = new Map();
  const blocks = text.matchAll(/UPDATE\s+`edu_chn_word_question`\s+SET\s+`options_json`\s*=\s*CASE\s+`id`([\s\S]*?)END;\s*\nWHERE[\s\S]*?;/g);
  for (const block of blocks) {
    const body = block[1];
    for (const match of body.matchAll(/WHEN\s+(\d+)\s+THEN\s+'((?:''|[^'])*)'/g)) {
      updates.set(match[1], match[2].replace(/''/g, "'"));
    }
  }
  return rows.map(row => updates.has(String(row[0])) ? [...row.slice(0, 4), updates.get(String(row[0])), ...row.slice(5)] : row);
}

const senseSqlText = fs.readFileSync(path.join(SQL_DIR, 'edu_chn_word_sense.sql'), 'utf8');
let senses = readRows('edu_chn_word_sense.sql', 10);
for (const [field, index] of [['meaning', 4], ['example', 5], ['source', 6], ['example_trans', 7], ['status', 8], ['is_del', 9]]) {
  senses = applyFieldCaseUpdates(senseSqlText, senses, field, index);
}
// 总表除了 CASE 更新外，还包含二审同步产生的按 ID 覆盖和逻辑删除记录。
senses = applyDeleteUpdates(senseSqlText, 'edu_chn_word_sense', senses, 'id', 0);
senses = applyExactIdUpdates(senseSqlText, 'edu_chn_word_sense', senses, ['id', 'word_class', 'word', 'pinyin', 'meaning', 'example', 'source', 'example_trans', 'status', 'is_del']);
// 预览只展示最终有效词义。
senses = senses.filter(row => String(row[9]) !== '1');
const questionSqlText = fs.readFileSync(path.join(SQL_DIR, 'edu_chn_word_question.sql'), 'utf8');
let questions = readRows('edu_chn_word_question.sql', 7);
questions = applyDeleteUpdates(questionSqlText, 'edu_chn_word_question', questions, 'sense_id', 1);
questions = applyQuestionOptionUpdates(questionSqlText, questions);
questions = applyExactIdUpdates(questionSqlText, 'edu_chn_word_question', questions, ['id', 'sense_id', 'question_type', 'stem', 'options_json', 'status', 'is_del']);
questions = questions.filter(row => String(row[6]) !== '1');
const catalogSqlText = fs.readFileSync(path.join(SQL_DIR, 'edu_chn_word_catalog.sql'), 'utf8');
let catalogs = readRows('edu_chn_word_catalog.sql', 9);
catalogs = applyDeleteUpdates(catalogSqlText, 'edu_chn_word_catalog', catalogs, 'sense_id', 5);
catalogs = applyExactIdUpdates(catalogSqlText, 'edu_chn_word_catalog', catalogs, ['id', 'version_id', 'version_name', 'volume_id', 'volume_name', 'sense_id', 'sort', 'status', 'is_del']);
catalogs = catalogs.filter(row => String(row[8]) !== '1');
const catalogBySense = new Map(catalogs.map(row => [String(row[5]), row]));
const q1 = new Map();
const q2 = new Map();
const q1Id = new Map();
const q2Id = new Map();
for (const row of questions) {
  const parsed = JSON.parse(row[4]);
  if (row[2] === '1') { q1.set(String(row[1]), parsed); q1Id.set(String(row[1]), Number(row[0])); }
  if (row[2] === '2') { q2.set(String(row[1]), parsed); q2Id.set(String(row[1]), Number(row[0])); }
}

const records = senses.map(row => {
  const source = row[6] || '';
  const parts = source.split('｜').map(item => item.trim()).filter(Boolean);
  const legacySource = parts.length >= 4;
  const sourceVersion = legacySource ? parts[0] : '';
  const volume = legacySource ? parts[1] : (parts[0] || '');
  const unitName = legacySource ? parts[2] : '';
  const book = (legacySource ? parts[3] : (parts[1] || source.match(/《[^》]+》/)?.[0] || '')).replace(/^《|》$/g, '');
  const catalog = catalogBySense.get(String(row[0])) || [];
  const questions1 = q1.get(String(row[0])) || [];
  const questions2 = q2.get(String(row[0])) || [];
  // 保留 SQL 中的 NULL，不用额外文案替换，确保预览数据与总表一致。
  const example = row[5];
  return {
    id: Number(row[0]),
    wordClass: Number(row[1]),
    word: row[2],
    pinyin: row[3],
    meaning: row[4],
    example,
    source,
    exampleTrans: row[7],
    versionId: catalog[1] || '',
    versionName: catalog[2] || sourceVersion || '',
    volumeId: catalog[3] || '',
    volumeName: catalog[4] || volume,
    distractors: questions1.filter(item => !item.correct).map(item => item.content),
    compareOptions: questions2.map(item => item.content),
    questionIds: { type1: q1Id.get(String(row[0])) || null, type2: q2Id.get(String(row[0])) || null },
    compareCorrect: Math.max(0, questions2.findIndex(item => item.correct)),
    questionEnabled: Boolean(questions1.length && questions2.length && row[5]),
    book,
    unitId: md5(`${catalog[2] || sourceVersion || ''}|${volume}|${unitName}`),
    unitName,
  };
});

let html = fs.readFileSync(PREVIEW, 'utf8');
// 学生端预览支持窄屏阅读，不再显示“请横屏查看”遮罩。
const responsiveStyle = '<style id="word-responsive-css">@media(max-width:959px){html,body{overflow-x:hidden}.tablet{display:block!important;width:100%;min-width:0;min-height:100vh;margin:0;border-radius:0;box-shadow:none}.rotate{display:none!important}}</style>';
const optionQualityStyle = '<style id="word-option-quality-css">.option.option-unavailable{background:#fff1f1;color:#d84a4a;border:1px solid #f3b5b5}</style>';
const searchAndClassStyle = '<style id="word-search-class-css">.word-search{display:flex;gap:8px;align-items:center}.word-search label{font-size:12px;color:#8b99ae}.word-search input{width:112px;border:1px solid var(--line);border-radius:10px;background:#fff;color:#526582;padding:9px 11px;outline:none}.word-search input:focus{border-color:#8eb1ff;box-shadow:0 0 0 3px rgba(47,109,246,.1)}.word-search button{border:0;border-radius:10px;background:var(--blue);color:#fff;padding:9px 14px;font-size:12px;font-weight:700}.word-search button:hover{background:#245bd2}.sense-class-badge{display:inline-block;margin-right:6px;padding:3px 6px;border-radius:6px;font-size:10px;font-weight:750;vertical-align:1px}.sense-class-real{background:#fff0c2;color:#a86700;border:1px solid #f1c45d}.sense-class-virtual{background:#eee9ff;color:#5b49b8;border:1px solid #bcb0ff}</style>';
html = html.replace(/<style id="word-responsive-css">[\s\S]*?<\/style>/g, '');
html = html.replace(/<style id="word-option-quality-css">[\s\S]*?<\/style>/g, '');
html = html.replace('</head>', `${responsiveStyle}</head>`);
html = html.replace('</head>', `${optionQualityStyle}</head>`);
html = html.replace('</head>', `${searchAndClassStyle}</head>`);
html = html.replace(/min-width:960px;/g, '');
const dataStart = html.indexOf('const records=');
const dataEnd = html.indexOf(';const cardGrid', dataStart);
if (dataStart < 0 || dataEnd < 0) throw new Error('预览页 records 数据边界未找到');
html = `${html.slice(0, dataStart)}const records=${JSON.stringify(records)}${html.slice(dataEnd)}`;

html = html.replace(/<div class="filters">[\s\S]*?<\/div>/, '<div class="filters"><form class="word-search" id="wordSearchForm"><label for="wordSearch">原词</label><input id="wordSearch" type="search" placeholder="输入原词" autocomplete="off"><button id="wordSearchButton" type="submit">搜索</button></form><label>筛选</label><select id="classFilter"><option value="全部">全部词类</option><option value="实词">实词</option><option value="虚词">虚词</option></select><select id="versionFilter"><option value="全部">全部教材版本</option></select><select id="volumeFilter"><option value="全部">全部分册</option></select><select id="bookFilter"><option value="全部">全部篇目</option></select><span class="count"><b id="visibleCount">0</b> 个原词</span></div>');
html = html.replace(/<span class="pill blue">[^<]*<\/span>/, '<span class="pill blue">六三制 · 部编版</span>');
html = html.replace(/<span class="pill green">[^<]*<\/span>/g, `<span class="pill green">${senses.length} 条词义例句</span>`);
const gridStart = html.indexOf('<div class="grid" id="cardGrid">');
const drawerStart = html.indexOf('<div class="drawer-mask"', gridStart);
if (gridStart < 0 || drawerStart < 0) throw new Error('预览页卡片区域边界未找到');
html = `${html.slice(0, gridStart)}<div class="grid" id="cardGrid"></div>${html.slice(drawerStart)}`;

const groupStart = html.indexOf('function senseKey(');
const groupEnd = html.indexOf('function optionMarkup', groupStart);
if (groupStart < 0 || groupEnd < 0) throw new Error('预览页分组函数未找到');
const groupFunctions = `function senseKey(row){return [row.word,row.pinyin,String(row.meaning??'').trim()].join('|')}function makeSenseGroups(rows){const map=new Map();rows.forEach(row=>{const key=senseKey(row);if(!map.has(key))map.set(key,{key,wordClass:row.wordClass,word:row.word,pinyin:row.pinyin,meaning:row.meaning,rows:[]});map.get(key).rows.push(row)});return [...map.values()]}function senseClassRank(wordClass){return Number(wordClass)===2?0:1}function compareSenses(a,b){return senseClassRank(a.wordClass)-senseClassRank(b.wordClass)||String(a.pinyin??'').localeCompare(String(b.pinyin??''),'zh-CN',{sensitivity:'variant'})}function makeGroups(rows){const map=new Map();rows.forEach(row=>{if(!map.has(row.word))map.set(row.word,{key:row.word,word:row.word,pinyin:row.pinyin,senses:[],wordClass:row.wordClass,mixedWord:false})});map.forEach(group=>{const wordRows=rows.filter(row=>row.word===group.word);group.pinyin=wordRows.find(row=>row.pinyin)?.pinyin||'';group.wordClass=wordRows.some(row=>row.wordClass===1)?1:2;group.mixedWord=new Set(wordRows.map(row=>row.wordClass)).size>1;group.senses=makeSenseGroups(wordRows).sort(compareSenses)});return [...map.values()]}`;
html = `${html.slice(0, groupStart)}${groupFunctions}${html.slice(groupEnd)}`;

const cardStart = html.indexOf('function cardMarkupFor(');
const cardEnd = html.indexOf('function bindCards', cardStart);
if (cardStart < 0 || cardEnd < 0) throw new Error('预览页 cardMarkupFor 函数未找到');
const cardMarkup = `function cardMarkupFor(group){const tabs=group.senses.map((sense,index)=>{const badge=group.mixedWord?'<span class="sense-class-badge '+(sense.wordClass===1?'sense-class-real':'sense-class-virtual')+'">'+(sense.wordClass===1?'实词':'虚词')+'</span>':'';return '<button class="sense-tab'+(index===0?' active':'')+'" data-sense-tab="'+index+'">'+badge+'<b>'+esc(sense.meaning)+'</b><small>'+esc(sense.pinyin)+' · '+sense.rows.length+' 个例句</small></button>'}).join('');const panels=group.senses.map((sense,index)=>'<section class="sense-panel'+(index===0?' active':'')+'" data-sense-panel="'+index+'"><div class="meaning-head"><b>'+esc(sense.meaning)+'</b></div>'+sense.rows.map(exampleMarkup).join('')+'</section>').join('');return '<article class="word-card" data-class="'+(group.wordClass===1?'实词':'虚词')+'"><div class="word-card-head"><div><div class="word-title">'+esc(group.word)+'</div><div class="pinyin">'+esc(group.pinyin)+'</div></div></div><div class="sense-tabs">'+tabs+'</div><div class="sense-panels">'+panels+'</div></article>'}`;
html = `${html.slice(0, cardStart)}${cardMarkup}${html.slice(cardEnd)}`;

const oldRefs = 'const cardGrid=document.querySelector(\'#cardGrid\');const classFilter=document.querySelector(\'#classFilter\');const bookFilter=document.querySelector(\'#bookFilter\');const visibleCount=document.querySelector(\'#visibleCount\');';
const oldRefsWithCascade = 'const cardGrid=document.querySelector(\'#cardGrid\');const classFilter=document.querySelector(\'#classFilter\');const versionFilter=document.querySelector(\'#versionFilter\');const volumeFilter=document.querySelector(\'#volumeFilter\');const bookFilter=document.querySelector(\'#bookFilter\');const visibleCount=document.querySelector(\'#visibleCount\');';
const newRefs = 'const cardGrid=document.querySelector(\'#cardGrid\');const searchForm=document.querySelector(\'#wordSearchForm\');const wordSearch=document.querySelector(\'#wordSearch\');const classFilter=document.querySelector(\'#classFilter\');const versionFilter=document.querySelector(\'#versionFilter\');const volumeFilter=document.querySelector(\'#volumeFilter\');const bookFilter=document.querySelector(\'#bookFilter\');const visibleCount=document.querySelector(\'#visibleCount\');';
if (html.includes(oldRefs)) html = html.replace(oldRefs, newRefs);
else if (html.includes(oldRefsWithCascade)) html = html.replace(oldRefsWithCascade, newRefs);
else if (!html.includes(newRefs)) throw new Error('预览页筛选引用未找到');

const optionStart = html.indexOf('function optionMarkup(');
const optionEnd = html.indexOf('function exampleMarkup', optionStart);
if (optionStart < 0 || optionEnd < 0) throw new Error('预览页题目选项渲染函数未找到');
const newOptionMarkup = `function optionMarkup(items,highlight){return items.map((item,index)=>{const text=String(item??'');const unavailable=text==='暂无例句';return '<div class="option'+(unavailable?' option-unavailable':'')+'" data-label="'+String.fromCharCode(65+index)+'">'+(highlight?rich(text):esc(text))+'</div>'}).join('')}`;
html = `${html.slice(0, optionStart)}${newOptionMarkup}${html.slice(optionEnd)}`;

const drawStart = html.indexOf('function draw(){');
const drawEnd = html.indexOf('function openDrawer', drawStart);
if (drawStart < 0 || drawEnd < 0) throw new Error('预览页 draw 函数未找到');
const newDraw = `let searchWord='';function draw(){const cls=classFilter.value;const version=versionFilter.value;const volume=volumeFilter.value;const book=bookFilter.value;const scoped=records.filter(row=>(!searchWord||row.word===searchWord)&&(version==='全部'||row.versionId===version)&&(volume==='全部'||row.volumeId===volume)&&(book==='全部'||row.book===book));const matchedWords=cls==='全部'?null:new Set(scoped.filter(row=>(row.wordClass===1?'实词':'虚词')===cls).map(row=>row.word));const filtered=matchedWords?scoped.filter(row=>matchedWords.has(row.word)):scoped;const groups=makeGroups(filtered);visibleCount.textContent=groups.length;cardGrid.innerHTML=groups.length?groups.map(cardMarkupFor).join(''):'<div class="empty">当前筛选范围暂无词义内容</div>';bindCards()}`;
html = `${html.slice(0, drawStart)}${newDraw}${html.slice(drawEnd)}`;

const oldInit = 'classFilter.onchange=draw;bookFilter.onchange=draw;mask.onclick=closeDrawer;bindCards();';
const oldNewInit = 'const bookNames=[...new Set(records.map(row=>row.book).filter(Boolean))];bookFilter.innerHTML=\'<option value="全部">全部篇目</option>\'+bookNames.map(name=>\'<option value="\'+esc(name)+\'">\'+esc(name)+\'</option>\').join(\'\');classFilter.onchange=draw;bookFilter.onchange=draw;mask.onclick=closeDrawer;draw();';
const newInit = 'const versionNames=[...new Map(records.map(row=>[row.versionId,row.versionName]).filter(([id])=>id)).entries()];versionFilter.innerHTML=\'<option value="全部">全部教材版本</option>\'+versionNames.map(([id,name])=>\'<option value="\'+esc(id)+\'">\'+esc(name)+\'</option>\').join(\'\');function refreshVolumes(){const version=versionFilter.value;const volumes=[...new Map(records.filter(row=>version===\'全部\'||row.versionId===version).map(row=>[row.volumeId,row.volumeName]).filter(([id])=>id)).entries()];volumeFilter.innerHTML=\'<option value="全部">全部分册</option>\'+volumes.map(([id,name])=>\'<option value="\'+esc(id)+\'">\'+esc(name)+\'</option>\').join(\'\');refreshBooks();}function refreshBooks(){const version=versionFilter.value;const volume=volumeFilter.value;const books=[...new Set(records.filter(row=>(version===\'全部\'||row.versionId===version)&&(volume===\'全部\'||row.volumeId===volume)).map(row=>row.book).filter(Boolean))];bookFilter.innerHTML=\'<option value="全部">全部篇目</option>\'+books.map(name=>\'<option value="\'+esc(name)+\'">\'+esc(name)+\'</option>\').join(\'\');}searchForm.onsubmit=event=>{event.preventDefault();searchWord=wordSearch.value.trim();draw()};versionFilter.onchange=()=>{refreshVolumes();draw()};volumeFilter.onchange=()=>{refreshBooks();draw()};classFilter.onchange=draw;bookFilter.onchange=draw;mask.onclick=closeDrawer;refreshVolumes();draw();';
const initStart = html.indexOf('const versionNames=');
const initEnd = html.indexOf('</script>', initStart);
if (initStart < 0 || initEnd < 0) throw new Error('预览页初始化代码未找到');
html = `${html.slice(0, initStart)}${newInit}${html.slice(initEnd)}`;

html = html.replace(/<script id="word-copy-tools">[\s\S]*?<\/script>/g, '');
const copyScript = `<script id="word-copy-tools">
function copyPlainText(text){
  const area=document.createElement('textarea');
  area.value=text; area.setAttribute('readonly',''); area.style.position='fixed'; area.style.opacity='0';
  document.body.appendChild(area); area.select();
  const copied=document.execCommand('copy'); area.remove(); return copied;
}
async function copyRow(rowId,button){
  const row=records.find(item=>item.id===Number(rowId)); if(!row)return;
  const ids=row.questionIds||{};
  const content=[
    'edu_chn_word_sense.id: '+row.id,
    'edu_chn_word_question.id（题型一）: '+(ids.type1||'无题目'),
    'edu_chn_word_question.id（题型二）: '+(ids.type2||'无题目'),
    '原词: '+row.word,
    '释义: '+row.meaning,
    '篇目: '+row.book,
    '来源: '+row.source,
    '原文: '+String(row.example||'').replace(/<[^>]+>/g,''),
    '译文: '+(row.exampleTrans||'')
  ].join('\\n');
  let copied=false;
  try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(content);copied=true;}}catch(error){}
  if(!copied)copied=copyPlainText(content);
  const old=button.textContent; button.textContent=copied?'已复制':'复制失败';
  window.setTimeout(()=>{button.textContent=old;},1200);
}
function exampleMarkup(row){
  const action=row.questionEnabled?'<button class="example-question-btn" data-open-row="'+row.id+'">查看题目</button>':'<span class="example-study-note">例句积累</span>';
  const copy='<button class="example-copy-btn" data-copy-row="'+row.id+'">复制</button>';
  return '<div class="example-row"><div class="example-text">'+rich(row.example)+'</div><div class="example-footer"><div class="example-meta"><span>'+esc(row.book)+'</span><span>'+esc(row.exampleTrans)+'</span></div><div class="example-actions">'+action+copy+'</div></div></div>';
}
function bindCards(){
  cardGrid.querySelectorAll('[data-sense-tab]').forEach(tab=>tab.onclick=()=>{const card=tab.closest('.word-card');card.querySelectorAll('[data-sense-tab]').forEach(item=>item.classList.toggle('active',item===tab));card.querySelectorAll('[data-sense-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.sensePanel===tab.dataset.senseTab));});
  cardGrid.querySelectorAll('[data-open-row]').forEach(button=>button.onclick=()=>openDrawer(button.dataset.openRow));
  cardGrid.querySelectorAll('[data-copy-row]').forEach(button=>button.onclick=()=>copyRow(button.dataset.copyRow,button));
}
draw();
</script>`;
html = html.replace('</body></html>', `${copyScript}</body></html>`);

fs.writeFileSync(PREVIEW, html);
console.log(JSON.stringify({ records: records.length, books: new Set(records.map(row => row.book)).size, questions: questions.length }, null, 2));
