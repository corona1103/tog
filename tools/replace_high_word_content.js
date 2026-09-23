const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { formatMeaning } = require('./word_meaning');
const { buildQuestions } = require('./word_question_options');
const externalExamples = require('./yuwen_word_external_examples');

const ROOT = path.resolve(__dirname, '..');
const SQL_DIR = path.join(ROOT, 'sql');
const VERSION = { id: '00b6bf17df4345109f570bf0273705f3', name: '部编版' };
const md5 = value => crypto.createHash('md5').update(value).digest('hex');
const volumeId = volume => md5(`${VERSION.name}|${volume}`);

const pinyin = {
  劝: 'quàn', 疾: 'jí', 彰: 'zhāng', 假: 'jiǎ', 绝: 'jué', 积: 'jī', 锲: 'qiè', 舍: 'shě', 兴: 'xīng', 望: 'wàng', 知: 'zhì',
  而: 'ér', 于: 'yú', 之: 'zhī', 者: 'zhě', 也: 'yě', 师: 'shī', 惑: 'huò', 传: 'chuán', 从: 'cóng', 贤: 'xián', 益: 'yì', 穷: 'qióng', 通: 'tōng', 达: 'dá', 其: 'qí', 乎: 'hū', 所: 'suǒ', 则: 'zé',
  逝: 'shì', 盈: 'yíng', 虚: 'xū', 取: 'qǔ', 如: 'rú', 适: 'shì', 焉: 'yān',
  历: 'lì', 抵: 'dǐ', 极: 'jí', 始: 'shǐ', 行: 'xíng', 道: 'dào', 以: 'yǐ',
  率: 'shuài', 方: 'fāng', 冠: 'guàn', 让: 'ràng', 得: 'dé', 安: 'ān', 保: 'bǎo', 辟: 'pì', 举: 'jǔ', 度: 'duó', 治: 'zhì', 爱: 'ài', 诚: 'chéng', 故: 'gù', 何: 'hé',
  解: 'jiě', 中: 'zhòng', 族: 'zú', 发: 'fā', 养: 'yǎng', 技: 'jì', 经: 'jīng',
  退: 'tuì', 辞: 'cí', 鄙: 'bǐ', 济: 'jì', 阙: 'quē', 图: 'tú', 亡: 'wáng', 及: 'jí', 夫: 'fū', 与: 'yǔ',
  军: 'jūn', 倍: 'bèi', 谢: 'xiè', 坐: 'zuò', 胜: 'shèng', 数: 'shuò', 王: 'wàng', 为: 'wéi', 乃: 'nǎi',
  逐: 'zhú', 广: 'guǎng', 纳: 'nà', 任: 'rèn', 施: 'shī', 因: 'yīn',
  征: 'zhēng', 岁: 'suì', 业: 'yè', 累: 'lěi', 窥: 'kuī', 捷: 'jié', 索: 'suǒ', 遂: 'suì', 顾: 'gù', 闻: 'wén',
  固: 'gù', 崇: 'chóng', 戒: 'jiè', 求: 'qiú', 终: 'zhōng',
  辩: 'biàn', 执: 'zhí', 事: 'shì', 理: 'lǐ',
  毕: 'bì', 覆: 'fù', 鉴: 'jiàn', 尽: 'jìn', 奢: 'shē', 藏: 'cáng', 弊: 'bì', 赂: 'lù', 亏: 'kuī', 殆: 'dài', 弥: 'mí', 愈: 'yù', 继: 'jì', 且: 'qiě',
};

