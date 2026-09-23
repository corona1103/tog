const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = '/Users/tal/Desktop/tog';
const SQL_DIR = path.join(ROOT, 'sql');
const PREVIEW = path.join(ROOT, 'demo/yuwen/accumulation/word-student-preview.html');
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

const senses = readRows('edu_chn_word_sense.sql', 10);
const questions = readRows('edu_chn_word_question.sql', 7);
const catalogs = readRows('edu_chn_word_catalog.sql', 9);
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
  const parts = source.split('｜');
  const volume = parts[1] || '';
  const unitName = parts[2] || '';
  const book = (parts[3] || '').replace(/^《|》$/g, '');
  const catalog = catalogBySense.get(String(row[0])) || [];
  const questions1 = q1.get(String(row[0])) || [];
  const questions2 = q2.get(String(row[0])) || [];
  const example = row[5] || '（原文例句待复核）';
  return {
    id: Number(row[0]),
    wordClass: Number(row[1]),
    word: row[2],
    pinyin: row[3],
    meaning: row[4],
    example,
    source,
    exampleTrans: row[7] || '',
    versionId: catalog[1] || '',
    versionName: catalog[2] || parts[0] || '',
    volumeId: catalog[3] || '',
    volumeName: catalog[4] || volume,
    distractors: questions1.slice(1).map(item => item.content),
    compareOptions: questions2.map(item => item.content),
    questionIds: { type1: q1Id.get(String(row[0])) || null, type2: q2Id.get(String(row[0])) || null },
    compareCorrect: 0,
    questionEnabled: Boolean(questions1.length && questions2.length && row[5]),
    book,
    unitId: md5(`${parts[0] || ''}|${volume}|${unitName}`),
    unitName,
  };
});

let html = fs.readFileSync(PREVIEW, 'utf8');
// 学生端预览支持窄屏阅读，不再显示“请横屏查看”遮罩。
const responsiveStyle = '<style id="word-responsive-css">@media(max-width:959px){html,body{overflow-x:hidden}.tablet{display:block!important;width:100%;min-width:0;min-height:100vh;margin:0;border-radius:0;box-shadow:none}.rotate{display:none!important}}</style>';
const optionQualityStyle = '<style id="word-option-quality-css">.option.option-unavailable{background:#fff1f1;color:#d84a4a;border:1px solid #f3b5b5}</style>';
html = html.replace(/<style id="word-responsive-css">[\s\S]*?<\/style>/g, '');
html = html.replace(/<style id="word-option-quality-css">[\s\S]*?<\/style>/g, '');
html = html.replace('</head>', `${responsiveStyle}</head>`);
html = html.replace('</head>', `${optionQualityStyle}</head>`);
html = html.replace(/min-width:960px;/g, '');
const dataStart = html.indexOf('const records=');
const dataEnd = html.indexOf(';const cardGrid', dataStart);
if (dataStart < 0 || dataEnd < 0) throw new Error('预览页 records 数据边界未找到');
html = `${html.slice(0, dataStart)}const records=${JSON.stringify(records)}${html.slice(dataEnd)}`;

html = html.replace(/<div class="filters">[\s\S]*?<\/div>/, '<div class="filters"><label>筛选</label><select id="classFilter"><option value="全部">全部词类</option><option value="实词">实词</option><option value="虚词">虚词</option></select><select id="versionFilter"><option value="全部">全部教材版本</option></select><select id="volumeFilter"><option value="全部">全部分册</option></select><select id="bookFilter"><option value="全部">全部篇目</option></select><span class="count"><b id="visibleCount">0</b> 个原词</span></div>');
html = html.replace(/<span class="pill blue">[^<]*<\/span>/, '<span class="pill blue">六三制 · 部编版</span>');
html = html.replace(/<span class="pill green">[^<]*<\/span>/g, `<span class="pill green">${senses.length} 条词义例句</span>`);
const gridStart = html.indexOf('<div class="grid" id="cardGrid">');
const drawerStart = html.indexOf('<div class="drawer-mask"', gridStart);
if (gridStart < 0 || drawerStart < 0) throw new Error('预览页卡片区域边界未找到');
html = `${html.slice(0, gridStart)}<div class="grid" id="cardGrid"></div>${html.slice(drawerStart)}`;

