// 外部词典参考例句：经人工核对后固化，生成 SQL 时不实时联网。
const SOURCE_BASE = 'https://wyw.hwxnet.com/view/';

const rows = [
  // 望：参考 https://wyw.hwxnet.com/search.do?wd=望
  { word: '望', meaning: '<动>远看', example: '西北望长安，可怜无数山。', exampleTrans: '向西北远望长安，可惜只看见无数青山。', source: '《菩萨蛮·书江西造口壁》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=望' },
  { word: '望', meaning: '<动>盼望；希望；期望', example: '日夜望将军至，岂敢反乎？', exampleTrans: '日日夜夜盼望将军到来，怎么敢反叛呢？', source: '《鸿门宴》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=望' },
  { word: '望', meaning: '<名>名望；声望', example: '先达德隆望尊，门人弟子填其室。', exampleTrans: '前辈道德高、声望大，学生弟子挤满了他的屋子。', source: '《送东阳马生序》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=望' },

  // 为：用户提供的词典页面
  { word: '为', meaning: '<动>做；干', example: '天下事有难易乎？为之，则难者亦易矣。', exampleTrans: '天下的事情有困难和容易之分吗？去做它，那么困难的事情也会变得容易。', source: '《为学》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/view/hwxE4hwxB8hwxBA.html' },
  { word: '为', meaning: '<动>做，制作', example: '唐人尚未盛为之。', exampleTrans: '唐代人还没有大规模地制作它。', source: '《活板》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/view/hwxE4hwxB8hwxBA.html' },
  { word: '为', meaning: '<动>是', example: '宫中府中，俱为一体。', exampleTrans: '皇宫中和丞相府中的人，都是一个整体。', source: '《出师表》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/view/hwxE4hwxB8hwxBA.html' },
  { word: '为', meaning: '<介>替，给', example: '庖丁为文惠君解牛。', exampleTrans: '庖丁为文惠君解牛。', source: '《庖丁解牛》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/view/hwxE4hwxB8hwxBA.html' },
  { word: '为', meaning: '<介>向，对', example: '不足为外人道也。', exampleTrans: '不值得向外面的人说。', source: '《桃花源记》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/view/hwxE4hwxB8hwxBA.html' },
  { word: '为', meaning: '<介>因为', example: '盘庚不为怨者故改其度。', exampleTrans: '盘庚不因为有人怨恨的缘故就改变自己的计划。', source: '《答司马谏议书》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/view/hwxE4hwxB8hwxBA.html' },
  { word: '为', meaning: '<介>被', example: '身死人手，为天下笑者，何也？', exampleTrans: '自己死在别人手里，被天下人嘲笑，是什么原因呢？', source: '《过秦论》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/view/hwxE4hwxB8hwxBA.html' },
  { word: '为', meaning: '<连>如果；假如', example: '秦为知之，必不救矣。', exampleTrans: '秦国如果知道这件事，一定不会来救援。', source: '《战国策·秦策》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/view/hwxE4hwxB8hwxBA.html' },

  // 常见虚词交叉例句，来源页按字检索后人工核对。
  { word: '而', meaning: '<连>连词，表承接', example: '温故而知新，可以为师矣。', exampleTrans: '温习旧知识从而知道新的理解，可以凭此做老师了。', source: '《论语》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=而' },
  { word: '而', meaning: '<连>连词，表转折，却', example: '青，取之于蓝，而青于蓝。', exampleTrans: '靛青从蓼蓝中取得，却比蓼蓝颜色更深。', source: '《劝学》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=而' },
  { word: '之', meaning: '<助>助词，的', example: '古之圣人，其出人也远矣。', exampleTrans: '古代的圣人，他们超出一般人很远。', source: '《师说》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=之' },
  { word: '之', meaning: '<代>代词，它', example: '人非生而知之者，孰能无惑？', exampleTrans: '人不是生下来就懂得道理的，谁能没有疑惑呢？', source: '《师说》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=之' },
  { word: '于', meaning: '<介>介词，在', example: '月出于东山之上，徘徊于斗牛之间。', exampleTrans: '月亮从东山上升起，在斗宿和牛宿之间徘徊。', source: '《赤壁赋》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=于' },
  { word: '于', meaning: '<介>介词，比', example: '冰，水为之，而寒于水。', exampleTrans: '冰，是水凝结成的，却比水更寒冷。', source: '《劝学》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=于' },
  { word: '以', meaning: '<介>介词，把', example: '以勇气闻于诸侯。', exampleTrans: '凭借勇气在诸侯中闻名。', source: '《廉颇蔺相如列传》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=以' },
  { word: '以', meaning: '<连>连词，表目的，来', example: '作《师说》以贻之。', exampleTrans: '写了这篇《师说》来赠送给他。', source: '《师说》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=以' },
  { word: '因', meaning: '<介>介词，凭借', example: '因利乘便，宰割天下，分裂山河。', exampleTrans: '凭借有利的形势，割取天下，分割山河。', source: '《过秦论》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=因' },
  { word: '因', meaning: '<连>因为', example: '因宾客至蔺相如门谢罪。', exampleTrans: '通过宾客引领到蔺相如的门前谢罪。', source: '《廉颇蔺相如列传》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=因' },
  { word: '会', meaning: '<副>适逢；恰巧遇上', example: '会天大雨，道路不通。', exampleTrans: '适逢天下大雨，道路不通。', source: '《陈涉世家》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=会' },
  { word: '喻', meaning: '<动>知晓，明白', example: '王好战，请以战喻。', exampleTrans: '大王喜欢战争，请允许我用战争来打比方。', source: '《齐桓晋文之事》｜华夏文库文言文词典参考', sourceUrl: 'https://wyw.hwxnet.com/search.do?wd=喻' },
];

function getExternalExamples() {
  return rows;
}

module.exports = rows;
module.exports.getExternalExamples = getExternalExamples;