const d = (word, meaning, occurrence = 0) => ({ word, meaning, occurrence });
const chapter = (volume, unit, title, real, virtual) => ({ volume, unit, title, real, virtual });
const chapters = [
  chapter('高中必修上册', '第五单元（课内）', '劝学',
    [d('劝', '勉励，鼓励'), d('疾', '快，速'), d('彰', '明显，清楚'), d('假', '借助，利用'), d('绝', '横渡'), d('积', '堆积，积累'), d('锲', '刻，雕刻'), d('舍', '停止，放弃'), d('兴', '兴起'), d('望', '远看'), d('知', '同“智”，智慧')],
    [d('而', '表转折，却'), d('于', '介词，从', 0), d('之', '代词，它，指青'), d('者', '……的人'), d('也', '表判断，是')]),
  chapter('高中必修上册', '第五单元（课内）', '师说',
    [d('师', '以……为师，意动用法'), d('惑', '疑惑，疑难问题'), d('传', '传授的知识'), d('从', '跟随'), d('贤', '超过，胜过'), d('益', '更加'), d('穷', '困窘，处境困难'), d('通', '通晓，明白'), d('达', '通达，得志')],
    [d('之', '助词，的'), d('其', '代词，他的'), d('而', '表转折，却'), d('于', '介词，向、对'), d('乎', '表反问，吗'), d('所', '与“以”组成“所以”，表示用来……的'), d('则', '表转折，却')]),
  chapter('高中必修上册', '第七单元（课内）', '赤壁赋',
    [d('逝', '流逝'), d('盈', '满'), d('虚', '空'), d('取', '取得，获得'), d('望', '农历每月十五日'), d('如', '往，去'), d('绝', '断，断绝'), d('适', '恰好')],
    [d('之', '助词，的'), d('其', '代词，它，指月亮'), d('而', '表转折，却'), d('于', '介词，在'), d('乎', '表疑问，吗'), d('焉', '兼词，于之，在那里')]),
  chapter('高中必修上册', '第七单元（课内）', '登泰山记',
    [d('历', '经过'), d('抵', '到达'), d('极', '尽头'), d('望', '远看'), d('始', '开始'), d('行', '行走'), d('道', '道路')],
    [d('之', '助词，的'), d('其', '代词，它，指泰山'), d('而', '表修饰'), d('以', '介词，在'), d('于', '介词，在')]),
  chapter('高中必修下册', '第一单元（课内）', '子路、曾皙、冉有、公西华侍坐',
    [d('率', '轻率，草率'), d('方', '正，正在'), d('冠', '行冠礼'), d('让', '谦让'), d('知', '同“智”，智慧'), d('得', '得到，实现'), d('安', '怎么')],
    [d('以', '因为'), d('之', '代词，这件事'), d('其', '代词，他的'), d('而', '表修饰'), d('焉', '语气助词，呢'), d('乎', '表疑问，吗'), d('则', '就')]),
  chapter('高中必修下册', '第一单元（课内）', '齐桓晋文之事',
    [d('保', '安抚，安定'), d('辟', '开辟'), d('举', '推及'), d('度', '衡量'), d('治', '治理'), d('爱', '吝惜'), d('安', '安定，使安定'), d('诚', '果真'), d('道', '王道'), d('故', '所以')],
    [d('之', '助词，的'), d('其', '代词，他的'), d('以', '用，拿'), d('而', '表转折，却'), d('于', '介词，比'), d('则', '就'), d('焉', '语气助词，呢'), d('何', '什么')]),
  chapter('高中必修下册', '第一单元（课内）', '庖丁解牛',
    [d('解', '分解，剖开'), d('中', '合乎'), d('族', '筋骨交错的地方'), d('发', '出，发出声音'), d('养', '保养'), d('技', '技艺'), d('经', '经脉')],
    [d('之', '助词，的'), d('其', '代词，它，指牛'), d('而', '表承接'), d('以', '因为'), d('焉', '兼词，于之，在其中')]),
  chapter('高中必修下册', '第二单元（课内）', '烛之武退秦师',
    [d('退', '使……退却'), d('辞', '推辞'), d('鄙', '边邑'), d('济', '渡过'), d('阙', '侵损，削减'), d('图', '考虑'), d('亡', '灭亡'), d('知', '同“智”，明智'), d('及', '赶得上')],
    [d('之', '助词，的'), d('其', '代词，它，指郑国'), d('而', '表承接'), d('以', '因为'), d('于', '介词，对、向'), d('焉', '语气助词，呢'), d('夫', '句首语气助词'), d('与', '和')]),
  chapter('高中必修下册', '第二单元（课内）', '鸿门宴',
    [d('军', '驻军，驻扎'), d('倍', '同“背”，背叛'), d('谢', '道歉'), d('坐', '坐下'), d('辞', '推辞'), d('得', '能够'), d('度', '估计'), d('如', '及，比得上'), d('胜', '尽，完'), d('数', '多次'), d('王', '称王，让……称王')],
    [d('之', '动词，到、往'), d('其', '代词，他的'), d('而', '表承接'), d('以', '把'), d('于', '介词，在'), d('为', '替，给'), d('者', '……的人'), d('也', '表判断'), d('则', '就'), d('乃', '于是，就')]),
  chapter('高中必修下册', '第四单元（课内）', '促织',
    [d('征', '征收'), d('岁', '年'), d('业', '已经'), d('累', '连续，多次'), d('窥', '偷偷地看'), d('捷', '敏捷，迅速'), d('索', '寻找'), d('遂', '于是'), d('顾', '但，不过'), d('闻', '听到')],
    [d('之', '助词，的'), d('其', '代词，他的'), d('而', '表承接'), d('以', '把'), d('于', '介词，在'), d('则', '就'), d('乃', '于是，就')]),
  chapter('高中必修下册', '第五单元（课内）', '谏逐客书',
    [d('逐', '驱逐'), d('广', '使……广泛，扩大'), d('纳', '接受'), d('任', '任用'), d('施', '施行'), d('举', '所有'), d('安', '怎么'), d('治', '治理'), d('因', '依靠，凭借')],
    [d('之', '助词，的'), d('其', '代词，它的'), d('以', '用，凭借'), d('而', '表并列'), d('于', '介词，从'), d('则', '就'), d('因', '因为')]),
  chapter('高中必修下册', '第六单元（课内）', '谏太宗十思疏',
    [d('固', '使……稳固'), d('崇', '推崇，尊重'), d('戒', '告诫'), d('安', '使……安定'), d('诚', '确实'), d('求', '追求'), d('因', '顺着，依靠'), d('终', '最终')],
    [d('之', '助词，的'), d('其', '代词，他的'), d('而', '表转折，却'), d('以', '来，表目的'), d('则', '就'), d('夫', '句首语气助词'), d('焉', '语气助词，了')]),
  chapter('高中必修下册', '第六单元（课内）', '答司马谏议书',
    [d('辩', '同“辨”，区别'), d('固', '本来'), d('执', '坚持'), d('辟', '批驳'), d('度', '考虑'), d('任', '任用'), d('事', '办事，做事'), d('理', '道理')],
    [d('之', '助词，的'), d('其', '代词，那些'), d('而', '表转折，却'), d('以', '因为'), d('于', '介词，对、向'), d('则', '就'), d('为', '替，给')]),
  chapter('高中必修下册', '第七单元（课内）', '阿房宫赋',
    [d('毕', '完结，灭亡'), d('覆', '覆盖'), d('鉴', '借鉴'), d('尽', '竭尽'), d('取', '夺取'), d('奢', '奢侈'), d('藏', '收藏的珍宝'), d('极', '极尽')],
    [d('之', '助词，的'), d('其', '代词，它，指阿房宫'), d('而', '表转折，却'), d('以', '用，凭借'), d('于', '比'), d('焉', '语气助词，呢'), d('夫', '句首语气助词'), d('者', '……的人')]),
  chapter('高中必修下册', '第七单元（课内）', '六国论',
    [d('弊', '弊病'), d('赂', '贿赂'), d('亏', '使……亏损'), d('殆', '几乎'), d('弥', '更加'), d('愈', '更加'), d('继', '随着，接着'), d('故', '所以'), d('固', '本来'), d('得', '适宜，得当')],
    [d('之', '助词，的'), d('其', '代词，他们的'), d('而', '表因果，因而'), d('以', '用，拿'), d('于', '比'), d('则', '就'), d('焉', '语气助词，了'), d('且', '况且')]),
];

