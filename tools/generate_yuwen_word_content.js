const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const VERSION = { id: '00b6bf17df4345109f570bf0273705f3', name: '部编版' };
const VOLUME = { id: '1a84b7ac1ef9d3b5d624d994c88f239a', name: '高中必修上册' };
const BOOKS = {
  '芣苢': { unitId: 'a738eb5ca76659a9e8f67ef5659434d4', unitName: '第一单元（课内）' },
  '劝学': { unitId: 'a453b281b71fd478be1d9d791307bf5c', unitName: '第五单元（课内）' },
  '师说': { unitId: 'a453b281b71fd478be1d9d791307bf5c', unitName: '第五单元（课内）' },
};

const q = (content, correct = false) => ({ content, correct });
const item = (wordClass, word, pinyin, meaning, example, source, exampleTrans, distractors, compareOptions, compareCorrect = 0) => ({
  wordClass, word, pinyin, meaning, example, source, exampleTrans,
  distractors, compareOptions, compareCorrect,
});

const data = [
  // 芣苢
  item(1, '芣苢', 'fú yǐ', '车前草，嫩叶可食', '采采<b>芣苢</b>，薄言采之。', '《芣苢》｜《诗经》', '繁茂的车前草啊，快来采呀。', ['一种谷物', '一种水草', '一种树木'], ['采采<b>芣苢</b>，薄言有之。', '采采<b>芣苢</b>，薄言掇之。', '桃之夭夭，灼灼其华。', '蒹葭苍苍，白露为霜。']),
  item(2, '薄言', 'bó yán', '语气助词，无实义', '采采芣苢，<b>薄言</b>采之。', '《芣苢》｜《诗经》', '繁茂的车前草啊，快来采呀。', ['少量地说', '浅薄的言语', '不久以后'], ['采采芣苢，<b>薄言</b>有之。', '逝者如斯，而未尝往也。', '君子博学而日参省乎己。', '小学而大遗，吾未见其明也。']),
  item(1, '采', 'cǎi', '采摘', '采采芣苢，薄言<b>采</b>之。', '《芣苢》｜《诗经》', '繁茂的车前草啊，快来采摘它。', ['采纳', '搜集文章', '选取官员'], ['采采芣苢，薄言<b>采</b>之。', '左右欲刃相如。', '余音袅袅，不绝如缕。', '客有吹洞箫者。']),
  item(1, '有', 'yǒu', '取得，获得', '采采芣苢，薄言<b>有</b>之。', '《芣苢》｜《诗经》', '繁茂的车前草啊，快来取得一些吧。', ['同“又”', '存在', '富有'], ['采采芣苢，薄言<b>有</b>之。', '虽<b>有</b>槁暴，不复挺者。', '河曲智叟亡以应。', '小学而大遗。']),
  item(1, '掇', 'duō', '拾取', '采采芣苢，薄言<b>掇</b>之。', '《芣苢》｜《诗经》', '繁茂的车前草啊，快来拾取它。', ['摘取果实', '搬运重物', '丢弃'], ['采采芣苢，薄言<b>掇</b>之。', '百姓闻王车马之音。', '锲而不舍，金石可镂。', '顺风而呼，声非加疾也。']),
  item(1, '捋', 'luō', '成把地取', '采采芣苢，薄言<b>捋</b>之。', '《芣苢》｜《诗经》', '繁茂的车前草啊，快来成把地取它。', ['轻轻抚摸', '整理衣襟', '洗涤'], ['采采芣苢，薄言<b>捋</b>之。', '微风鼓浪，水石相搏。', '木直中绳，輮以为轮。', '故不积跬步，无以至千里。']),
  item(1, '袺', 'jié', '提起衣襟兜东西', '采采芣苢，薄言<b>袺</b>之。', '《芣苢》｜《诗经》', '繁茂的车前草啊，快提起衣襟兜起来。', ['束缚手脚', '系好腰带', '用手捧取'], ['采采芣苢，薄言<b>袺</b>之。', '会挽雕弓如满月。', '闻道有先后，术业有专攻。', '余嘉其能行古道。']),
  item(1, '襭', 'xié', '把衣襟别在腰带上兜东西', '采采芣苢，薄言<b>襭</b>之。', '《芣苢》｜《诗经》', '繁茂的车前草啊，快把衣襟别在腰带上兜满。', ['缝补衣服', '整理头发', '解开衣带'], ['采采芣苢，薄言<b>襭</b>之。', '不拘于时，学于余。', '蚓无爪牙之利。', '其曲中规。']),

  // 劝学：实词
  item(1, '已', 'yǐ', '停止', '君子曰：学不可以<b>已</b>。', '《劝学》｜荀子', '君子说：学习不可以停止。', ['已经', '同“以”，用来', '离开'], ['学不可以<b>已</b>。', '舟已行矣，而剑不行。', '死而后已。', '斯人也而有斯疾也。']),
  item(1, '中', 'zhòng', '符合，合乎', '木直<b>中</b>绳，輮以为轮。', '《劝学》｜荀子', '木材直得合乎墨线，用火烤使它弯曲制成车轮。', ['中间', '击中目标', '处在其中'], ['木直<b>中</b>绳，輮以为轮。', '木直中绳。', '有良田美池桑竹之属。', '今其智乃反不能及。']),
  item(1, '輮', 'róu', '使弯曲', '木直中绳，<b>輮</b>以为轮。', '《劝学》｜荀子', '木材直得合乎墨线，用火烤使它弯曲制成车轮。', ['弯曲的车轮', '使……变直', '柔软'], ['木直中绳，<b>輮</b>以为轮。', '木直中绳，輮以为轮。', '木受绳则直。', '金就砺则利。']),
  item(1, '砺', 'lì', '磨刀石', '故木受绳则直，金就<b>砺</b>则利。', '《劝学》｜荀子', '所以木材用墨线量过就直，刀剑等金属靠近磨刀石就锋利。', ['磨炼', '锋利', '兵器'], ['金就<b>砺</b>则利。', '金就砺则利。', '木受绳则直。', '故不积跬步，无以至千里。']),
  item(1, '参省', 'cān xǐng', '检验省察，反省', '君子博学而日<b>参省</b>乎己。', '《劝学》｜荀子', '君子广博地学习，并且每天检验省察自己。', ['参与政事', '三次省察别人', '参观省城'], ['君子博学而日<b>参省</b>乎己。', '吾尝终日而思矣。', '于其身也，则耻师焉。', '余嘉其能行古道。']),
  item(1, '知', 'zhì', '同“智”，智慧', '则<b>知</b>明而行无过矣。', '《劝学》｜荀子', '那么就会智慧明达，行为没有过错了。', ['知道', '同“智”，知识', '掌管'], ['则<b>知</b>明而行无过矣。', '人非生而知之者。', '知之为知之。', '孰能无惑。']),
  item(1, '跂', 'qì', '踮起脚跟', '吾尝<b>跂</b>而望矣。', '《劝学》｜荀子', '我曾经踮起脚跟远望。', ['歧路', '跪下', '抬头'], ['吾尝<b>跂</b>而望矣。', '登高而招。', '青，取之于蓝。', '吾师道也。']),
  item(1, '假', 'jiǎ', '借助，利用', '<b>假</b>舆马者，非利足也。', '《劝学》｜荀子', '借助车马的人，脚并不快。', ['虚假', '假期', '如果'], ['<b>假</b>舆马者，非利足也。', '以是人多以书假余。', '假令仆伏法受诛。', '虽有槁暴。']),
  item(1, '绝', 'jué', '横渡', '假舟楫者，非能水也，而<b>绝</b>江河。', '《劝学》｜荀子', '借助船和桨的人，并不善于游泳，却能横渡江河。', ['断绝', '绝妙', '消失'], ['非能水也，而<b>绝</b>江河。', '率妻子邑人来此绝境。', '佛印绝类弥勒。', '余音袅袅，不绝如缕。']),
  item(1, '生', 'xìng', '同“性”，资质，禀赋', '君子<b>生</b>非异也，善假于物也。', '《劝学》｜荀子', '君子的资质同一般人没有差别，只是善于借助外物。', ['出生', '生活', '生命'], ['君子<b>生</b>非异也。', '人非生而知之者。', '生乎吾前。', '生于吾乎。']),
  item(1, '跬步', 'kuǐ bù', '半步，跨一脚', '故不积<b>跬步</b>，无以至千里。', '《劝学》｜荀子', '所以不积累每一步，就无法到达千里。', ['一步之遥', '快步行走', '脚下的道路'], ['故不积<b>跬步</b>，无以至千里。', '驽马十驾，功在不舍。', '不积小流，无以成江海。', '其出人也远矣。']),
  item(1, '骐骥', 'qí jì', '骏马', '<b>骐骥</b>一跃，不能十步。', '《劝学》｜荀子', '骏马跳跃一次，不能超过十步。', ['千里马车', '劣马', '野兽'], ['<b>骐骥</b>一跃，不能十步。', '驽马十驾，功在不舍。', '假舆马者，非利足也。', '顺风而呼，声非加疾也。']),
  item(1, '驽马', 'nú mǎ', '劣马', '<b>驽马</b>十驾，功在不舍。', '《劝学》｜荀子', '劣马拉车走十天，功效在于不停。', ['骏马', '老马', '战马'], ['<b>驽马</b>十驾，功在不舍。', '骐骥一跃，不能十步。', '蟹六跪而二螯。', '木直中绳。']),
  item(1, '驾', 'jià', '马拉车一天所走的路程', '驽马十<b>驾</b>，功在不舍。', '《劝学》｜荀子', '劣马拉车走十天，功效在于不停。', ['驾驶车辆', '驾驭马匹', '车厢'], ['驽马十<b>驾</b>，功在不舍。', '假舆马者，非利足也。', '骐骥一跃，不能十步。', '木直中绳。']),
  item(1, '锲', 'qiè', '刻，雕刻', '<b>锲</b>而舍之，朽木不折。', '《劝学》｜荀子', '雕刻如果半途而废，腐朽的木头也刻不断。', ['契约', '割断', '舍弃'], ['<b>锲</b>而舍之，朽木不折。', '锲而不舍，金石可镂。', '木直中绳。', '积土成山。']),
  item(1, '镂', 'lòu', '雕刻', '锲而不舍，金石可<b>镂</b>。', '《劝学》｜荀子', '如果不停雕刻，金石也能刻成。', ['空隙', '镂空的花纹', '遗漏'], ['金石可<b>镂</b>。', '锲而舍之，朽木不折。', '金就砺则利。', '其曲中规。']),
  item(1, '用心', 'yòng xīn', '用心专一，专心致志', '蚓无爪牙之利，筋骨之强，<b>用心</b>一也。', '《劝学》｜荀子', '蚯蚓是因为用心专一。', ['使用心思，心情', '用心险恶', '内心使用'], ['<b>用心</b>一也。', '君子博学而日参省乎己。', '故不积跬步。', '则知明而行无过矣。']),
  item(1, '躁', 'zào', '浮躁，不专心', '非蛇鳝之穴无可寄托者，用心<b>躁</b>也。', '《劝学》｜荀子', '若没有蛇鳝的洞穴就无处藏身，是因为用心浮躁。', ['急躁的性格', '快速跳动', '安静'], ['用心<b>躁</b>也。', '用心一也。', '而神明自得。', '学不可以已。']),
  // 劝学：虚词
  item(2, '而', 'ér', '连词，表转折，却', '青，取之于蓝，<b>而</b>青于蓝。', '《劝学》｜荀子', '靛青从蓼蓝中取得，却比蓼蓝颜色更深。', ['表并列', '表递进', '表修饰'], ['惑<b>而</b>不从师。', '君子博学<b>而</b>日参省乎己。', '吾尝终日<b>而</b>思矣。', '蟹六跪<b>而</b>二螯。']),
  item(2, '而', 'ér', '连词，表递进，并且', '君子博学<b>而</b>日参省乎己。', '《劝学》｜荀子', '君子广博地学习，并且每天检查反省自己。', ['表转折', '表修饰', '表承接'], ['君子博学<b>而</b>日参省乎己。', '青取之于蓝，而青于蓝。', '吾尝终日而思矣。', '小学而大遗。']),
  item(2, '而', 'ér', '连词，表并列', '则知明<b>而</b>行无过矣。', '《劝学》｜荀子', '那么就会智慧明达，行为没有过错了。', ['表转折', '表递进', '表修饰'], ['知明<b>而</b>行无过矣。', '蟹六跪<b>而</b>二螯。', '吾尝终日<b>而</b>思矣。', '锲<b>而</b>舍之。']),
  item(2, '而', 'ér', '连词，表修饰', '吾尝终日<b>而</b>思矣。', '《劝学》｜荀子', '我曾经整天空想。', ['表转折', '表递进', '表并列'], ['吾尝终日<b>而</b>思矣。', '登高<b>而</b>招。', '青取之于蓝而青于蓝。', '积善成德而神明自得。']),
  item(2, '而', 'ér', '连词，表因果，于是、就', '积善成德，<b>而</b>神明自得。', '《劝学》｜荀子', '积累善行养成高尚品德，精神就自然明达。', ['表转折', '表修饰', '表并列'], ['积善成德，<b>而</b>神明自得。', '锲而不舍。', '而青于蓝。', '蟹六跪而二螯。']),
  item(2, '于', 'yú', '介词，从', '青，取之<b>于</b>蓝。', '《劝学》｜荀子', '靛青从蓼蓝中取得。', ['比', '向、对', '被'], ['取之<b>于</b>蓝。', '青于蓝。', '善假于物也。', '学于余。']),
  item(2, '于', 'yú', '介词，比', '而青<b>于</b>蓝。', '《劝学》｜荀子', '却比蓼蓝颜色更深。', ['从', '向、对', '在'], ['青<b>于</b>蓝。', '取之于蓝。', '师不必贤于弟子。', '善假于物也。']),
  item(2, '之', 'zhī', '代词，它，指青', '青，取<b>之</b>于蓝。', '《劝学》｜荀子', '靛青从蓼蓝中取得。', ['的', '用于主谓之间，取消句子独立性', '到、往'], ['取<b>之</b>于蓝。', '古<b>之</b>圣人。', '师道<b>之</b>不传也久矣。', '句读<b>之</b>不知。']),
  item(2, '以', 'yǐ', '介词，把', '輮<b>以</b>为轮。', '《劝学》｜荀子', '用火烤使它弯曲制成车轮。', ['用来', '因为', '凭借'], ['輮<b>以</b>为轮。', '作《师说》以贻之。', '无以至千里。', '不以物喜。']),
  item(2, '无以', 'wú yǐ', '没有用来……的办法', '故不积跬步，<b>无以</b>至千里。', '《劝学》｜荀子', '所以不积累每一步，就没有办法到达千里。', ['没有可以看见的', '不以为然', '没有原因'], ['<b>无以</b>至千里。', '不积小流，无以成江海。', '无丝竹之乱耳。', '不足为外人道也。']),
  item(2, '者', 'zhě', '……的人', '<b>假舆马者</b>，非利足也。', '《劝学》｜荀子', '借助车马的人，脚并不快。', ['表判断', '的原因', '表停顿'], ['<b>假舆马者</b>，非利足也。', '不复挺者，輮使之然也。', '师者，所以传道受业解惑也。', '求人可使报秦者。']),
  item(2, '焉', 'yān', '兼词，于之，在那里', '积土成山，风雨兴<b>焉</b>。', '《劝学》｜荀子', '堆积土石成为高山，风雨从那里兴起。', ['语气助词，了', '怎么', '句末感叹'], ['风雨兴<b>焉</b>。', '圣心备焉。', '积水成渊，蛟龙生焉。', '且焉置土石。']),

  // 师说：实词
  item(1, '学者', 'xué zhě', '求学的人', '古之<b>学者</b>必有师。', '《师说》｜韩愈', '古代求学的人一定有老师。', ['有学问的人', '学术研究者', '学校教师'], ['古之<b>学者</b>必有师。', '犹且从师而问焉。', '小学而大遗。', '六艺经传皆通习之。']),
  item(1, '师', 'shī', '以……为师，意动用法', '吾从<b>而师之</b>。', '《师说》｜韩愈', '我跟从他，把他当作老师。', ['老师', '军队', '学习'], ['吾从<b>而师之</b>。', '巫医乐师百工之人。', '师不必贤于弟子。', '古之学者必有师。']),
  item(1, '受', 'shòu', '同“授”，传授', '师者，所以传道<b>受</b>业解惑也。', '《师说》｜韩愈', '老师，是用来传授道理、教授学业、解答疑难问题的人。', ['接受', '遭受', '得到'], ['传道<b>受</b>业解惑也。', '授之书而习其句读者。', '不拘于时。', '余嘉其能行古道。']),
  item(1, '道', 'dào', '道理，学说', '师者，所以传<b>道</b>受业解惑也。', '《师说》｜韩愈', '老师，是用来传授道理、教授学业、解答疑难问题的人。', ['道路', '方法', '说话'], ['传<b>道</b>受业解惑也。', '吾师<b>道</b>也。', '道相似也。', '不足为外人道也。']),
  item(1, '惑', 'huò', '疑惑，疑难问题', '人非生而知之者，孰能无<b>惑</b>？', '《师说》｜韩愈', '人不是生来就懂得道理的，谁能没有疑惑？', ['迷惑别人', '祸患', '通“获”'], ['孰能无<b>惑</b>？', '惑而不从师。', '惑之不解。', '于其身也，则耻师焉，惑矣。']),
  item(1, '固', 'gù', '本来', '其闻道也<b>固</b>先乎吾。', '《师说》｜韩愈', '他懂得道理本来就比我早。', ['坚固', '固然', '顽固'], ['<b>固</b>知一死生为虚诞。', '本固邦宁。', '固国不以山溪之险。', '固若金汤。']),
  item(1, '从', 'cóng', '跟随', '吾<b>从</b>而师之。', '《师说》｜韩愈', '我跟从他，把他当作老师。', ['从事', '依从命令', '由自'], ['吾<b>从</b>而师之。', '惑而不<b>从</b>师。', '从郦山下。', '当余之从师也。']),
  item(1, '庸', 'yōng', '岂，难道', '吾师道也，夫<b>庸</b>知其年之先后生于吾乎？', '《师说》｜韩愈', '我学习的是道理，哪里要了解他的年龄比我大还是小呢？', ['平庸', '功劳', '用来'], ['夫<b>庸</b>知其年之先后生于吾乎？', '王侯将相宁有种乎？', '且庸人尚羞之。', '师道之不传也久矣。']),
  item(1, '出人', 'chū rén', '超过一般人', '古之圣人，其<b>出人</b>也远矣。', '《师说》｜韩愈', '古代的圣人远远超过一般人。', ['从人群中出来', '出入他人家门', '离开人世'], ['其<b>出人</b>也远矣。', '其下圣人也亦远矣。', '师不必贤于弟子。', '圣益圣，愚益愚。']),
  item(1, '下', 'xià', '低于', '今之众人，其<b>下</b>圣人也亦远矣。', '《师说》｜韩愈', '现在的一般人远远低于圣人。', ['向下', '攻下城池', '到下面'], ['其<b>下</b>圣人也亦远矣。', '其出人也远矣。', '下视其辙。', '名之者谁。']),
  item(1, '耻', 'chǐ', '以……为耻，意动用法', '而<b>耻</b>学于师。', '《师说》｜韩愈', '却以向老师学习为可耻。', ['羞耻的事情', '使……感到羞耻', '耻笑'], ['而<b>耻</b>学于师。', '于其身也，则<b>耻</b>师焉。', '不耻相师。', '士大夫之族。']),
  item(1, '益', 'yì', '更加', '是故圣<b>益</b>圣，愚益愚。', '《师说》｜韩愈', '因此圣人更加圣明，愚人更加愚昧。', ['利益', '增加', '好处'], ['圣<b>益</b>圣，愚益愚。', '精益求精。', '曾益其所不能。', '有所广益。']),
  item(1, '所以', 'suǒ yǐ', '……的原因', '圣人之<b>所以</b>为圣，愚人之所以为愚。', '《师说》｜韩愈', '圣人之所以圣明、愚人之所以愚昧。', ['用来……的', '表示结果', '因为所以'], ['圣人之<b>所以</b>为圣。', '此先汉所以兴隆也。', '师者，所以传道受业解惑也。', '所以遣将守关者。']),
  item(1, '所以', 'suǒ yǐ', '用来……的', '师者，<b>所以</b>传道受业解惑也。', '《师说》｜韩愈', '老师，是用来传授道理、教授学业、解答疑难问题的人。', ['……的原因', '表示结果', '因为所以'], ['师者，<b>所以</b>传道受业解惑也。', '所以遣将守关者。', '圣人之所以为圣。', '此先汉所以兴隆也。']),
  item(1, '身', 'shēn', '自己', '于其<b>身</b>也，则耻师焉。', '《师说》｜韩愈', '对于自己，却以从师学习为可耻。', ['身体', '亲自', '身世'], ['于其<b>身</b>也，则耻师焉。', '将军身被坚执锐。', '身死人手。', '身当恩遇常轻敌。']),
  item(1, '句读', 'jù dòu', '古人指文辞的休止和停顿', '彼童子之师，授之书而习其<b>句读</b>者。', '《师说》｜韩愈', '那些儿童的老师，只是教孩子读书、学习断句的。', ['句子的意思', '读书的声音', '文章的标题'], ['习其<b>句读</b>者。', '授之书而习其句读者。', '小学而大遗。', '惑之不解。']),
  item(1, '或', 'huò', '有的，有些', '句读之不知，惑之不解，<b>或</b>师焉，或不焉。', '《师说》｜韩愈', '不理解句读，不能解决疑惑，有的从师学习，有的不从师学习。', ['有时', '或者', '或许'], ['<b>或</b>师焉，或不焉。', '或异二者之为。', '或命巾车。', '或以为死，或以为亡。']),
  item(1, '小学', 'xiǎo xué', '小的方面学习', '<b>小学</b>而大遗，吾未见其明也。', '《师说》｜韩愈', '小的方面学习，大的方面却丢弃了。', ['儿童启蒙学校', '小学教育', '小规模学校'], ['<b>小学</b>而大遗。', '吾未见其明也。', '授之书而习其句读者。', '彼童子之师。']),
  item(1, '遗', 'yí', '丢弃，放弃', '小学而大<b>遗</b>，吾未见其明也。', '《师说》｜韩愈', '小的方面学习，大的方面却丢弃了，我看不出他的明智。', ['遗留', '赠送', '遗失'], ['小<b>学而大遗</b>。', '路不拾遗。', '小学而大遗。', '余嘉其能行古道。']),
  item(1, '族', 'zú', '类，家族', '士大夫之<b>族</b>，曰师曰弟子云者。', '《师说》｜韩愈', '士大夫这一类人，一听到老师、弟子的称呼。', ['宗族', '种族', '族长'], ['士大夫之<b>族</b>。', '非我族类。', '族秦者秦也。', '山东豪俊遂并起而亡秦族。']),
  item(1, '相', 'xiāng', '互相', '巫医乐师百工之人，不耻<b>相</b>师。', '《师说》｜韩愈', '巫医、乐师和各种工匠，不以互相学习为可耻。', ['相貌', '宰相', '观察'], ['不耻<b>相</b>师。', '儿童<b>相</b>见不相识。', '黄泉下相见。', '及时相遣归。']),
  item(1, '谀', 'yú', '谄媚，奉承', '位卑则足羞，官盛则近<b>谀</b>。', '《师说》｜韩愈', '地位低就觉得可羞，官职高就近于谄媚。', ['批评', '赞美', '愚昧'], ['近<b>谀</b>。', '便可白公姥，及时相遣归。', '不耻相师。', '士大夫之族。']),
  item(1, '不齿', 'bù chǐ', '不屑与之同列，看不起', '巫医乐师百工之人，<b>不齿</b>。', '《师说》｜韩愈', '巫医、乐师和各种工匠，士大夫们看不起。', ['不记得年龄', '不愿意吃饭', '没有牙齿'], ['<b>不齿</b>。', '巫医乐师百工之人，不<b>耻</b>相师。', '不拘于时。', '吾未见其明也。']),
  item(1, '乃', 'nǎi', '竟，却', '今其智<b>乃</b>反不能及。', '《师说》｜韩愈', '现在他们的智慧反而赶不上这些人。', ['于是', '就是', '你的'], ['智<b>乃</b>反不能及。', '<b>乃</b>不知有汉。', '蒙<b>乃</b>始就学。', '乃重修岳阳楼。']),
  item(1, '及', 'jí', '赶得上，比得上', '今其智乃反不能<b>及</b>。', '《师说》｜韩愈', '现在他们的智慧反而赶不上这些人。', ['到达', '等到', '以及'], ['不能<b>及</b>。', '徐公何能<b>及</b>君也。', '及郡下，诣太守。', '若有作奸犯科及为忠善者。']),
  item(1, '攻', 'gōng', '学习，研究', '术业有专<b>攻</b>，如是而已。', '《师说》｜韩愈', '学术技艺各有专门研究，如此而已。', ['攻打', '攻击', '批评'], ['术业有专<b>攻</b>。', '进<b>攻</b>则与斗。', '他山之石，可以<b>攻</b>玉。', '故木受绳则直。']),
  item(1, '贻', 'yí', '赠送', '作《师说》以<b>贻</b>之。', '《师说》｜韩愈', '写这篇《师说》来赠送给他。', ['遗留', '贻误', '等待'], ['以<b>贻</b>之。', '尝<b>贻</b>余核舟一。', '路不拾遗。', '余嘉其能行古道。']),
  // 师说：虚词
  item(2, '之', 'zhī', '代词，他，指老师', '吾从而师<b>之</b>。', '《师说》｜韩愈', '我跟从他，把他当作老师。', ['的', '用于主谓之间', '宾语前置标志'], ['师<b>之</b>。', '古<b>之</b>圣人。', '师道<b>之</b>不传也久矣。', '句读<b>之</b>不知。']),
  item(2, '之', 'zhī', '助词，的', '古<b>之</b>圣人，其出人也远矣。', '《师说》｜韩愈', '古代的圣人远远超过一般人。', ['代词，他', '用于主谓之间', '宾语前置标志'], ['古<b>之</b>圣人。', '童子<b>之</b>师。', '吾从而师之。', '师道之不传也久矣。']),
  item(2, '之', 'zhī', '用于主谓之间，取消句子独立性', '师道<b>之</b>不传也久矣。', '《师说》｜韩愈', '从师学习的风尚失传已经很久了。', ['助词，的', '代词，他', '宾语前置标志'], ['师道<b>之</b>不传也久矣。', '圣人<b>之</b>所以为圣。', '古之圣人。', '句读之不知。']),
  item(2, '之', 'zhī', '宾语前置的标志，不译', '句读<b>之</b>不知，惑<b>之</b>不解。', '《师说》｜韩愈', '不理解句读，不能解决疑惑。', ['助词，的', '代词，他', '用于主谓之间'], ['句读<b>之</b>不知。', '惑<b>之</b>不解。', '师者，所以传道受业解惑也。', '童子之师。']),
  item(2, '其', 'qí', '代词，他的，指古代圣人', '<b>其</b>闻道也固先乎吾，吾从而师之。', '《师说》｜韩愈', '他懂得道理本来就比我早，我跟从他把他当作老师。', ['表揣测，大概', '表反问，难道', '其中'], ['<b>其</b>闻道也固先乎吾。', '<b>其</b>皆出于此乎？', '其孰能讥之乎？', '且行千里，其谁不知。']),
  item(2, '其', 'qí', '语气副词，表揣测，大概', '圣人之所以为圣，愚人之所以为愚，<b>其</b>皆出于此乎？', '《师说》｜韩愈', '圣人之所以圣明、愚人之所以愚昧，大概都出于这个原因吧？', ['代词，他的', '表反问，难道', '其中'], ['<b>其</b>皆出于此乎？', '<b>其</b>闻道也固先乎吾。', '其孰能讥之乎？', '尔其无忘乃父之志。']),
  item(2, '而', 'ér', '连词，表承接', '人非生<b>而</b>知之者。', '《师说》｜韩愈', '人不是生下来就懂得道理的。', ['表转折', '表并列', '表修饰'], ['生<b>而</b>知之者。', '授之书<b>而</b>习其句读者。', '惑<b>而</b>不从师。', '则群聚<b>而</b>笑之。']),
  item(2, '而', 'ér', '连词，表转折，却', '惑<b>而</b>不从师。', '《师说》｜韩愈', '有了疑惑却不跟从老师学习。', ['表承接', '表修饰', '表并列'], ['惑<b>而</b>不从师。', '小学<b>而</b>大遗。', '生而知之者。', '授之书而习其句读者。']),
  item(2, '于', 'yú', '介词，向', '不拘<b>于</b>时，学<b>于</b>余。', '《师说》｜韩愈', '不受时俗拘束，向我学习。', ['比', '被', '从'], ['学<b>于</b>余。', '不拘<b>于</b>时。', '师不必贤于弟子。', '青取之于蓝。']),
  item(2, '于', 'yú', '介词，表被动，被', '不拘<b>于</b>时，学于余。', '《师说》｜韩愈', '不受时俗拘束，向我学习。', ['向', '比', '从'], ['拘<b>于</b>时。', '学于余。', '师不必贤于弟子。', '青取之于蓝。']),
  item(2, '于', 'yú', '介词，比', '师不必贤<b>于</b>弟子。', '《师说》｜韩愈', '老师不一定比学生贤能。', ['向', '被', '从'], ['贤<b>于</b>弟子。', '学于余。', '不拘于时。', '青取之于蓝。']),
  item(2, '以', 'yǐ', '连词，表目的，来', '作《师说》<b>以</b>贻之。', '《师说》｜韩愈', '写这篇《师说》来赠送给他。', ['把', '因为', '凭借'], ['<b>以</b>贻之。', '以勇气闻于诸侯。', '輮以为轮。', '不以物喜。']),
  item(2, '焉', 'yān', '语气助词，了', '或师<b>焉</b>，或不焉。', '《师说》｜韩愈', '有的从师学习，有的不从师学习。', ['兼词，在那里', '怎么', '代词，他'], ['或师<b>焉</b>。', '积土成山，风雨兴焉。', '且焉置土石。', '积水成渊，蛟龙生焉。']),
];

