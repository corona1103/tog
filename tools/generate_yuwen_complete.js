const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = '/Users/tal/Desktop/tog';
const SQL_DIR = path.join(ROOT, 'sql');
const PREVIEW = path.join(ROOT, 'demo/yuwen/accumulation/content-preview.html');

const VERSIONS = {
  liusan: { id: '5e21a87b47a648eb9da56a51381e1611', name: '统编版（2024）六三制' },
  wusi: { id: '49803600a3d745be872ccc90e7663360', name: '统编版（2024）五四制' },
  high: { id: '00b6bf17df4345109f570bf0273705f3', name: '部编版' }
};

const md5 = value => crypto.createHash('md5').update(value).digest('hex');
const volumeId = (versionName, volumeName) => md5(`${versionName}|${volumeName}`);
const unitId = (versionName, volumeName, unitName) => md5(`${versionName}|${volumeName}|${unitName}`);

const poems = [];
const byTitle = new Map();
const fixedIds = { '观沧海': 900001, '短歌行': 900002, '宿建德江': 900003, '陈情表': 900004 };
let nextPoemId = 900005;
function cleanText(value) {
  let s = String(value ?? '');
  s = s.replace(/追\uFFFD+解放/g, '追求解放')
    .replace(/也\uFFFD+此/g, '也如此')
    .replace(/\uFFFD+江/g, '涉江')
    .replace(/日\uFFFD+亭/g, '日观亭')
    .replace(/\uFFFD+焉取之/g, '将焉取之')
    .replace(/沧海\uFFFD+粟/g, '沧海之一粟')
    .replace(/不如\uFFFD+理/g, '不如治理')
    .replace(/难\uFFFD+听/g, '难以听')
    .replace(/后人哀\uFFFD+而不鉴/g, '后人哀之而不鉴')
    .replace(/生孩六\uFFFD+/g, '生孩六月')
    .replace(/不\uFFFD+玩好/g, '不为玩好')
    .replace(/爱其\uFFFD+/g, '爱其子')
    .replace(/\uFFFD+/g, '');
  s = s.replace(/\r?\n/g, '\\n');
  return s;
}
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function applyEmphasis(content, words) {
  const terms = [...new Set(words.map(String).map(x => x.trim()).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
  if (!terms.length) return content;
  const pattern = new RegExp(terms.map(escapeRegExp).join('|'), 'g');
  return String(content)
    .split(/(<b>[\s\S]*?<\/b>)/g)
    .map((part, index) => index % 2 ? part : part.replace(pattern, '<b>$&</b>'))
    .join('');
}
function add(title, author, genre, content, translation, annotation = '', emphasis = [], intro = '', appreciation = '', extra = {}) {
  if (byTitle.has(title)) return byTitle.get(title);
  const id = fixedIds[title] || nextPoemId++;
  const cleanTitle = cleanText(title), cleanAuthor = cleanText(author), cleanContent = cleanText(content), cleanTranslation = cleanText(translation), cleanAnnotation = cleanText(annotation), cleanIntro = cleanText(intro), cleanAppreciation = cleanText(appreciation), cleanEmphasis = emphasis.map(cleanText);
  const emphasizedContent = applyEmphasis(cleanContent, cleanEmphasis);
  const row = { id, title: cleanTitle, author: cleanAuthor, genre, dynasty: cleanText(extra.dynasty || ''), content: emphasizedContent, translation: cleanTranslation, pinyin: null, annotation: cleanAnnotation, authorIntro: cleanIntro, appreciation: cleanAppreciation, extraJson: { content_key: extra.content_key || md5(cleanTitle).slice(0, 12), dynasty: cleanText(extra.dynasty || ''), school_stage: extra.school_stage || (genre === 1 ? '初中' : '高中'), preview_title: '理解与背诵', emphasis_words: cleanEmphasis, paragraph_count: emphasizedContent.split('##').length, required_catalogs: [] } };
  poems.push(row); byTitle.set(title, row); return row;
}
const poem = (title, author, lines, translations, opts = {}) => add(title, author, 1, lines.join('\\n'), translations.join('\\n'), opts.annotation || '', opts.emphasis || [], opts.intro || '', opts.appreciation || '', opts);
function formatProseText(value) {
  const text = String(value ?? '');
  // 数据源中已经明确给出的字面量换行优先保留，避免破坏教材语义上的分句。
  if (text.includes('\\n')) {
    return text.replace(/(?:\\n)+/g, '\\n').replace(/(?:\\n)+$/g, '');
  }
  // 没有显式换行时，按句末标点补充字面量换行；保留中文引号、括号等闭合标点。
  return text
    .replace(/([。！？；])([”’」』）】]*)/g, '$1$2\\n')
    .replace(/(?:\\n)+$/g, '');
}
const prose = (title, author, paragraphs, translations, opts = {}) => {
  const join = rows => {
    const formatted = rows.map(formatProseText);
    return opts.noParagraphs ? formatted.join('\\n') : formatted.join('##');
  };
  return add(title, author, 2, join(paragraphs), join(translations), opts.annotation || '', opts.emphasis || [], opts.intro || '', opts.appreciation || '', opts);
};
const simpleIntro = (author, dynasty) => `${author}，${dynasty || '中国古代'}作家。其作品题材鲜明、语言凝练，在中国文学史上具有重要地位。`;
const simpleApp = (title) => `《${title}》围绕核心意象组织内容，融写景、叙事与抒情于一体。作品语言凝练，情感真挚，适合从意象、炼字和表现手法三个角度理解。`;
const A = (annotation, emphasis, intro, appreciation, extra = {}) => ({ annotation, emphasis, intro, appreciation, ...extra });
require('./yuwen_content_more')({ poem, prose, A });
require('./yuwen_prose')({ poem, prose, A });
require('./yuwen_lunyu')({ poem, prose, A });
require('./yuwen_junior2')({ poem, prose, A });
require('./yuwen_high')({ poem, prose, A });
require('./yuwen_high2')({ poem, prose, A });
require('./yuwen_high3')({ poem, prose, A });
require('./yuwen_missing_poems')({ poem, prose, A });

const fixedCatalogIds = {
  [`${VERSIONS.liusan.id}|七年级上册|第一单元|观沧海`]: 910001,
  [`${VERSIONS.wusi.id}|七年级上册|第一单元|观沧海`]: 910002,
  [`${VERSIONS.high.id}|高中必修上册|第三单元（课内）|短歌行`]: 910003,
  [`${VERSIONS.wusi.id}|六年级上册|第一单元|宿建德江`]: 910004,
  [`${VERSIONS.high.id}|高中选择性必修下册|第三单元（课内）|陈情表`]: 910005
};
let nextCatalogId = 910006;
const catalogs = [];
const starred = new Set([
  '观沧海','咏雪','陈太丘与友期行','论语十二章','诫子书','狼',
  '孙权劝学','木兰诗','陋室铭','爱莲说','登幽州台歌','望岳','登飞来峰','游山西村','己亥杂诗（其五）','卖油翁',
  '沁园春·长沙','短歌行','归园田居（其一）','梦游天姥吟留别','登高','琵琶行并序','念奴娇·赤壁怀古','永遇乐·京口北固亭怀古','声声慢（寻寻觅觅）',
  '劝学','师说','赤壁赋','登泰山记','静女','涉江采芙蓉','虞美人','鹊桥仙（纤云弄巧）',
  '子路、曾皙、冉有、公西华侍坐','谏逐客书','谏太宗十思疏','阿房宫赋','六国论','登岳阳楼','桂枝香·金陵怀古','念奴娇·过洞庭'
]);
function mount(versionKey, volumeName, unitName, titles, kind = '') {
  const version = VERSIONS[versionKey];
  const fullUnitName = kind ? `${unitName}（${kind}）` : unitName;
  const vId = volumeId(version.name, volumeName);
  const uId = unitId(version.name, volumeName, fullUnitName);
  titles.forEach((title, index) => {
    const p = byTitle.get(title);
    if (!p) throw new Error(`目录引用了未定义篇目：${title}`);
    const key = `${version.id}|${volumeName}|${fullUnitName}|${title}`;
    const id = fixedCatalogIds[key] || nextCatalogId++;
    const row = { id, versionId: version.id, versionName: version.name, volumeId: vId, volumeName, unitId: uId, unitName: fullUnitName, poemId: p.id, sort: index + 1, starred: starred.has(title) };
    catalogs.push(row);
    if (row.starred) p.extraJson.required_catalogs.push(id);
  });
}

const junior7up = (v) => {
  mount(v, '七年级上册', '第一单元', ['观沧海','闻王昌龄左迁龙标遥有此寄','次北固山下','天净沙·秋思']);
  mount(v, '七年级上册', '第二单元', ['咏雪','陈太丘与友期行'], '课内');
  mount(v, '七年级上册', '第三单元', ['论语十二章'], '课内');
  mount(v, '七年级上册', '第三单元', ['峨眉山月歌','江南逢李龟年','行军九日思长安故园','夜上受降城闻笛'], '课外古诗词诵读');
  mount(v, '七年级上册', '第四单元', ['诫子书'], '课内');
  mount(v, '七年级上册', '第五单元', ['狼'], '课内');
  mount(v, '七年级上册', '第六单元', ['穿井得一人','杞人忧天'], '课内');
  mount(v, '七年级上册', '第六单元', ['秋词（其一）','夜雨寄北','十一月四日风雨大作（其二）','潼关'], '课外古诗词诵读');
};
const junior7down = (v) => {
  mount(v, '七年级下册', '第三单元', ['孙权劝学','木兰诗'], '课内');
  mount(v, '七年级下册', '第三单元', ['竹里馆','春夜洛城闻笛','逢入京使','晚春'], '课外古诗词诵读');
  mount(v, '七年级下册', '第四单元', ['陋室铭','爱莲说'], '课内');
  mount(v, '七年级下册', '第五单元', ['登幽州台歌','望岳','登飞来峰','游山西村','己亥杂诗（其五）'], '课内');
  mount(v, '七年级下册', '第六单元', ['卖油翁'], '课内');
  mount(v, '七年级下册', '第六单元', ['泊秦淮','贾生','过松源晨炊漆公店（其五）','约客'], '课外古诗词诵读');
};
function buildCatalogs() {
junior7up('liusan'); junior7down('liusan'); junior7up('wusi'); junior7down('wusi');
mount('wusi', '六年级上册', '第一单元', ['宿建德江','六月二十七日望湖楼醉书','西江月·夜行黄沙道中']);
mount('wusi', '六年级上册', '第二单元', ['七律·长征']);
mount('wusi', '六年级上册', '第三单元', ['浪淘沙（其一）','江南春','书湖阴先生壁']);
mount('wusi', '六年级上册', '第七单元', ['伯牙鼓琴','书戴嵩画牛']);
mount('wusi', '六年级上册', '第七单元', ['过故人庄','送元二使安西','江畔独步寻花（其五）','春日'], '课外古诗词诵读');
mount('wusi', '六年级下册', '第一单元', ['寒食','迢迢牵牛星','十五夜望月']);
mount('wusi', '六年级下册', '第三单元', ['马诗','石灰吟','竹石']);
mount('wusi', '六年级下册', '第五单元', ['学弈','两小儿辩日']);
mount('wusi', '六年级下册', '第五单元', ['江上渔者','泊船瓜洲','游园不值','卜算子·送鲍浩然之浙东','浣溪沙','清平乐'], '课外古诗词诵读');

mount('high', '高中必修上册', '第一单元', ['沁园春·长沙','芣苢','插秧歌'], '课内');
mount('high', '高中必修上册', '第三单元', ['短歌行','归园田居（其一）','梦游天姥吟留别','登高','琵琶行并序','念奴娇·赤壁怀古','永遇乐·京口北固亭怀古','声声慢（寻寻觅觅）'], '课内');
mount('high', '高中必修上册', '第五单元', ['劝学','师说'], '课内');
mount('high', '高中必修上册', '第七单元', ['赤壁赋','登泰山记'], '课内');
mount('high', '高中必修上册', '第八单元', ['静女','涉江采芙蓉','虞美人','鹊桥仙（纤云弄巧）'], '古诗词诵读');
mount('high', '高中必修下册', '第一单元', ['子路、曾皙、冉有、公西华侍坐','烛之武退秦师','庖丁解牛'], '课内');
mount('high', '高中必修下册', '第四单元', ['谏逐客书'], '课内');
mount('high', '高中必修下册', '第七单元', ['谏太宗十思疏','答司马谏议书'], '课内');
mount('high', '高中必修下册', '第八单元', ['阿房宫赋','六国论'], '课内');
mount('high', '高中必修下册', '第八单元', ['登岳阳楼','桂枝香·金陵怀古','念奴娇·过洞庭','游园（皂罗袍）'], '古诗词诵读');
mount('high', '高中选择性必修下册', '第三单元', ['陈情表'], '课内');
}

function sqlQuote(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}
function poemSqlRow(p) {
  return `(${p.id}, ${sqlQuote(p.title)}, ${sqlQuote(p.author)}, ${p.genre}, ${sqlQuote(p.content)}, ${sqlQuote(p.translation)}, NULL, ${sqlQuote(p.annotation)}, ${sqlQuote(p.authorIntro)}, ${sqlQuote(p.appreciation)}, ${sqlQuote(JSON.stringify(p.extraJson))}, 0, 0)`;
}
function catalogSqlRow(row) {
  return `(${row.id}, ${sqlQuote(row.versionId)}, ${sqlQuote(row.versionName)}, ${sqlQuote(row.volumeId)}, ${sqlQuote(row.volumeName)}, ${sqlQuote(row.unitId)}, ${sqlQuote(row.unitName)}, ${row.poemId}, ${row.sort}, 0, 0)`;
}
function questionSqlRow(row, id) {
  return `(${id}, ${row.poemId}, ${row.sort}, ${sqlQuote(row.stem)}, 0, 0)`;
}
function renderSql() {
  const poemColumns = '`id`, `title`, `author`, `genre`, `content`, `translation`, `pinyin`, `annotation`, `author_intro`, `appreciation`, `extra_json`, `status`, `is_del`';
  const poemUpdates = ['title','author','genre','content','translation','pinyin','annotation','author_intro','appreciation','extra_json','status','is_del'].map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(',\n');
  /*
  const poemSql = `-- 语文积累本：篇目详情（完整教材目录内容）\n-- 内容中的 \\n 为字面量换行标识，执行后字段保存反斜杠+n；## 为教材原文段落标识。\n-- pinyin 按本次约定统一留空。重点字使用 <b>...</b>。\n\nSTART TRANSACTION;\n\nINSERT INTO \\`edu_chn_poem\\`\n(${poemColumns})\nVALUES\n${poems.map(poemSqlRow).join(',\n')}\nON DUPLICATE KEY UPDATE\n${poemUpdates};\n\nCOMMIT;\n`;
  const poemSql = ['-- 语文积累本：篇目详情（完整教材目录内容）', '-- 内容中的 \n 为字面量换行标识，执行后字段保存反斜杠+n；## 为教材原文段落标识。', '-- pinyin 按本次约定统一留空。重点字使用 <b>...</b>。', '', 'START TRANSACTION;', '', 'INSERT INTO `edu_chn_poem`', '(' + poemColumns + ')', 'VALUES'].join('\n') + '\n' + poems.map(poemSqlRow).join(',\n') + '\nON DUPLICATE KEY UPDATE\n' + poemUpdates + ';\n\nCOMMIT;\n';
  const catalogSql = ['-- 语文积累本：版本/分册/单元挂载（完整目录关系）', '-- volume_id = MD5(版本名称 + "|" + 分册名称)。', '-- unit_id = MD5(版本名称 + "|" + 分册名称 + "|" + 单元名称)。', '-- “全部篇目”不落表；课内与课外诵读使用不同 unit_name / unit_id。', '', 'START TRANSACTION;', '', 'INSERT INTO `edu_chn_poem_catalog`', '(' + catalogColumns + ')', 'VALUES'].join('\n') + '\n' + catalogs.map(catalogSqlRow).join(',\n') + '\nON DUPLICATE KEY UPDATE\n' + catalogUpdates + ';\n\nCOMMIT;\n';
  const catalogSql = `-- 语文积累本：版本/分册/单元挂载（完整目录关系）\n-- volume_id = MD5(版本名称 + "|" + 分册名称)。\n-- unit_id = MD5(版本名称 + "|" + 分册名称 + "|" + 单元名称)。\n-- “全部篇目”不落表；课内与课外诵读使用不同 unit_name / unit_id。\n\nSTART TRANSACTION;\n\nINSERT INTO \\`edu_chn_poem_catalog\\`\n(${catalogColumns})\nVALUES\n${catalogs.map(catalogSqlRow).join(',\n')}\nON DUPLICATE KEY UPDATE\n${catalogUpdates};\n\nCOMMIT;\n`;
  */
  const catalogColumns = '`id`, `version_id`, `version_name`, `volume_id`, `volume_name`, `unit_id`, `unit_name`, `poem_id`, `sort`, `status`, `is_del`';
  const catalogUpdates = ['version_id','version_name','volume_id','volume_name','unit_id','unit_name','poem_id','sort','status','is_del'].map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(',\n');
  const poemSql = ['-- 语文积累本：篇目详情（完整教材目录内容）', '-- 内容中的字面量换行标识，执行后字段保存反斜杠+n；##为教材原文段落标识。', '-- pinyin 按本次约定统一留空。重点字使用 <b>...</b>。', '', 'START TRANSACTION;', '', 'INSERT INTO `edu_chn_poem`', '(' + poemColumns + ')', 'VALUES'].join(String.fromCharCode(10)) + String.fromCharCode(10) + poems.map(poemSqlRow).join(',' + String.fromCharCode(10)) + String.fromCharCode(10) + 'ON DUPLICATE KEY UPDATE' + String.fromCharCode(10) + poemUpdates + ';' + String.fromCharCode(10) + String.fromCharCode(10) + 'COMMIT;' + String.fromCharCode(10);
  const catalogSql = ['-- 语文积累本：版本/分册/单元挂载（完整目录关系）', '-- volume_id = MD5(版本名称 + "|" + 分册名称)。', '-- unit_id = MD5(版本名称 + "|" + 分册名称 + "|" + 单元名称)。', '-- “全部篇目”不落表；课内与课外诵读使用不同 unit_name / unit_id。', '', 'START TRANSACTION;', '', 'INSERT INTO `edu_chn_poem_catalog`', '(' + catalogColumns + ')', 'VALUES'].join(String.fromCharCode(10)) + String.fromCharCode(10) + catalogs.map(catalogSqlRow).join(',' + String.fromCharCode(10)) + String.fromCharCode(10) + 'ON DUPLICATE KEY UPDATE' + String.fromCharCode(10) + catalogUpdates + ';' + String.fromCharCode(10) + String.fromCharCode(10) + 'COMMIT;' + String.fromCharCode(10);
  const questionColumns = '`id`, `poem_id`, `sort`, `stem`, `status`, `is_del`';
  const questionUpdates = ['poem_id','sort','stem','status','is_del'].map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(',\n');
  const questionDdl = 'CREATE TABLE IF NOT EXISTS `edu_chn_poem_question` (\n`id` int(10) NOT NULL AUTO_INCREMENT COMMENT \'题目ID\',\n`poem_id` int(10) NOT NULL COMMENT \'篇目ID，关联 edu_chn_poem.id\',\n`sort` int(10) NOT NULL DEFAULT 0 COMMENT \'候选顺序，取完循环\',\n`stem` TEXT NOT NULL COMMENT \'题干（含挖空和答案）\',\n`status` tinyint(2) NOT NULL DEFAULT 0 COMMENT \'0=草稿，1=上架\',\n`is_del` tinyint(2) NOT NULL DEFAULT 0 COMMENT \'0=未删除，1=已删除\',\n`create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'创建时间\',\n`update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT \'更新时间\',\nPRIMARY KEY (`id`),\nKEY `idx_poem` (`poem_id`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT=\'语文积累本-篇目理解性默写题\';\n';
  const questionSql = questionDdl + ['-- stem 中使用 ##答案## 标记挖空位置，当前 SQL 直接填入答案，便于审核。', '', 'START TRANSACTION;', '', 'INSERT INTO `edu_chn_poem_question`', '(' + questionColumns + ')', 'VALUES'].join(String.fromCharCode(10)) + String.fromCharCode(10) + questions.map((row, index) => questionSqlRow(row, 920001 + index)).join(',' + String.fromCharCode(10)) + String.fromCharCode(10) + 'ON DUPLICATE KEY UPDATE' + String.fromCharCode(10) + questionUpdates + ';' + String.fromCharCode(10) + String.fromCharCode(10) + 'COMMIT;' + String.fromCharCode(10);
  fs.mkdirSync(SQL_DIR, { recursive: true });
  fs.writeFileSync(path.join(SQL_DIR, 'edu_chn_poem_demo.sql'), poemSql);
  fs.writeFileSync(path.join(SQL_DIR, 'edu_chn_poem_catalog_demo.sql'), catalogSql);
  fs.writeFileSync(path.join(SQL_DIR, 'edu_chn_poem_question_demo.sql'), questionSql);
}

function renderPreview() {
  const html = fs.readFileSync(PREVIEW, 'utf8');
  const scriptStart = html.indexOf('  <script>');
  const scriptEnd = html.indexOf('  </script>', scriptStart);
  if (scriptStart < 0 || scriptEnd < 0) throw new Error('预览页脚本边界未找到');
  const previewPoems = poems.map(p => ({ ...p, genre: p.genre === 1 ? '古诗' : '文言文', extraJson: p.extraJson }));
  const scriptTail = html.slice(scriptStart + '  <script>'.length, scriptEnd);
  const stateStart = scriptTail.indexOf('    const state=');
  if (stateStart < 0) throw new Error('预览页状态脚本未找到');
  const logic = scriptTail.slice(stateStart);
  const prefix = `\n    const poems = ${JSON.stringify(previewPoems)};\n    const catalogs = ${JSON.stringify(catalogs)};\n    const questions = ${JSON.stringify(questions)};\n`;
  const newHtml = (html.slice(0, scriptStart) + '  <script>' + prefix + logic + '  </script>' + html.slice(scriptEnd + '  </script>'.length)).replace('.tablet{width:min(1440px,100%)', '.tablet{width:100%');
  fs.writeFileSync(PREVIEW, newHtml);
}

function validate() {
  if (poems.length < 90) throw new Error(`篇目数量异常：${poems.length}`);
  if (catalogs.length < 120) throw new Error(`挂载数量异常：${catalogs.length}`);
  if (questions.length !== poems.length * 10) throw new Error(`题目数量异常：${questions.length}；各篇目：${JSON.stringify(Object.fromEntries(poems.map(p => [p.title, questions.filter(q => q.poemId === p.id).length]).filter(([, count]) => count !== 10)))}`);
  if (questions.some(q => !poems.some(p => p.id === q.poemId))) throw new Error('存在孤儿题目');
  if (questions.some(q => q.sort < 1 || q.sort > 10 || !q.stem.includes('##'))) throw new Error('题目格式或排序异常');
  if (new Set(questions.map(q => `${q.poemId}|${q.sort}`)).size !== questions.length) throw new Error('题目排序重复');
  const unique = key => new Set(key.map(String)).size === key.length;
  if (!unique(poems.map(p => p.id))) throw new Error('poem_id 重复');
  if (!unique(catalogs.map(c => c.id))) throw new Error('catalog id 重复');
  const volumePairs = new Set(catalogs.map(c => `${c.versionId}|${c.volumeName}`));
  const unitPairs = new Set(catalogs.map(c => `${c.versionId}|${c.volumeName}|${c.unitName}`));
  if (volumePairs.size !== new Set(catalogs.map(c => c.volumeId)).size) throw new Error('volume_id 生成不唯一');
  if (unitPairs.size !== new Set(catalogs.map(c => c.unitId)).size) throw new Error('unit_id 生成不唯一');
  if (catalogs.some(c => !poems.some(p => p.id === c.poemId))) throw new Error('存在孤儿挂载');
  for (const p of poems) {
    if (p.pinyin !== null) throw new Error(`${p.title} pinyin 非 NULL`);
    const contentParts = p.content.split('##');
    const translationParts = p.translation.split('##');
    if (contentParts.length !== translationParts.length) throw new Error(`${p.title} 原文/译文段落数不一致`);
    if (p.genre === 1) {
      const lines = p.content.split('\\n').filter(Boolean);
      const trans = p.translation.split('\\n').filter(Boolean);
      if (lines.length !== trans.length) throw new Error(`${p.title} 古诗原文/译文行数不一致：${lines.length}/${trans.length}`);
    }
    if (/\uFFFD/.test(JSON.stringify(p))) throw new Error(`${p.title} 存在乱码替换字符`);
  }
  console.log(JSON.stringify({ poems: poems.length, catalogs: catalogs.length, volumes: new Set(catalogs.map(c => c.volumeId)).size, units: new Set(catalogs.map(c => c.unitId)).size }, null, 2));
}

// 内容定义位于本文件后半段，统一在文件末尾执行构建。

// 初中诗歌
poem('观沧海', '曹操', ['东临<b>碣石</b>，以观沧海。','水何<b>澹澹</b>，山岛<b>竦峙</b>。','树木丛生，百草丰茂。','秋风<b>萧瑟</b>，<b>洪波</b>涌起。','日月之行，若出其中；','星汉灿烂，若出其里。','幸甚至哉，歌以咏志。'], ['向东登上碣石山，来观赏大海。','海水多么宽阔浩荡，山岛高高地耸立着。','树木郁郁葱葱，百草丰美茂盛。','秋风吹过树木发出悲凉的声音，巨大的波浪涌起。','日月的运行，好像都出自大海之中。','银河星光灿烂，好像都从大海里升起。','庆幸得很，好极了！就用这首歌来表达自己的志向。'], A('碣石：山名。\n澹澹：水波荡漾的样子。\n竦峙：耸立。\n萧瑟：树木被秋风吹拂的声音。\n洪波：巨大的波浪。\n星汉：银河。\n幸甚至哉：庆幸得很，好极了。',['碣石','澹澹','竦峙','萧瑟','洪波'],'曹操（155—220），字孟德，东汉末年政治家、军事家、文学家，三国时期曹魏政权的奠基者。','全诗借大海的壮阔景象抒发建功立业的抱负。“日月之行，若出其中；星汉灿烂，若出其里”运用想象和夸张，表现诗人开阔的胸襟和宏大的政治抱负。',{dynasty:'东汉'}));
poem('闻王昌龄左迁龙标遥有此寄', '李白', ['杨花落尽子规啼，闻道龙标过五溪。','我寄愁心与明月，随君直到夜郎西。'], ['杨花落尽，杜鹃鸟声声哀啼，我听说你被贬为龙标尉，要经过五溪。','我把忧愁的心思寄托给明月，希望它伴随你一直到夜郎以西。'], A('龙标：指王昌龄，古代官职或任所称谓。\n子规：杜鹃鸟。\n五溪：地名。\n夜郎：古代地名。',['子规','龙标','夜郎'],'李白（701—762），字太白，号青莲居士，唐代浪漫主义诗人。','诗人借明月寄托对友人的关切，把无形的愁心化为可传递的情感，想象奇特，情真意切。',{dynasty:'唐'}));
poem('次北固山下', '王湾', ['客路青山外，行舟绿水前。','潮平两岸阔，风正一帆悬。','海日生残夜，江春入旧年。','乡书何处达？归雁洛阳边。'], ['旅途行驶在青山之外，船行在碧绿的江水之上。','潮水上涨，两岸之间更加开阔；风势正顺，一面白帆高高悬挂。','海上的太阳在残夜将尽时升起，江南的春意在旧年未尽时已经到来。','寄出去的家书不知道什么时候到达？希望北归的大雁捎到洛阳。'], A('次：停宿。\n客路：旅途。\n潮平：潮水涨满。\n海日：海上的太阳。\n乡书：家信。',['悬','海日','乡书'],'王湾，唐代诗人。','诗中以行舟为线索，写江南春早和旅途所见；“海日生残夜，江春入旧年”以新旧交替寄寓积极向上的情思，末句转入思乡。',{dynasty:'唐'}));
poem('天净沙·秋思', '马致远', ['枯藤老树昏鸦，小桥流水人家，古道西风瘦马。','夕阳西下，断肠人在天涯。'], ['枯藤缠绕着老树，树上栖息着黄昏时的乌鸦；小桥下流水潺潺，旁边有几户人家；古道上秋风萧瑟，一匹瘦马驮着游子前行。','夕阳已经向西落下，悲痛欲绝的旅人还漂泊在天涯。'], A('昏鸦：黄昏时的乌鸦。\n断肠：形容悲痛到极点。\n天涯：指远离家乡的地方。',['枯藤','昏鸦','断肠'],'马致远（约1251—1321以后），号东篱，元代戏曲作家、散曲家。','作品用白描手法连缀九种景物，营造萧瑟苍凉的秋景，最后以“断肠人”点明游子思乡之情，意境深远。',{dynasty:'元'}));
poem('峨眉山月歌', '李白', ['峨眉山月半轮秋，影入平羌江水流。','夜发清溪向三峡，思君不见下渝州。'], ['半轮明月高悬在峨眉山上，月影倒映在平羌江水中随波流动。','夜间乘船从清溪出发驶向三峡，想念你却难以相见，只能顺流而下到渝州。'], A('峨眉山：在今四川峨眉山市。\n平羌：青衣江的古称。\n发：出发。\n渝州：今重庆一带。',['峨眉','平羌','渝州'],'李白，唐代浪漫主义诗人。','全诗五个地名随行舟展开，月亮既是眼前景，也是思念的寄托，构成清朗而悠远的意境。',{dynasty:'唐'}));
poem('江南逢李龟年', '杜甫', ['岐王宅里寻常见，崔九堂前几度闻。','正是江南好风景，落花时节又逢君。'], ['过去常在岐王宅里见到你，也多次在崔九堂前听到你的歌声。','现在正是江南风景最好的时候，却在落花时节又遇见了你。'], A('岐王：唐玄宗李隆范。\n崔九：崔涤，排行第九。\n落花时节：暮春，亦含身世飘零之意。',['岐王','崔九','落花时节'],'杜甫（712—770），字子美，唐代现实主义诗人。','前两句追忆昔日相逢，后两句写今日重逢，以江南暮春的落花寄托对国事凋零、个人身世飘零的感慨。',{dynasty:'唐'}));
poem('行军九日思长安故园', '岑参', ['强欲登高去，无人送酒来。','遥怜故园菊，应傍战场开。'], ['勉强想要登高远望，却没有人送酒来。','远方怜惜故乡的菊花，它们大概正靠近战场开放。'], A('强：勉强。\n登高：重阳节习俗。\n故园：故乡。\n傍：靠近。',['强','遥怜','傍'],'岑参（约715—770），唐代边塞诗人。','诗人重阳登高而无人送酒，转而遥想故园菊花在战乱中开放，以想象写思乡忧国之情。',{dynasty:'唐'}));
poem('夜上受降城闻笛', '李益', ['回乐烽前沙似雪，受降城外月如霜。','不知何处吹芦管，一夜征人尽望乡。'], ['回乐烽前的沙地洁白得像雪，受降城外的月光有如秋霜。','不知道哪里吹响了芦笛，一夜之间出征的将士都在思念故乡。'], A('回乐烽：烽火台名。\n受降城：古城名。\n芦管：笛子。\n征人：出征的将士。',['烽','芦管','征人'],'李益（约748—829），唐代边塞诗人。','前两句营造空旷寒冷的边塞月夜，后两句写笛声触发征人思乡，以声传情，含蓄深沉。',{dynasty:'唐'}));
poem('秋词（其一）', '刘禹锡', ['自古逢秋悲寂寥，我言秋日胜春朝。','晴空一鹤排云上，便引诗情到碧霄。'], ['自古以来人们每逢秋天都悲叹萧条寂寥，我却认为秋天胜过明丽的春天。','一只白鹤推开云层直冲云霄，也引发我的诗兴飞到万里晴空。'], A('寂寥：空旷冷落。\n春朝：春天的早晨，泛指春日。\n排云：推开云层。\n碧霄：蓝天。',['寂寥','排云','碧霄'],'刘禹锡（772—842），字梦得，唐代文学家、哲学家。','诗人一反悲秋传统，以鹤冲云天的形象表达奋发进取、乐观旷达的精神。',{dynasty:'唐'}));
poem('夜雨寄北', '李商隐', ['君问归期未有期，巴山夜雨涨秋池。','何当共剪西窗烛，却话巴山夜雨时。'], ['你问我回家的日期，我还没有确定；此时巴山夜里下着大雨，秋池都涨满了。','什么时候我们才能共同在西窗下剪烛夜谈，再回忆起巴山夜雨的情景呢？'], A('寄北：写诗寄给北方的妻子或友人。\n何当：什么时候能够。\n共剪西窗烛：指亲友相聚夜谈。',['归期','巴山','剪烛'],'李商隐（约813—约858），字义山，晚唐诗人。','以“巴山夜雨”统摄今昔，眼前的羁旅愁苦与未来团聚的想象相互映照，构思新巧，情深意长。',{dynasty:'唐'}));
poem('十一月四日风雨大作（其二）', '陆游', ['僵卧孤村不自哀，尚思为国戍轮台。','夜阑卧听风吹雨，铁马冰河入梦来。'], ['我直挺挺地躺在孤寂的乡村里，并不为自己的处境悲哀，还在想着替国家守卫边疆。','夜将尽时我躺在床上听着风雨声，梦见自己骑着披甲的战马跨过冰封的河流。'], A('僵卧：直挺挺地躺着。\n戍：守卫。\n轮台：古代边疆地名。\n夜阑：夜深。\n铁马：披着铁甲的战马。',['僵卧','戍','夜阑','铁马'],'陆游（1125—1210），字务观，号放翁，南宋爱国诗人。','诗人虽年老闲居，仍心系国事；“铁马冰河入梦来”把现实风雨与杀敌报国的梦境融为一体，表现强烈的爱国情怀。',{dynasty:'南宋'}));
poem('潼关', '谭嗣同', ['终古高云簇此城，秋风吹散马蹄声。','河流大野犹嫌束，山入潼关不解平。'], ['自古以来高云聚集在这座雄关之上，秋风把马蹄声吹散。','黄河奔向辽阔的原野还嫌受到约束，群山进入潼关也不知什么叫平坦。'], A('潼关：关名，在今陕西潼关。\n终古：久远。\n簇：聚集。\n束：约束。',['簇','潼关','束'],'谭嗣同（1865—1898），字复生，号壮飞，近代维新派政治家、思想家。','诗人用高云、秋风、河流和群山写潼关的雄奇险峻，借“犹嫌束”“不解平”表现冲决罗网、追��解放的少年气概。',{dynasty:'清'}));
const chenqing = byTitle.get('陈情表');
chenqing.content = [
  '臣密言：臣以险衅，夙遭闵凶；生孩六月，慈父见背；行年四岁，舅夺母志。祖母刘愍臣孤弱，躬亲抚养。臣少多疾病，九岁不行；零丁孤苦，至于成立。既无伯叔，终鲜兄弟；门衰祚薄，晚有儿息。外无期功强近之亲；内无应门五尺之僮；茕茕孑立，形影相吊。',
  '逮奉圣朝，沐浴清化。前太守臣逵察臣孝廉；后刺史臣荣举臣秀才。诏书特下，拜臣郎中；寻蒙国恩，除臣洗马。猥以微贱，当侍东宫，非臣陨首所能上报。',
  '且臣少仕伪朝，历职郎署，本图宦达，不矜名节。今臣亡国贱俘，至微至陋，过蒙拔擢，宠命优渥，岂敢盘桓，有所希冀！但以刘日薄西山，气息奄奄，人命危浅，朝不虑夕。今臣欲奉诏奔驰，则刘病日笃；欲苟顺私情，则告诉不许：是以区区不能废远。',
  '今臣以弱冠，非臣陨首所能上报。祖母刘夙婴疾病，常在床蓐；臣侍汤药，未曾废离。愿陛下矜悯愚诚，听臣微志，庶刘侥幸，保卒余年。臣生当陨首，死当结草。臣不胜犬马怖惧之情，谨拜表以闻。'
].map(formatProseText).join('##');
chenqing.translation = [
  '臣李密上言：我因为命运不好，早年遭遇不幸；出生六个月，父亲就去世了；四岁时，舅舅强行改变了母亲守节的志向。祖母刘氏怜悯我孤弱，亲自抚养我。我年少时多病，九岁还不会走；孤苦伶仃，直到成人自立。既没有伯叔，也没有兄弟；门庭衰微、福分浅薄，很晚才有儿子。外面没有关系近的亲戚，家里没有照应门户的童仆，孤单无依，只有身体和影子相互安慰。',
  '等到奉行晋朝的圣旨，受到清明教化。先前太守臣逵考察并推荐我为孝廉，后来刺史臣荣举荐我为秀才。诏书特地下达，任命我为郎中；不久又蒙受国恩，任命我为太子洗马。凭我这样卑微的身份担任侍奉太子的职务，不是杀身捐躯所能报答的。',
  '况且我年轻时曾在蜀汉做官，历任郎官，本来希望取得显达的官位，并不看重名誉和节操。如今我是亡国的俘虏，身份极其卑微，却过分受到提拔，恩宠优厚，哪里敢徘徊观望，有什么别的企求呢？只是祖母刘氏已经像夕阳迫近西山，气息微弱，生命垂危，早晚难以预料。我现在想奉诏急速前往，祖母的病却一天比一天严重；想要姑且顺从自己的私情，但申诉又不被允许，因此内心实在不能废弃祖母而远行。',
  '如今我已成年，祖母刘氏早被疾病缠绕，常年卧病在床；我侍奉汤药，从未离开过她。希望陛下怜悯我愚拙诚心，听任我微小的愿望，使祖母能够侥幸保全余年。我活着应当杀身报恩，死后也要结草报恩。我怀着犬马一样惶恐不安的心情，恭敬地呈上此表让您知道。'
].map(formatProseText).join('##');
chenqing.content = applyEmphasis(chenqing.content, chenqing.extraJson.emphasis_words);
chenqing.extraJson.paragraph_count = 4;
const questions = require('./yuwen_questions')({ poems });
buildCatalogs();
validate();
renderSql();
renderPreview();