const manualSources = {
  '齐桓晋文之事': [
    ['诚有百姓者，王无异于百姓之以王为爱也。', '如果真有百姓，您不要对百姓认为您吝惜感到奇怪。'],
    ['王如施仁政于民，省刑罚，薄税敛，深耕易耨。', '大王如果对百姓施行仁政，减省刑罚，减轻赋税，深耕细作。'],
    ['故曰：仁者无敌。王请勿疑。', '所以说，施行仁政的人是无敌于天下的。大王请不要怀疑。'],
    ['然而王道之始也。', '这就是王道的开端。'],
    ['保民而王，莫之能御也。', '安抚百姓而称王，便没有人能抵挡他。'],
    ['欲辟土地，朝秦楚，莅中国而抚四夷也。', '想要开辟土地，使秦楚来朝见，统治中原，安抚四方的少数民族。'],
    ['举斯心加诸彼而已。', '把这样的心施加到别人身上罢了。'],
    ['度，然后知长短。', '用尺量，然后知道长短。'],
    ['治天下可运之掌上。', '治理天下就可以像在手掌上运转东西一样容易。'],
    ['齐国虽褊小，吾何爱一牛？', '齐国虽然狭小，我怎么会吝惜一头牛呢？'],
    ['王若隐其无罪而就死地，则牛羊何择焉？', '大王如果怜悯它没有罪却走向死地，那么牛和羊又有什么区别呢？'],
    ['以若所为，求若所欲，犹缘木而求鱼也。', '凭您这样的做法去求得您想要的东西，就像爬到树上去捉鱼一样。'],
    ['王之所大欲，可得闻与？', '大王最大的愿望，可以听听吗？'],
  ],
  '鸿门宴': [
    ['沛公军霸上，未得与项羽相见。', '沛公的军队驻扎在霸上，还没有能够和项羽相见。'],
    ['秦时与臣游，项伯杀人，臣活之。', '秦朝时他和我交往，项伯杀了人，我使他活了下来。'],
    ['项伯乃夜驰之沛公军，私见张良，具告以事。', '项伯于是连夜骑马赶到沛公的军营，私下会见张良，把事情全部告诉了他。'],
    ['范增数目项王，举所佩玉玦以示之者三。', '范增多次向项王使眼色，再三举起他佩戴的玉玦给项王看。'],
    ['先破秦入咸阳者王之。', '先攻破秦军进入咸阳的人，就让他在那里称王。'],
    ['杀人如不能举，刑人如恐不胜。', '杀人唯恐不能杀尽，给人施刑唯恐不能用尽。'],
    ['愿伯具言臣之不敢倍德也。', '希望您详细说明我不敢背叛恩德。'],
    ['旦日不可不蚤自来谢项王。', '明天早晨不能不早些亲自来向项王道歉。'],
    ['项王、项伯东向坐；亚父南向坐。', '项王、项伯面向东坐，亚父面向南坐。'],
    ['臣死且不避，卮酒安足辞！', '我连死都不躲避，一杯酒哪里值得推辞！'],
    ['度我至军中，公乃入。', '估计我已经回到军营，您才进去。'],
    ['劳苦而功高如此，未有封侯之赏。', '劳苦功高到这种程度，却没有得到封侯的赏赐。'],
    ['窃为大王不取也。', '我私下认为大王不应该采取这种做法。'],
    ['旦日飨士卒，为击破沛公军。', '明天犒劳士兵，替我击破沛公的军队。'],
  ],
  '促织': [
    ['宣德间，宫中尚促织之戏，岁征民间。', '宣德年间，皇宫中盛行斗蟋蟀的游戏，每年从民间征收蟋蟀。'],
    ['成益愕，急逐趁之，虫已在爪下矣。', '成名更加惊愕，急忙追赶它，蟋蟀已经到了他的爪下。'],
    ['成妻具资诣问。', '成名的妻子准备了钱财前去询问。'],
    ['窥父不在，窃发盆。', '他偷偷看见父亲不在，便悄悄打开了盆子。'],
    ['一鸣辄跃去，行且速。', '蟋蟀一叫就跳开，行动而且很快。'],
    ['即道人意中事，无毫发爽。', '它立即说出人心中想的事情，没有丝毫差错。'],
    ['遂为猾胥报充里正役。', '于是被奸猾的胥吏报上去充任里正的差事。'],
    ['顾念蓄劣物终无所用。', '只是想到养着劣等的蟋蟀终究没有什么用处。'],
    ['闻妻言，如被冰雪。', '听到妻子的话，好像被冰雪覆盖一样。'],
    ['而翁归，自与汝复算耳！', '你父亲回来，自然会和你重新算账！'],
    ['问者爇香于鼎，再拜。', '询问的人在香炉中点燃香，拜了两拜。'],
    ['则虫集冠上，力叮不释。', '蟋蟀就落在帽子上，用力叮住不放。'],
    ['乃赏成，献诸抚军。', '于是赏赐成名，把蟋蟀献给巡抚。'],
  ],
};