function sqlString(value) {
  return `'${String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\u0000/g, '')}'`;
}

function htmlText(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function richText(value) {
  return htmlText(value).replace(/&lt;b&gt;/g, '<mark>').replace(/&lt;\/b&gt;/g, '</mark>');
}

function sourceFor(title) {
  const book = BOOKS[title];
  return `部编版｜高中必修上册｜${book.unitName}｜《${title}》`;
}

const records = data.map((row, index) => ({
  id: index + 1,
  ...row,
  book: row.source.match(/《(.*?)》/)?.[1] || '',
  source: sourceFor(row.source.match(/《(.*?)》/)?.[1] || ''),
  unitId: BOOKS[row.source.match(/《(.*?)》/)?.[1] || ''].unitId,
  unitName: BOOKS[row.source.match(/《(.*?)》/)?.[1] || ''].unitName,
}));

function questionOptions(row) {
  return [q(row.meaning, true), ...row.distractors.map(text => q(text))];
}

function questionRows() {
  const rows = [];
  let id = 1;
  for (const row of records) {
    rows.push({
      id: id++, senseId: row.id, type: 1,
      stem: `下列对例句“${row.example.replace(/<b>|<\/b>/g, '')}”中“${row.word}”的解释，正确的一项是`,
      options: questionOptions(row),
    });
    rows.push({
      id: id++, senseId: row.id, type: 2,
      stem: `下列句子中“${row.word}”的意义和用法，与例句相同的一项是`,
      options: row.compareOptions.map((content, index) => q(content, index === row.compareCorrect)),
    });
  }
  return rows;
}

function senseSql() {
  const values = records.map(row => `(${row.id}, ${row.wordClass}, ${sqlString(row.word)}, ${sqlString(row.pinyin)}, ${sqlString(row.meaning)}, ${sqlString(row.example)}, ${sqlString(row.source)}, ${sqlString(row.exampleTrans)}, 0, 0)`).join(',\n');
  return `-- 语文积累本-高中部编版必修上册实虚词词义例句\n-- 内容范围：《芣苢》《劝学》《师说》核心词\nSTART TRANSACTION;\n\nINSERT INTO \`edu_chn_word_sense\`\n(\`id\`, \`word_class\`, \`word\`, \`pinyin\`, \`meaning\`, \`example\`, \`source\`, \`example_trans\`, \`status\`, \`is_del\`)\nVALUES\n${values}\nON DUPLICATE KEY UPDATE\n\`word_class\` = VALUES(\`word_class\`),\n\`word\` = VALUES(\`word\`),\n\`pinyin\` = VALUES(\`pinyin\`),\n\`meaning\` = VALUES(\`meaning\`),\n\`example\` = VALUES(\`example\`),\n\`source\` = VALUES(\`source\`),\n\`example_trans\` = VALUES(\`example_trans\`),\n\`status\` = VALUES(\`status\`),\n\`is_del\` = VALUES(\`is_del\`);\n\nCOMMIT;\n`;
}

function questionSql() {
  const rows = questionRows();
  const values = rows.map(row => `(${row.id}, ${row.senseId}, ${row.type}, ${sqlString(row.stem)}, ${sqlString(JSON.stringify(row.options))}, 0, 0)`).join(',\n');
  return `-- 语文积累本-高中部编版必修上册实虚词题目\n-- 每个 sense_id 固定生成：1=词义选择，2=辨析选择\nSTART TRANSACTION;\n\nINSERT INTO \`edu_chn_word_question\`\n(\`id\`, \`sense_id\`, \`question_type\`, \`stem\`, \`options_json\`, \`status\`, \`is_del\`)\nVALUES\n${values}\nON DUPLICATE KEY UPDATE\n\`sense_id\` = VALUES(\`sense_id\`),\n\`question_type\` = VALUES(\`question_type\`),\n\`stem\` = VALUES(\`stem\`),\n\`options_json\` = VALUES(\`options_json\`),\n\`status\` = VALUES(\`status\`),\n\`is_del\` = VALUES(\`is_del\`);\n\nCOMMIT;\n`;
}

function csvString(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function scopeCsv() {
  const header = ['version_id', 'version_name', 'volume_id', 'volume_name', 'unit_id', 'unit_name', 'chapter', 'word_class', 'word', 'sense_id'];
  const rows = records.map(row => [VERSION.id, VERSION.name, VOLUME.id, VOLUME.name, row.unitId, row.unitName, `《${row.book}》`, row.wordClass === 1 ? '实词' : '虚词', row.word, row.id]);
  return [header, ...rows].map(row => row.map(csvString).join(',')).join('\n') + '\n';
}

function renderMeaning(row) {
  return `<div class="meaning-block"><div class="meaning-head"><span class="type-tag">${row.wordClass === 1 ? '实词' : '虚词'}</span><b>${htmlText(row.meaning)}</b></div><div class="example-text">${richText(row.example)}</div><div class="example-meta"><span>${htmlText(row.book)}</span><span>${htmlText(row.exampleTrans)}</span></div></div>`;
}

function renderCard(group) {
  const examples = group.rows.map(row => renderMeaning(row)).join('');
  return `<article class="word-card" data-class="${group.wordClass}" data-book="${htmlText(group.book)}" data-word="${htmlText(group.word)}"><div class="word-card-head"><div><div class="word-title">${htmlText(group.word)}</div><div class="pinyin">${htmlText(group.pinyin)}</div></div><button class="question-btn" data-open-word="${htmlText(group.word)}">查看题目</button></div><div class="meaning-list">${examples}</div></article>`;
}

function previewHtml() {
  const groups = [...new Map(records.map(row => [row.word, { word: row.word, pinyin: row.pinyin, wordClass: row.wordClass === 1 ? '实词' : '虚词', book: row.book, rows: [] }])).values()];
  records.forEach(row => groups.find(group => group.word === row.word).rows.push(row));
  const cardMarkup = groups.map(renderCard).join('');
  const dataJson = JSON.stringify(records).replace(/<\/script/gi, '<\\/script');
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>语文积累本｜实虚词学生端预览</title>
<style>
:root{--ink:#22304a;--muted:#7d8ba5;--line:#e5eaf3;--paper:#f6f8fc;--white:#fff;--blue:#2f6df6;--blue-soft:#edf3ff;--teal:#18a693;--teal-soft:#e9fbf8;--purple:#7658e8;--shadow:0 18px 55px rgba(24,46,91,.16)}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color:var(--ink);background:#202b42}button,select{font:inherit;cursor:pointer}.tablet{width:min(1280px,calc(100vw - 42px));min-width:960px;min-height:720px;margin:21px auto;background:var(--paper);border-radius:24px;overflow:hidden;box-shadow:var(--shadow)}.topbar{height:70px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 26px}.brand{display:flex;gap:12px;align-items:center}.brand-mark{width:38px;height:38px;border-radius:12px;background:linear-gradient(145deg,#4d8cff,#36c7c1);display:grid;place-items:center;color:white;font-weight:800;font-size:19px}.brand b{font-size:17px}.brand small{display:block;color:var(--muted);font-size:11px;margin-top:3px}.context{display:flex;gap:9px;align-items:center}.pill{padding:7px 11px;border-radius:999px;font-size:12px;font-weight:700}.pill.blue{background:var(--blue-soft);color:var(--blue)}.pill.green{background:var(--teal-soft);color:var(--teal)}.shell{display:grid;grid-template-columns:82px 1fr;min-height:650px}.sidebar{background:#fff;border-right:1px solid var(--line);display:flex;flex-direction:column;align-items:center;padding:18px 10px;gap:10px}.nav{width:60px;height:62px;border:0;border-radius:16px;background:transparent;color:#97a3b8;font-size:11px}.nav span{display:block;font-size:21px;margin-bottom:4px}.nav.active{background:var(--teal-soft);color:var(--teal);font-weight:750}.workspace{padding:28px 34px 42px;background:linear-gradient(180deg,#f8faff,#f5f8fc)}.page-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}.eyebrow{font-size:12px;color:var(--teal);font-weight:750;letter-spacing:.7px;margin-bottom:7px}h1{margin:0 0 8px;font-size:29px;letter-spacing:-.8px}p{margin:0;color:var(--muted);font-size:13px;line-height:1.7}.filters{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:17px;padding:14px 16px;background:#fff;border:1px solid var(--line);border-radius:15px}.filters label{font-size:12px;color:#8b99ae}.filters select{border:1px solid var(--line);border-radius:10px;background:#fff;color:#526582;padding:9px 11px;min-width:138px}.count{margin-left:auto;color:#8b99ae;font-size:12px}.count b{color:var(--teal);font-size:16px;margin-right:3px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.word-card{background:#fff;border:1px solid var(--line);border-radius:17px;padding:18px;box-shadow:0 4px 15px rgba(39,67,116,.04)}.word-card-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}.word-title{font-family:"Songti SC","STSong",serif;font-size:32px;color:#24535b}.pinyin{font-size:12px;color:var(--teal);margin-top:3px}.question-btn{border:0;border-radius:10px;padding:9px 12px;background:var(--blue);color:#fff;font-size:12px;font-weight:700;box-shadow:0 6px 13px rgba(47,109,246,.18)}.meaning-block{padding:12px 0;border-top:1px solid #eef2f3}.meaning-block:first-child{border-top:0;padding-top:2px}.meaning-head{display:flex;gap:8px;align-items:center;color:#24535b;font-size:14px}.type-tag{padding:4px 7px;border-radius:6px;background:var(--teal-soft);color:var(--teal);font-size:10px;font-weight:750}.example-text{margin-top:8px;font-family:"Songti SC","STSong",serif;font-size:16px;color:#3a5260;line-height:1.7}.example-text mark,.drawer-example mark{background:#bdebd8;color:#2a4d47;border-radius:3px;padding:0 2px}.example-meta{display:grid;gap:3px;margin-top:6px;color:#8d9aad;font-size:11px;line-height:1.55}.empty{padding:50px;background:#fff;border:1px dashed #cbd8ef;border-radius:15px;text-align:center;color:#96a3b7;grid-column:1/-1}.drawer-mask{display:none;position:fixed;inset:0;background:rgba(17,29,53,.36);z-index:5}.drawer{display:none;position:fixed;z-index:6;top:0;right:0;width:min(640px,88vw);height:100vh;background:#fbfcff;box-shadow:-14px 0 35px rgba(18,34,67,.22);padding:25px 27px;overflow:auto}.drawer.open,.drawer-mask.open{display:block}.drawer-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding-bottom:16px;border-bottom:1px solid var(--line)}.drawer-head h2{margin:0;font-family:"Songti SC","STSong",serif;font-size:32px;color:#24535b}.drawer-close{border:1px solid var(--line);background:#fff;border-radius:9px;padding:7px 11px;color:#6e7f9a}.drawer-subtitle{margin-top:5px;color:var(--muted);font-size:12px}.question-group{padding:18px 0;border-bottom:1px solid #e8edf5}.question-source{font-size:11px;color:var(--blue);font-weight:700;margin-bottom:7px}.drawer-example{font-family:"Songti SC","STSong",serif;font-size:18px;line-height:1.75;color:#30425c;margin-bottom:11px}.question-box{border:1px solid #e2e8f2;border-radius:12px;background:#fff;padding:13px;margin-top:9px}.question-label{display:inline-block;padding:4px 7px;border-radius:6px;background:var(--blue-soft);color:var(--blue);font-size:10px;font-weight:750;margin-bottom:8px}.question-stem{font-size:13px;line-height:1.7;color:#4d6080}.options{display:grid;gap:7px;margin-top:9px}.option{padding:8px 9px;background:#f7f9fc;border-radius:8px;color:#667894;font-size:12px;line-height:1.55}.option::before{content:attr(data-label);display:inline-grid;place-items:center;width:18px;height:18px;border-radius:5px;background:#e7eefc;color:var(--blue);font-size:10px;margin-right:7px}.hint{padding:12px 14px;background:#fff7e5;border-radius:10px;color:#9c751e;font-size:12px;line-height:1.6;margin-top:16px}.rotate{display:none}.rotate-card{max-width:320px;padding:28px;background:#fff;border-radius:18px;text-align:center}.rotate-card b{display:block;font-size:25px;margin-bottom:8px}.rotate-card p{font-size:13px}@media(max-width:959px){body{background:#152039}.tablet{display:none}.rotate{display:flex;position:fixed;inset:0;align-items:center;justify-content:center;padding:24px}.rotate-card{display:block}}
</style></head><body>
<div class="rotate"><div class="rotate-card"><b>请横屏查看</b><p>学生端实虚词预览按平板横屏布局设计。</p></div></div>
<main class="tablet"><header class="topbar"><div class="brand"><div class="brand-mark">语</div><div><b>语文自学 · 积累本</b><small>学生端内容效果预览</small></div></div><div class="context"><span class="pill blue">部编版</span><span class="pill green">高中必修上册</span></div></header><div class="shell"><nav class="sidebar"><button class="nav active"><span>词</span>实虚词</button><button class="nav"><span>文</span>古诗文</button></nav><section class="workspace"><div class="page-head"><div><div class="eyebrow">课内同步词书</div><h1>文言文实虚词</h1><p>按教材篇目学习核心词义，例句和练习一并掌握。</p></div><span class="pill green">${records.length} 条词义</span></div><div class="filters"><label>筛选</label><select id="classFilter"><option value="全部">全部词类</option><option value="实词">实词</option><option value="虚词">虚词</option></select><select id="bookFilter"><option value="全部">全部篇目</option>${Object.keys(BOOKS).map(book => `<option>${book}</option>`).join('')}</select><span class="count"><b id="visibleCount">${groups.length}</b> 个原词</span></div><div class="grid" id="cardGrid">${cardMarkup}</div></section></div></main>
<div class="drawer-mask" id="mask"></div><aside class="drawer" id="drawer"><div id="drawerBody"></div></aside>
<script>const records=${dataJson};const groups=${JSON.stringify(groups)};const cardGrid=document.querySelector('#cardGrid');const classFilter=document.querySelector('#classFilter');const bookFilter=document.querySelector('#bookFilter');const visibleCount=document.querySelector('#visibleCount');const drawer=document.querySelector('#drawer');const mask=document.querySelector('#mask');const drawerBody=document.querySelector('#drawerBody');const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const rich=s=>esc(s).replace(/&lt;b&gt;/g,'<mark>').replace(/&lt;\\/b&gt;/g,'</mark>');const rowsByWord=word=>records.filter(row=>row.word===word);function draw(){const cls=classFilter.value,book=bookFilter.value;const visible=groups.filter(g=>(cls==='全部'||g.wordClass===cls)&&(book==='全部'||rowsByWord(g.word).some(row=>row.book===book)));visibleCount.textContent=visible.length;cardGrid.innerHTML=visible.length?visible.map(g=>'<article class="word-card"><div class="word-card-head"><div><div class="word-title">'+esc(g.word)+'</div><div class="pinyin">'+esc(g.pinyin)+'</div></div><button class="question-btn" data-open-word="'+esc(g.word)+'">查看题目</button></div><div class="meaning-list">'+rowsByWord(g.word).filter(row=>book==='全部'||row.book===book).map(row=>'<div class="meaning-block"><div class="meaning-head"><span class="type-tag">'+(row.wordClass===1?'实词':'虚词')+'</span><b>'+esc(row.meaning)+'</b></div><div class="example-text">'+rich(row.example)+'</div><div class="example-meta"><span>'+esc(row.book)+'</span><span>'+esc(row.exampleTrans)+'</span></div></div>').join('')+'</div></article>').join(''):'<div class="empty">当前筛选范围暂无词义内容</div>';cardGrid.querySelectorAll('[data-open-word]').forEach(btn=>btn.onclick=()=>openDrawer(btn.dataset.openWord))}function openDrawer(word){const rows=rowsByWord(word);drawerBody.innerHTML='<div class="drawer-head"><div><h2>'+esc(word)+'</h2><div class="drawer-subtitle">'+esc(rows[0].pinyin)+' · '+(rows[0].wordClass===1?'实词':'虚词')+' · 共 '+rows.length+' 条词义例句</div></div><button class="drawer-close" id="closeDrawer">关闭</button></div>'+rows.map((row,index)=>'<section class="question-group"><div class="question-source">例句 '+(index+1)+' · '+esc(row.book)+'</div><div class="drawer-example">'+rich(row.example)+'</div><div class="question-box"><span class="question-label">题型一 · 词义选择</span><div class="question-stem">下列对例句中“'+esc(row.word)+'”的解释，正确的一项是</div><div class="options">'+[row.meaning,...row.distractors].map((x,i)=>'<div class="option" data-label="'+String.fromCharCode(65+i)+'">'+esc(x)+'</div>').join('')+'</div></div><div class="question-box"><span class="question-label">题型二 · 辨析选择</span><div class="question-stem">下列句子中“'+esc(row.word)+'”的意义和用法，与例句相同的一项是</div><div class="options">'+row.compareOptions.map((x,i)=>'<div class="option" data-label="'+String.fromCharCode(65+i)+'">'+rich(x)+'</div>').join('')+'</div></div></section>').join('')+'<div class="hint">本页面仅用于人工预览内容可读性，题目选项不展示答案状态。</div>';drawer.classList.add('open');mask.classList.add('open');document.querySelector('#closeDrawer').onclick=closeDrawer}function closeDrawer(){drawer.classList.remove('open');mask.classList.remove('open')}classFilter.onchange=draw;bookFilter.onchange=draw;mask.onclick=closeDrawer;draw();</script></body></html>`;
}

fs.writeFileSync(path.join(ROOT, 'sql', 'edu_chn_word_sense.sql'), senseSql());
fs.writeFileSync(path.join(ROOT, 'sql', 'edu_chn_word_question.sql'), questionSql());
fs.writeFileSync(path.join(ROOT, 'word_book_scope.csv'), scopeCsv());
fs.writeFileSync(path.join(ROOT, 'demo/yuwen/accumulation/word-student-preview.html'), previewHtml());
console.log(JSON.stringify({ senses: records.length, questions: questionRows().length, words: new Set(records.map(row => row.word)).size, books: Object.keys(BOOKS), outputs: ['sql/edu_chn_word_sense.sql', 'sql/edu_chn_word_question.sql', 'word_book_scope.csv', 'demo/yuwen/accumulation/word-student-preview.html'] }, null, 2));