const oldRefs = 'const cardGrid=document.querySelector(\'#cardGrid\');const classFilter=document.querySelector(\'#classFilter\');const bookFilter=document.querySelector(\'#bookFilter\');const visibleCount=document.querySelector(\'#visibleCount\');';
const newRefs = 'const cardGrid=document.querySelector(\'#cardGrid\');const classFilter=document.querySelector(\'#classFilter\');const versionFilter=document.querySelector(\'#versionFilter\');const volumeFilter=document.querySelector(\'#volumeFilter\');const bookFilter=document.querySelector(\'#bookFilter\');const visibleCount=document.querySelector(\'#visibleCount\');';
if (html.includes(oldRefs)) html = html.replace(oldRefs, newRefs);
else if (!html.includes(newRefs)) throw new Error('预览页筛选引用未找到');

const optionStart = html.indexOf('function optionMarkup(');
const optionEnd = html.indexOf('function exampleMarkup', optionStart);
if (optionStart < 0 || optionEnd < 0) throw new Error('预览页题目选项渲染函数未找到');
const newOptionMarkup = `function optionMarkup(items,highlight){return items.map((item,index)=>{const text=String(item??'');const unavailable=text==='暂无例句';return '<div class="option'+(unavailable?' option-unavailable':'')+'" data-label="'+String.fromCharCode(65+index)+'">'+(highlight?rich(text):esc(text))+'</div>'}).join('')}`;
html = `${html.slice(0, optionStart)}${newOptionMarkup}${html.slice(optionEnd)}`;

const drawStart = html.indexOf('function draw(){');
const drawEnd = html.indexOf('function openDrawer', drawStart);
if (drawStart < 0 || drawEnd < 0) throw new Error('预览页 draw 函数未找到');
const newDraw = `function draw(){const cls=classFilter.value;const version=versionFilter.value;const volume=volumeFilter.value;const book=bookFilter.value;const filtered=records.filter(row=>(cls==='全部'||(row.wordClass===1?'实词':'虚词')===cls)&&(version==='全部'||row.versionId===version)&&(volume==='全部'||row.volumeId===volume)&&(book==='全部'||row.book===book));const groups=makeGroups(filtered);visibleCount.textContent=groups.length;cardGrid.innerHTML=groups.length?groups.map(cardMarkupFor).join(''):'<div class="empty">当前筛选范围暂无词义内容</div>';bindCards()}`;
html = `${html.slice(0, drawStart)}${newDraw}${html.slice(drawEnd)}`;

const oldInit = 'classFilter.onchange=draw;bookFilter.onchange=draw;mask.onclick=closeDrawer;bindCards();';
const oldNewInit = 'const bookNames=[...new Set(records.map(row=>row.book).filter(Boolean))];bookFilter.innerHTML=\'<option value="全部">全部篇目</option>\'+bookNames.map(name=>\'<option value="\'+esc(name)+\'">\'+esc(name)+\'</option>\').join(\'\');classFilter.onchange=draw;bookFilter.onchange=draw;mask.onclick=closeDrawer;draw();';
const newInit = 'const versionNames=[...new Map(records.map(row=>[row.versionId,row.versionName]).filter(([id])=>id)).entries()];versionFilter.innerHTML=\'<option value="全部">全部教材版本</option>\'+versionNames.map(([id,name])=>\'<option value="\'+esc(id)+\'">\'+esc(name)+\'</option>\').join(\'\');function refreshVolumes(){const version=versionFilter.value;const volumes=[...new Map(records.filter(row=>version===\'全部\'||row.versionId===version).map(row=>[row.volumeId,row.volumeName]).filter(([id])=>id)).entries()];volumeFilter.innerHTML=\'<option value="全部">全部分册</option>\'+volumes.map(([id,name])=>\'<option value="\'+esc(id)+\'">\'+esc(name)+\'</option>\').join(\'\');refreshBooks();}function refreshBooks(){const version=versionFilter.value;const volume=volumeFilter.value;const books=[...new Set(records.filter(row=>(version===\'全部\'||row.versionId===version)&&(volume===\'全部\'||row.volumeId===volume)).map(row=>row.book).filter(Boolean))];bookFilter.innerHTML=\'<option value="全部">全部篇目</option>\'+books.map(name=>\'<option value="\'+esc(name)+\'">\'+esc(name)+\'</option>\').join(\'\');}versionFilter.onchange=()=>{refreshVolumes();draw()};volumeFilter.onchange=()=>{refreshBooks();draw()};classFilter.onchange=draw;bookFilter.onchange=draw;mask.onclick=closeDrawer;refreshVolumes();draw();';
if (html.includes(oldNewInit)) html = html.replace(oldNewInit, newInit);
else if (html.includes(oldInit)) html = html.replace(oldInit, newInit);
else if (html.includes(newInit)) { /* 已经是级联筛选初始化代码 */ }
else throw new Error('预览页初始化代码未找到');

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