for (const [title, rows] of Object.entries(manualSources)) manualSources[title] = rows.map(([text, translation]) => ({ text, translation }));
const collected = new Map();
const collector = {
  poem: () => {},
  prose: (title, author, paragraphs, translations) => collected.set(title, { paragraphs, translations }),
  A: () => ({}),
};
for (const file of ['yuwen_high', 'yuwen_high2', 'yuwen_high3']) require(`./${file}`)(collector);

function clean(text) { return String(text || '').replace(/\uFFFD/g, ''); }
function splitSentences(text) { return clean(text).split(/(?<=[。！？；])/).map(s => s.trim()).filter(Boolean); }
function sourceFor(title, word, occurrence) {
  const manual = manualSources[title] || [];
  const candidates = [];
  for (const row of manual) for (const sentence of splitSentences(row.text)) if (sentence.includes(word)) candidates.push({ text: sentence, translation: row.translation });
  const original = collected.get(title);
  if (original) {
    original.paragraphs.forEach((paragraph, index) => {
      const sentences = splitSentences(paragraph);
      const translations = splitSentences(original.translations[index] || '');
      sentences.forEach((sentence, sentenceIndex) => {
        if (sentence.includes(word)) candidates.push({ text: sentence, translation: translations[sentenceIndex] || translations[0] || clean(original.translations[index]) });
      });
    });
  }
  return candidates[occurrence] || candidates[0] || null;
}
function esc(value) { return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "''"); }
function mark(text, word) { return text ? text.replace(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `<b>${word}</b>`) : null; }

