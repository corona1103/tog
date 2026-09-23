const UNAVAILABLE_EXAMPLE = '暂无例句';

const TYPE1_FALLBACK_MEANINGS = {
  疾: ['<名>疾病', '<动>憎恨', '<副>快速地'], 彰: ['<动>表明', '<名>表彰', '<形>鲜明'],
  假: ['<形>虚假', '<动>借用', '<连>如果'], 积: ['<名>积累的东西', '<动>聚集', '<形>长期积累的'],
  锲: ['<名>锲刀', '<动>割断', '<动>契刻'], 兴: ['<动>兴办', '<名>兴致', '<形>兴盛'],
  者: ['<助>用在时间词后，表示停顿', '<助>用在名词后，表示……的原因', '<助>表判断'],
  师: ['<名>老师', '<动>学习', '<名>军队'], 惑: ['<动>迷惑', '<形>疑惑的', '<动>使……迷惑'],
  传: ['<动>传递', '<动>传播', '<名>驿站'], 从: ['<动>参与', '<介>从，由', '<动>跟从'],
  贤: ['<形>贤能', '<名>贤人', '<动>胜过'], 益: ['<名>好处', '<动>增加', '<副>更加'],
  通: ['<动>通行', '<形>通畅', '<动>贯通'], 所: ['<名>处所', '<助>与“为”组成“为所”表被动', '<助>与“所”字结构组成名词性短语'],
  逝: ['<动>往，去', '<动>死亡', '<形>流失的'], 盈: ['<动>充满', '<名>满月', '<形>充足'],
  虚: ['<形>空虚', '<名>空隙', '<动>使……空'], 取: ['<动>攻取', '<动>选取', '<动>求取'],
  如: ['<动>像，如同', '<动>往，到', '<动>及，比得上'], 适: ['<动>到……去', '<形>舒适', '<副>恰好'],
  历: ['<名>历法', '<动>经历', '<形>历来的'], 始: ['<名>开始', '<副>才', '<动>开始做'],
  行: ['<名>道路', '<动>实行', '<动>行走'], 率: ['<名>概率', '<动>带领', '<副>全都'],
  保: ['<名>保人', '<动>保护', '<动>安抚'], 辟: ['<动>开辟', '<动>批驳', '<动>征召'],
  举: ['<动>举起', '<动>推荐', '<副>全都'], 度: ['<名>尺度', '<动>推测', '<动>衡量'],
  治: ['<动>治理', '<动>医治', '<名>治所'], 爱: ['<动>爱护', '<名>恩惠', '<动>吝惜'],
  何: ['<代>哪里', '<代>什么原因', '<副>多么'], 解: ['<动>解释', '<动>解开', '<名>押送的差役'],
  中: ['<名>中间', '<动>射中', '<形>中等'], 族: ['<名>家族', '<动>灭族', '<名>同类的人'],
  发: ['<动>打开', '<动>出发', '<名>头发'], 养: ['<动>养育', '<动>奉养', '<动>保养'],
  技: ['<名>技艺', '<动>擅长', '<名>技能'], 经: ['<名>经典', '<动>经过', '<名>经脉'],
  退: ['<动>退却', '<动>使……退却', '<动>辞退'], 济: ['<动>渡过', '<动>帮助', '<名>渡口'],
  图: ['<名>图画', '<动>谋取', '<动>考虑'], 及: ['<动>到达', '<动>赶得上', '<介>等到'],
  夫: ['<名>成年男子', '<代>那', '<语气>句末语气助词'], 与: ['<动>给予', '<介>和，跟', '<动>赞同'],
  军: ['<名>军队', '<动>驻军', '<动>编制军队'], 倍: ['<动>加倍', '<动>背叛', '<名>一倍'],
  谢: ['<动>道歉', '<动>感谢', '<动>拒绝'], 坐: ['<动>坐下', '<名>座位', '<动>犯罪'],
  得: ['<动>得到', '<动>能够', '<形>适宜，得当'], 胜: ['<动>战胜', '<形>优美', '<动>尽，完'],
  数: ['<名>数目', '<动>计算', '<副>多次'], 王: ['<名>君王', '<动>称王', '<使动>使……称王'],
  征: ['<动>征召', '<动>征收', '<名>征兆'], 岁: ['<名>年', '<名>年成', '<名>年龄'], 遂: ['<副>于是', '<动>成功', '<形>顺利'],
  广: ['<形>广大', '<动>扩大', '<名>宽度'], 施: ['<动>施行', '<动>给予', '<名>恩惠'],
  崇: ['<形>高', '<动>推崇', '<名>山名'], 戒: ['<动>告诫', '<名>戒指', '<动>警戒'],
  求: ['<动>寻求', '<动>请求', '<名>要求'], 因: ['<介>凭借', '<连>因为', '<动>沿袭'],
  终: ['<名>终点', '<动>结束', '<副>最终'], 任: ['<动>任用', '<动>承担', '<名>职任'],
  事: ['<名>事情', '<动>侍奉', '<动>从事'], 理: ['<名>道理', '<动>治理', '<动>理清'],
  覆: ['<动>覆盖', '<动>颠覆', '<动>审查'], 鉴: ['<名>镜子', '<动>借鉴', '<动>察看'],
  奢: ['<形>奢侈', '<动>夸耀', '<形>过分'], 藏: ['<动>收藏', '<名>宝藏', '<动>隐藏'],
  弊: ['<名>弊病', '<形>破旧', '<动>损害'], 赂: ['<名>贿赂', '<动>赠送财物', '<名>财物'],
  亏: ['<形>亏空', '<动>损失', '<动>使……受损'], 弥: ['<动>弥补', '<副>更加', '<形>满'],
  愈: ['<动>痊愈', '<副>更加', '<形>胜过'], 继: ['<动>接续', '<名>继承人', '<副>接着'],
  骤: ['<副>突然', '<形>急速', '<动>奔跑'], 拟: ['<动>相比', '<动>打算', '<名>模仿'],
  期: ['<动>约定', '<名>期限', '<动>希望'], 愠: ['<动>生气', '<形>含怒的', '<名>怒气'],
  省: ['<动>反省', '<名>省份', '<动>察看'], 罔: ['<形>迷惑', '<动>欺骗', '<副>无'],
  致: ['<动>达到', '<动>招致', '<名>情趣'], 暇: ['<名>空闲', '<形>悠闲', '<动>空暇'],
  善: ['<形>善良', '<动>擅长', '<动>友善对待'], 酌: ['<动>斟酒', '<动>考虑', '<名>酒'],
  遣: ['<动>派遣', '<动>打发', '<动>排遣'], 劳: ['<动>慰劳', '<形>劳苦', '<动>使……劳累'],
  鲜: ['<形>鲜艳', '<形>新鲜', '<副>少'], 宜: ['<形>合适', '<动>应当', '<名>适宜的事'],
  具: ['<动>准备', '<形>完备', '<名>器具'], 时: ['<名>时令', '<名>时间', '<动>按时'], 歇: ['<动>休息', '<动>消散', '<名>歇息'],
  念: ['<动>考虑', '<动>诵读', '<名>念头'], 甚: ['<副>很，非常', '<动>超过', '<形>严重'], 寡: ['<形>少', '<名>少数人', '<动>减少'],
  顺: ['<形>顺利', '<动>顺从', '<动>沿着'], 屈: ['<动>使……屈服', '<动>弯曲', '<形>委屈'], 拂: ['<动>违背', '<动>拂拭', '<动>辅佐'],
  恒: ['<形>长久', '<副>常常', '<动>持久不变'], 曾: ['<副>竟然', '<副>曾经', '<动>增加'], 惩: ['<动>苦于', '<动>惩罚', '<名>惩罚'],
  许: ['<动>赞同', '<动>答应', '<数>大约'], 易: ['<形>容易', '<动>交换', '<形>平易'], 缘: ['<名>缘分', '<动>沿着', '<介>因为'],
  悉: ['<副>全，都', '<动>知道', '<形>详尽'], 寻: ['<动>寻找', '<副>不久', '<量>长度单位'], 规: ['<名>规矩', '<动>计划', '<动>劝谏'],
  异: ['<形>奇异', '<动>区别', '<意动>对……感到诧异'], 清: ['<形>清澈', '<形>清白', '<动>清理'], 近: ['<形>接近', '<动>靠近', '<副>近来'],
  奇: ['<形>奇异', '<数>零数，余数', '<动>以……为奇'], 类: ['<名>类别', '<动>像，相似', '<名>同类的人'], 志: ['<名>志向', '<动>记载', '<动>记住'],
  旨: ['<名>旨意', '<形>美味', '<动>知道'], 困: ['<形>困窘', '<动>困惑', '<动>使……困苦'],
};

