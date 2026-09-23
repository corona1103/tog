const VIRTUAL_POS = new Map([
  ['而', '连'], ['于', '介'], ['以', '介'], ['之', '助'], ['其', '代'],
  ['者', '助'], ['也', '助'], ['焉', '兼'], ['乎', '语气'], ['夫', '语气'],
  ['则', '副'], ['乃', '副'], ['遂', '副'], ['既', '副'], ['会', '副'],
  ['安', '副'], ['何', '代'], ['因', '介'], ['与', '介'], ['为', '介'],
  ['若', '代'],
]);

const REAL_NOUNS = new Set([
  '车前草，嫩叶可食', '磨刀石', '半步，跨一脚', '骏马', '劣马',
  '马拉车一天所走的路程', '求学的人', '疑惑，疑难问题', '传授的知识', '道理，学说',
  '自己', '古人指文辞的休止和停顿', '筋骨交错的地方', '技艺', '经脉', '任务，功效',
  '方圆，纵横', '行冠礼', '年', '道路', '王道', '信用', '景象', '收藏的珍宝',
  '弊病', '贿赂', '职分，职守', '职分', '类别', '下属，部属', '收藏的珍宝',
  '道义，正确的治国之道',
  '农历每月十五日', '尽头', '边邑', '道理',
]);

const REAL_ADJECTIVES = new Set([
  '疾', '彰', '快，速', '明显，清楚', '困窘，处境困难', '通晓，明白',
  '轻率，草率', '空', '满', '少', '清澈', '秀丽', '美好', '坚固，牢固',
  '敏捷，迅速', '长，这里指身高', '合乎', '同“智”，智慧', '同“智”，明智', '适宜，得当',
  '目光短浅',
]);

const REAL_ADVERBS = new Set([
  '更加', '常常', '已经', '多次', '于是', '确实，的确', '确实', '果真', '最终',
  '几乎', '连续，多次', '适逢，恰逢', '恰好', '只，不过', '但，不过', '所有',
  '全，都', '完全', '竟然', '怎么', '本来', '随着，接着',
]);

function inferRealPos(word, meaning) {
  const override = new Map([
    ['方|正，正在', '副'], ['冠|行冠礼', '动'], ['故|所以', '副'],
    ['军|驻军，驻扎', '动'], ['望|农历每月十五日', '名'], ['极|尽头', '名'],
    ['鄙|边邑', '名'], ['中|合乎', '动'], ['如|及，比得上', '动'],
    ['若|如，比得上', '动'], ['若|比得上', '动'],
    ['率|轻率，草率', '形'], ['得|适宜，得当', '形'], ['王|称王，让……称王', '使动'],
    ['乐|以……为乐', '意动'], ['异|对……感到诧异', '意动'],
  ]).get(`${word}|${meaning}`);
  if (override) return override;
  if (/^同[“"「]/.test(meaning)) return '通假';
  if (/意动用法/.test(meaning) || /^以……为/.test(meaning)) return '意动';
  if (/^使……/.test(meaning)) return '使动';
  if (REAL_ADVERBS.has(meaning)) return '副';
  if (REAL_NOUNS.has(meaning)) return '名';
  if (REAL_ADJECTIVES.has(meaning)) return '形';
  if (/^(快|明显|清楚|少|空|满|困窘|通晓|通达|轻率|敏捷|清澈|秀丽|美好|坚固)/.test(meaning)) return '形';
  if (/^(怎么|如果|如|比得上|及，比得上|适逢|已经|更加|常常|多次|于是|果真|确实|本来|几乎|最终|随着|但，不过|所有|全，都)/.test(meaning)) return '副';
  return '动';
}

function inferVirtualPos(word, meaning) {
  if (/^连词|^表(?:转折|承接|并列|修饰|递进|因果|目的)/.test(meaning)) return '连';
  if (/^介词/.test(meaning)) return '介';
  if (/^代词/.test(meaning)) return '代';
  if (/^助词|^用于主谓|^宾语前置|^与“.*”组成|无实义/.test(meaning)) return '助';
  if (/^语气助词|^句首语气/.test(meaning)) return '语气';
  if (/^兼词/.test(meaning)) return '兼';
  if (word === '之' && /^动词/.test(meaning)) return '动';
  if (word === '为' && /^(筑|做|制作|雕刻)/.test(meaning)) return '动';
  if (word === '若' && /^如果/.test(meaning)) return '连';
  if (word === '因' && /^因为/.test(meaning)) return '连';
  if (word === '以' && /^(来|表目的)/.test(meaning)) return '连';
  return new Map([
    ['而', '连'], ['于', '介'], ['以', '介'], ['之', '助'], ['其', '代'],
    ['者', '助'], ['也', '助'], ['焉', '兼'], ['乎', '语气'], ['夫', '语气'],
    ['则', '副'], ['乃', '副'], ['遂', '副'], ['既', '副'], ['会', '副'],
    ['安', '副'], ['何', '代'], ['因', '介'], ['与', '介'], ['为', '介'],
    ['若', '代'],
  ]).get(word) || '助';
}

function formatMeaning(wordClass, word, meaning) {
  const value = String(meaning ?? '').trim();
  if (!value || /^<[^>]+>/.test(value)) return value;
  const pos = Number(wordClass) === 2 ? inferVirtualPos(word, value) : inferRealPos(word, value);
  return `<${pos}>${value}`;
}

function hasMeaningPos(meaning) {
  return /^<[^>]+>/.test(String(meaning ?? '').trim());
}

module.exports = { formatMeaning, hasMeaningPos };