const records = [];
for (const book of chapters) {
  for (const wordClass of [1, 2]) {
    for (const item of wordClass === 1 ? book.real : book.virtual) {
      const found = sourceFor(book.title, item.word, item.occurrence);
      const example = found ? mark(found.text, item.word) : null;
      records.push({
        id: records.length + 1,
        wordClass,
        word: item.word,
        pinyin: pinyin[item.word] || '',
        meaning: formatMeaning(wordClass, item.word, item.meaning),
        example,
        source: `${VERSION.name}｜${book.volume}｜${book.unit}｜《${book.title}》`,
        exampleTrans: found ? found.translation : `附件将“${item.word}”列入《${book.title}》范围，但当前篇目文本未检出明确用例，暂保留草稿待复核。`,
        volumeId: volumeId(book.volume),
        volumeName: book.volume,
        questionEnabled: Boolean(example),
      });
    }
  }
}

function quote(value) { return value === null || value === undefined ? 'NULL' : `'${esc(value)}'`; }
const questions = buildQuestions(
  records.filter(item => item.questionEnabled && item.example),
  externalExamples,
).map((row, index) => ({ id: index + 1, ...row }));

function tuples(text) {
  const out = []; let i = 0;
  while ((i = text.indexOf('\n(', i)) >= 0) {
    const start = i + 1; let j = start; let quoted = false;
    for (; j < text.length; j += 1) {
      const c = text[j];
      if (c === "'") { if (quoted && text[j + 1] === "'") { j += 1; continue; } quoted = !quoted; }
      else if (!quoted && c === ')') { out.push(text.slice(start, j + 1)); i = j + 1; break; }
    }
    if (j >= text.length) break;
  }
  return out;
}
function splitTuple(tuple) {
  const body = tuple.slice(1, -1); const fields = []; let start = 0; let quoted = false;
  for (let i = 0; i < body.length; i += 1) {
    const c = body[i];
    if (c === "'") { if (quoted && body[i + 1] === "'") { i += 1; continue; } quoted = !quoted; }
    else if (!quoted && c === ',') { fields.push(body.slice(start, i).trim()); start = i + 1; }
  }
  fields.push(body.slice(start).trim()); return fields;
}
function value(token) { if (token === 'NULL') return null; return token.startsWith("'") ? token.slice(1, -1).replace(/''/g, "'").replace(/\\\\/g, '\\') : token; }
function readRows(file, count) { return tuples(fs.readFileSync(path.join(SQL_DIR, file), 'utf8')).map(splitTuple).filter(row => row.length === count && /^\d+$/.test(row[0])); }
function insertSql(table, columns, rows, header) {
  const q = name => `\`${name}\``;
  const updates = columns.slice(1).map(name => `${q(name)} = VALUES(${q(name)})`).join(',\n');
  return [header, '', 'START TRANSACTION;', '', `INSERT INTO ${q(table)}`, `(${columns.map(q).join(', ')})`, 'VALUES', rows.map(row => `(${row.join(', ')})`).join(',\n'), 'ON DUPLICATE KEY UPDATE', `${updates};`, '', 'COMMIT;', ''].join('\n');
}
const senseRows = records.map(row => [row.id, row.wordClass, quote(row.word), quote(row.pinyin), quote(row.meaning), quote(row.example), quote(row.source), quote(row.exampleTrans), row.example ? 1 : 0, 0]);
const questionRows = questions.map(row => [row.id, row.senseId, row.type, quote(row.stem), quote(JSON.stringify(row.options)), 1, 0]);
const catalogRows = records.map((row, index) => [index + 1, quote(VERSION.id), quote(VERSION.name), quote(row.volumeId), quote(row.volumeName), row.id, index + 1, row.example ? 1 : 0, 0]);