const unique = values => [...new Set(values.filter(Boolean))];
const byId = (a, b) => Number(a.id || 0) - Number(b.id || 0);
const stripTags = text => String(text || '').replace(/<[^>]+>/g, '');

function markWord(example, word) {
  if (!example || !word || /<b>/.test(example)) return example;
  const escaped = String(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return String(example).replace(new RegExp(escaped, 'g'), `<b>${word}</b>`);
}

function externalFor(externalExamples, word, predicate) {
  return externalExamples.filter(item => item.word === word && predicate(item) && item.example);
}

function type1Distractors(row, records, externalExamples) {
  const current = records
    .filter(item => item.word === row.word && item.meaning !== row.meaning)
    .sort(byId)
    .map(item => item.meaning);
  const external = externalExamples
    .filter(item => item.word === row.word && item.meaning !== row.meaning)
    .map(item => item.meaning);
  return unique([...current, ...external, ...(TYPE1_FALLBACK_MEANINGS[row.word] || [])])
    .filter(item => item !== row.meaning)
    .slice(0, 3);
}

function findSameExample(row, records, externalExamples) {
  const current = records
    .filter(item => item.id !== row.id && item.word === row.word && item.meaning === row.meaning && item.example)
    .sort(byId)[0];
  if (current) return markWord(current.example, row.word);
  const external = externalFor(externalExamples, row.word, item => item.meaning === row.meaning)[0];
  return external ? markWord(external.example, row.word) : UNAVAILABLE_EXAMPLE;
}

function findOtherExample(row, records, externalExamples) {
  const current = records
    .filter(item => item.word === row.word && item.meaning !== row.meaning && item.example)
    .sort(byId)[0];
  if (current) return markWord(current.example, row.word);
  const external = externalFor(externalExamples, row.word, item => item.meaning !== row.meaning)[0];
  return external ? markWord(external.example, row.word) : UNAVAILABLE_EXAMPLE;
}

function buildQuestions(records, externalExamples = []) {
  const questions = [];
  for (const row of records.filter(item => item.example).sort(byId)) {
    const distractors = type1Distractors(row, records, externalExamples);
    const plainMeaning = String(row.meaning).replace(/^<[^>]+>/, '');
    const lastResort = [
      `<反义>与“${plainMeaning}”相反`,
      `<字面义>按“${row.word}”字面理解`,
      `<字面义>“${row.word}”的本义`,
    ];
    for (const candidate of lastResort) {
      if (distractors.length >= 3) break;
      if (!distractors.includes(candidate) && candidate !== row.meaning) distractors.push(candidate);
    }
    questions.push({
      senseId: row.id,
      type: 1,
      stem: `下列对例句“${stripTags(row.example)}”中“${row.word}”的解释，正确的一项是`,
      options: [{ content: row.meaning, correct: true }, ...distractors.slice(0, 3).map(content => ({ content, correct: false }))],
    });
    questions.push({
      senseId: row.id,
      type: 2,
      stem: `下列句子中“${row.word}”的意义和用法，与例句相同的一项是`,
      options: [
        { content: findSameExample(row, records, externalExamples), correct: true },
        { content: findOtherExample(row, records, externalExamples), correct: false },
      ],
    });
  }
  return questions;
}

module.exports = { UNAVAILABLE_EXAMPLE, TYPE1_FALLBACK_MEANINGS, buildQuestions, markWord };