const juniorSenseRows = fs.existsSync(path.join(SQL_DIR, 'edu_chn_junior_word_sense.sql')) ? readRows('edu_chn_junior_word_sense.sql', 10) : [];
const existingSense = [...juniorSenseRows, ...readRows('edu_chn_word_sense.sql', 10).filter(row => Number(row[0]) >= 1000)]
  .filter((row, index, rows) => rows.findIndex(item => item[0] === row[0]) === index);
const juniorQuestionRows = fs.existsSync(path.join(SQL_DIR, 'edu_chn_junior_word_question.sql')) ? readRows('edu_chn_junior_word_question.sql', 7) : [];
const existingQuestions = [...juniorQuestionRows, ...readRows('edu_chn_word_question.sql', 7).filter(row => Number(row[1]) >= 1000)]
  .filter((row, index, rows) => rows.findIndex(item => item[0] === row[0]) === index);
const juniorCatalogRows = fs.existsSync(path.join(SQL_DIR, 'edu_chn_junior_word_catalog.sql')) ? readRows('edu_chn_junior_word_catalog.sql', 9) : [];
const existingCatalog = [...juniorCatalogRows, ...readRows('edu_chn_word_catalog.sql', 9).filter(row => Number(row[5]) >= 1000)]
  .filter((row, index, rows) => rows.findIndex(item => item[0] === row[0]) === index);
const senseColumns = ['id', 'word_class', 'word', 'pinyin', 'meaning', 'example', 'source', 'example_trans', 'status', 'is_del'];
const questionColumns = ['id', 'sense_id', 'question_type', 'stem', 'options_json', 'status', 'is_del'];
const catalogColumns = ['id', 'version_id', 'version_name', 'volume_id', 'volume_name', 'sense_id', 'sort', 'status', 'is_del'];
const mergedSense = [...existingSense, ...senseRows].sort((a, b) => Number(a[0]) - Number(b[0]));
const mergedQuestions = [...existingQuestions, ...questionRows].sort((a, b) => Number(a[0]) - Number(b[0]));
const mergedCatalog = [...existingCatalog, ...catalogRows].sort((a, b) => Number(a[0]) - Number(b[0]));
const ddl = ['-- 语文积累本-高中与初中实虚词教材关系（统一目录结构）', '-- 初高中数据共用同一张表，通过 version_id + volume_id 区分教材版本与分册。', 'CREATE TABLE IF NOT EXISTS `edu_chn_word_catalog` (', '`id` int(10) NOT NULL AUTO_INCREMENT COMMENT \'主键\',', '`version_id` varchar(64) NOT NULL COMMENT \'学校管理平台教材版本ID\',', '`version_name` varchar(512) DEFAULT NULL COMMENT \'版本名称\',', '`volume_id` varchar(64) NOT NULL COMMENT \'分册/书目ID\',', '`volume_name` varchar(512) DEFAULT NULL COMMENT \'分册/书目名称\',', '`sense_id` int(10) NOT NULL COMMENT \'词义ID，关联 edu_chn_word_sense.id\',', '`sort` int(10) NOT NULL DEFAULT \'0\' COMMENT \'词表顺序\',', '`status` tinyint(2) NOT NULL DEFAULT \'0\' COMMENT \'0=草稿，1=上架\',', '`is_del` tinyint(2) NOT NULL DEFAULT \'0\' COMMENT \'0=未删除，1=已删除\',', '`create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'创建时间\',', '`update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT \'更新时间\',', 'PRIMARY KEY (`id`),', 'KEY `version_id` (`version_id`),', 'KEY `volume_id` (`volume_id`),', 'KEY `idx_sense` (`sense_id`)', ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT=\'语文积累本-实虚词目录挂载\';'].join('\n');
fs.writeFileSync(path.join(SQL_DIR, 'edu_chn_word_sense.sql'), insertSql('edu_chn_word_sense', senseColumns, mergedSense, '-- 语文积累本-高中与初中实虚词词义例句（高中必修上下册按新范围替换）'));
fs.writeFileSync(path.join(SQL_DIR, 'edu_chn_word_question.sql'), insertSql('edu_chn_word_question', questionColumns, mergedQuestions, '-- 语文积累本-高中与初中实虚词题目（高中必修上下册按新范围替换）'));
fs.writeFileSync(path.join(SQL_DIR, 'edu_chn_word_catalog.sql'), `${ddl}\n\n${insertSql('edu_chn_word_catalog', catalogColumns, mergedCatalog, '')}`);
console.log(JSON.stringify({ highSense: records.length, highQuestions: questions.length, highCatalog: records.length, unresolved: records.filter(row => !row.example).map(row => ({ word: row.word, book: row.source })) }, null, 2));

// 统一题目必须基于合并后的高中+初中词义生成，避免入口脚本各自使用旧的兜底逻辑。
require('./regenerate_yuwen_word_questions').regenerateQuestions();
