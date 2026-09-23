const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { formatMeaning } = require('./word_meaning');
const { buildQuestions } = require('./word_question_options');
const externalExamples = require('./yuwen_word_external_examples');

const ROOT = '/Users/tal/Desktop/tog';
const SQL_DIR = path.join(ROOT, 'sql');

const VERSION = { id: '5e21a87b47a648eb9da56a51381e1611', name: '统编版（2024）六三制' };
const BASE_SENSE_ID = 1001;
const BASE_QUESTION_ID = 2001;
const BASE_CATALOG_ID = 3001;

const md5 = value => crypto.createHash('md5').update(value).digest('hex');
const volumeId = volume => md5(`${VERSION.name}|${volume}`);
const unitId = (volume, unit) => md5(`${VERSION.name}|${volume}|${unit}`);

// 词条格式：word, meaning, example, translation, pinyin（可选）
const r = (word, meaning, example, translation, pinyin) => ({ word, meaning, example, translation, pinyin });
const chapter = (volume, unit, title, wordClass, rows) => ({ volume, unit, title, wordClass, rows });

const chapters = [
  chapter('七年级上册', '第二单元（课内）', '咏雪', 1, [
    r('骤', '急', '俄而雪骤。', '不一会儿，雪下得急了。'),
    r('若', '如，比得上', '未若柳絮因风起。', '不如比作柳絮乘风飞舞。'),
    r('拟', '相比', '撒盐空中差可拟。', '把盐撒在空中大体可以相比。'),
  ]),
  chapter('七年级上册', '第二单元（课内）', '咏雪', 2, [
    r('之', '用于人名，无实义（“王凝之”）', '即公大兄无奕女，左将军王凝之妻也。', '她就是谢太傅哥哥的长女，左将军王凝之的妻子。'),
  ]),
  chapter('七年级上册', '第二单元（课内）', '陈太丘与友期行', 1, [
    r('期', '约定', '陈太丘与友期行，期日中。', '陈太丘和朋友约定一同出行，约定的时间是正午。'),
    r('去', '离开', '太丘舍去，去后乃至。', '陈太丘离开以后，朋友才到。'),
    r('委', '舍弃', '与人期行，相委而去。', '和别人约好一同出行，却丢下别人离开。'),
    r('引', '拉，牵拉', '友人惭，下车引之。', '朋友感到惭愧，下车拉元方。'),
    r('顾', '回头看', '元方入门不顾。', '元方走进家门，没有回头看他。'),
  ]),
  chapter('七年级上册', '第二单元（课内）', '陈太丘与友期行', 2, [
    r('乃', '才', '去后乃至。', '陈太丘离开以后朋友才到。'),
    r('之', '代词，他，指元方', '下车引之。', '下车拉元方。'),
  ]),
  chapter('七年级上册', '第三单元（课内）', '论语十二章', 1, [
    r('愠', '生气，恼怒', '人不知而不愠。', '别人不了解我，我却不生气。'),
    r('省', '反省', '吾日三省吾身。', '我每天多次反省自己。'),
    r('罔', '迷惑，感到迷茫', '学而不思则罔。', '只学习却不思考，就会感到迷茫。'),
    r('殆', '疑惑', '思而不学则殆。', '只思考却不学习，就会有疑惑。'),
  ]),
  chapter('七年级上册', '第三单元（课内）', '论语十二章', 2, [
    r('而', '连词，表转折，却', '人不知而不愠。', '别人不了解我，我却不生气。'),
    r('而', '连词，表承接', '温故而知新。', '温习学过的知识，可以得到新的理解和体会。'),
    r('之', '代词，指学过的知识', '学而时习之。', '学习了知识，然后按时温习它。'),
    r('其', '代词，他们的', '择其善者而从之。', '选择他们的优点来学习。'),
    r('于', '介词，对，对于', '于我如浮云。', '对于我来说，就像浮云一样。'),
  ]),
  chapter('七年级上册', '第四单元（课内）', '诫子书', 1, [
    r('致', '达到', '非宁静无以致远。', '不内心宁静就无法达到远大的目标。'),
    r('驰', '疾行，逝去', '年与时驰，意与日去。', '年华随时光飞驰，意志随岁月消逝。'),
    r('去', '消失，逝去', '年与时驰，意与日去。', '年华随时光飞驰，意志随岁月消逝。'),
  ]),
  chapter('七年级上册', '第四单元（课内）', '诫子书', 2, [
    r('以', '连词，表目的，来', '静以修身，俭以养德。', '用宁静来修养身心，用节俭来培养品德。'),
    r('之', '助词，的', '夫君子之行，静以修身。', '君子的行为操守，以宁静来修养身心。'),
  ]),
  chapter('七年级上册', '第五单元（课内）', '狼', 1, [
    r('止', '停止', '一狼得骨止，一狼仍从。', '一只狼得到骨头停下了，另一只狼仍然跟随着。'),
    r('从', '跟随', '一狼仍从。', '另一只狼仍然跟随着。'),
    r('顾', '看，视察', '顾野有麦场。', '屠户回头看见野外有一个麦场。'),
    r('绝', '截断（范围词原文待复核）', null, '附件将“绝”列入范围，但现行篇目原文未检出该字，暂保留草稿待复核。'),
    r('暇', '空闲', '目似瞑，意暇甚。', '眼睛好像闭上了，神情悠闲得很。'),
  ]),
  chapter('七年级上册', '第五单元（课内）', '狼', 2, [
    r('之', '代词，它，指狼', '屠自后断其股，亦毙之。', '屠户从后面砍断了狼的大腿，也把狼杀死了。'),
    r('其', '代词，它的，指狼', '一狼洞其中，意将隧入以攻其后也。', '一只狼在其中打洞，想要从通道进入来攻击屠户的后面。'),
    r('以', '连词，表目的，来', '意将隧入以攻其后也。', '想要从通道进入来攻击屠户的后面。'),
    r('而', '连词，表转折，却', '而两狼之并驱如故。', '可是两只狼像原来一样一起追赶。'),
  ]),
  chapter('七年级上册', '第六单元（课内）', '穿井得一人', 1, [
    r('闻', '听说，听到', '有闻而传之者。', '有人听到这件事，把它传播出去。'),
    r('道', '讲述，传播', '国人道之。', '都城的人谈论这件事。'),
    r('若', '如，比得上', '不若无闻也。', '还不如没有听说这件事。'),
  ]),
  chapter('七年级上册', '第六单元（课内）', '穿井得一人', 2, [
    r('之', '助词，的', '宋之丁氏，家无井而出溉汲。', '宋国有一户姓丁的人家，家里没有水井，常到外面打水浇田。'),
    r('于', '介词，被', '闻之于宋君。', '这件事被宋国国君听到了。'),
    r('其', '代词，他的', '其家甚智其子。', '这家人很赞赏他的儿子。'),
  ]),
  chapter('七年级上册', '第六单元（课内）', '杞人忧天', 1, [
    r('亡', '无，没有', '身亡所寄，废寝食者。', '身体没有可以寄托的地方，因此睡不着觉、吃不下饭。'),
    r('舍', '同“释”，消除，放下', '其人舍然大喜。', '那个人消除了疑虑，非常高兴。'),
    r('止', '行动，活动', '终日在天中行止。', '整天在天空中行动。'),
  ]),
  chapter('七年级上册', '第六单元（课内）', '杞人忧天', 2, [
    r('若', '你', '若屈伸呼吸，终日在天中行止。', '你一屈一伸、一呼一吸，整天在天空中活动。'),
    r('之', '助词，的', '又有忧彼之所忧者。', '又有一个人为那个担忧的人所担忧的事而担忧。'),
    r('其', '代词，那个人', '其人曰：“天果积气，日月星宿不当坠邪？”', '那个人说：“如果天空果真是聚积的气体，日月星辰不就不会坠落了吗？”'),
  ]),

  chapter('七年级下册', '第三单元（课内）', '孙权劝学', 1, [
    r('辞', '推托，推辞', '蒙辞以军中多务。', '吕蒙用军中事务繁多来推托。'),
    r('见', '了解', '但当涉猎，见往事耳。', '只是应当粗略地阅读，了解历史罢了。'),
    r('若', '比得上', '卿言多务，孰若孤？', '你说事务多，谁比得上我事务多呢？'),
    r('就', '从事，开始学习', '蒙乃始就学。', '吕蒙于是开始学习。'),
    r('过', '经过', '及鲁肃过寻阳。', '等到鲁肃经过寻阳。'),
    r('更', '重新', '即更刮目相待。', '就要重新另眼看待。'),
  ]),
  chapter('七年级下册', '第三单元（课内）', '孙权劝学', 2, [
    r('以', '介词，因为', '蒙辞以军中多务。', '吕蒙用军中事务繁多来推托。'),
    r('之', '用于主谓之间，取消句子独立性', '大兄何见事之晚乎！', '长兄知道事情怎么这么晚呢！'),
    r('乃', '于是，就', '蒙乃始就学。', '吕蒙于是开始学习。'),
  ]),
  chapter('七年级下册', '第六单元（课内）', '卖油翁', 1, [
    r('善', '擅长', '陈康肃公尧咨善射。', '陈尧咨擅长射箭。'),
    r('去', '离开', '睨之久而不<b>去</b>。', '斜着眼看了很久也没有离开。'),
    r('酌', '舀取', '以我酌油知之。', '凭我舀油的经验知道这个道理。'),
    r('遣', '打发', '康肃笑而遣之。', '康肃公笑着把他打发走了。'),
  ]),
  chapter('七年级下册', '第六单元（课内）', '卖油翁', 2, [
    r('以', '介词，凭，靠', '以我酌油知之。', '凭我舀油的经验知道这个道理。'),
    r('之', '代词，指陈尧咨射箭十中八九的情况', '以我酌油知之。', '凭我舀油的经验知道这个道理。'),
    r('其', '代词，他的', '以钱覆其口。', '用一枚铜钱盖住葫芦的口。'),
    r('而', '连词，表承接', '释担而立。', '放下担子站在那里。'),
  ]),
  chapter('七年级下册', '第四单元（课内）', '陋室铭', 1, [
    r('名', '出名，有名', '山不在高，有仙则名。', '山不一定要高，有了仙人就出名。'),
    r('素', '不加装饰的', '可以调素琴。', '可以弹奏不加装饰的琴。'),
    r('劳', '使……劳累', '无丝竹之乱耳，无案牍之劳形。', '没有世俗的乐曲扰乱听觉，也没有官府公文使身体劳累。'),
  ]),
  chapter('七年级下册', '第四单元（课内）', '陋室铭', 2, [
    r('之', '宾语前置的标志，不译', '何陋之有？', '有什么简陋的呢？'),
  ]),
  chapter('七年级下册', '第四单元（课内）', '爱莲说', 1, [
    r('益', '更加', '香远益清。', '香气传播得越远就越清幽。'),
    r('鲜', '少', '陶后鲜有闻。', '陶渊明以后很少听说了。'),
    r('闻', '听说', '陶后鲜有闻。', '陶渊明以后很少听说了。'),
    r('宜', '应当', '宜乎众矣。', '应当人很多了。'),
  ]),
  chapter('七年级下册', '第四单元（课内）', '爱莲说', 2, [
    r('之', '用于主谓之间，取消句子独立性', '予独爱莲之出淤泥而不染。', '我只爱莲花从淤泥里长出却不被污染。'),
    r('而', '连词，表转折，却', '出淤泥而不染。', '从淤泥里长出却不被污染。'),
  ]),
  chapter('七年级下册', '第四单元（课内）', '活板', 1, [
    r('止', '同“只”，仅仅', '若止印三二本，未为简易。', '如果只印两三本，不能算是简便。'),
    r('就', '靠近，接近', '持就火炀之。', '拿它靠近火烘烤。'),
    r('具', '准备，具备', '此印者才毕，则第二板已具。', '这块印刷完毕，第二块板已经准备好了。'),
    r('更', '交替，轮换', '更互用之，瞬息可就。', '交替使用它们，很快就可以完成。'),
    r('素', '平时，向来', '有奇字素无备者，旋刻之。', '有平时没有准备的生僻字，就马上刻制。'),
  ]),
  chapter('七年级下册', '第四单元（课内）', '活板', 2, [
    r('为', '做，制作', '唐人尚未盛为之。', '唐代人还没有大规模地制作它。'),
    r('以', '介词，用', '不用，则以纸帖之。', '不用时，就用纸条给它作标记。'),
    r('之', '代词，指字模', '以纸帖之。', '用纸条给它作标记。'),
    r('其', '代词，它的，指字模', '其印自落。', '它的字印自然掉落下来。'),
    r('若', '如果', '若止印三二本，未为简易。', '如果只印两三本，不能算是简便。'),
  ]),

  chapter('八年级上册', '第三单元（课内）', '三峡', 1, [
    r('阙', '同“缺”，空隙，中断', '略无阙处。', '完全没有中断的地方。'),
    r('绝', '断绝', '沿溯阻绝。', '上行和下行的航道都被阻断。', 'jué'),
    r('属', '接连不断', '常有高猿长啸，属引凄异。', '常常有高处的猿猴拉长声音鸣叫，声音连续不断，凄惨异常。', 'zhǔ'),
    r('引', '延长', '常有高猿长啸，属引凄异。', '常常有高处的猿猴拉长声音鸣叫，声音连续不断，凄惨异常。'),
    r('素', '白色', '则素湍绿潭，回清倒影。', '白色的急流，碧绿的潭水，回旋着清波，回旋的清波映着各种景物的影子。'),
  ]),
  chapter('八年级上册', '第三单元（课内）', '三峡', 2, [
    r('其', '代词，它，指水势', '其间千二百里，虽乘奔御风，不以疾也。', '中间相距一千二百里，即使骑着飞奔的马、驾着疾风，也没有这么快。'),
    r('以', '介词，比', '不以疾也。', '也没有这么快。'),
  ]),
  chapter('八年级上册', '第三单元（课内）', '答谢中书书', 1, [
    r('时', '季节', '四时俱备。', '四季都具备。'),
    r('歇', '消散', '晓雾将歇。', '清晨的薄雾将要消散。'),
    r('与', '参与，这里指欣赏', '未复有能与其奇者。', '不再有能够欣赏这种奇丽景色的人了。'),
  ]),
  chapter('八年级上册', '第三单元（课内）', '答谢中书书', 2, [
    r('之', '助词，的', '山川之美，古来共谈。', '山河的美丽，自古以来就是人们共同谈赏的。'),
    r('其', '代词，这种，指山川景色', '未复有能与其奇者。', '不再有能够欣赏这种奇丽景色的人了。'),
  ]),
  chapter('八年级上册', '第三单元（课内）', '记承天寺夜游', 1, [
    r('念', '考虑，想到', '念无与为乐者。', '想到没有可以共同游乐的人。'),
    r('至', '到', '遂至承天寺寻张怀民。', '于是到承天寺寻找张怀民。', 'zhì'),
  ]),
  chapter('八年级上册', '第三单元（课内）', '记承天寺夜游', 2, [
    r('与', '和，跟', '念无与为乐者。', '想到没有可以共同游乐的人。'),
  ]),
  chapter('八年级上册', '第三单元（课内）', '与朱元思书', 1, [
    r('绝', '独一无二', '奇山异水，天下独绝。', '奇异的山水，是天下独一无二的。'),
    r('甚', '超过', '急湍甚箭，猛浪若奔。', '湍急的江流比箭还快，凶猛的巨浪就像飞奔的马。'),
    r('若', '像，好像', '猛浪若奔。', '凶猛的巨浪就像飞奔的马。'),
    r('穷', '尽，停止', '蝉则千转不穷，猿则百叫无绝。', '蝉长久不断地鸣叫，猿猴长时间地啼叫。'),
  ]),
  chapter('八年级上册', '第六单元（课内）', '得道多助，失道寡助', 1, [
    r('道', '道义，正确的治国之道', '得道者多助，失道者寡助。', '施行仁政的人帮助他的人就多，不施行仁政的人帮助他的人就少。'),
    r('寡', '少', '失道者寡助。', '不施行仁政的人帮助他的人就少。'),
    r('委', '放弃', '委而去之。', '弃城而逃。'),
    r('固', '巩固', '固国不以山溪之险。', '巩固国防不能靠山河的险要。'),
    r('至', '极点', '寡助之至，亲戚畔之。', '帮助他的人少到了极点，连内外亲属都背叛他。'),
  ]),
  chapter('八年级上册', '第六单元（课内）', '得道多助，失道寡助', 2, [
    r('之', '助词，的', '三里之城，七里之郭。', '三里的内城，七里的外城。'),
    r('而', '连词，表并列', '环而攻之而不胜。', '四面包围攻打它，却不能取胜。'),
    r('以', '介词，凭借', '域民不以封疆之界。', '使人民定居下来不能靠划定的疆域。'),
  ]),
  chapter('八年级上册', '第六单元（课内）', '富贵不能淫', 1, [
    r('诚', '真正，确实', '公孙衍、张仪岂不诚大丈夫哉？', '公孙衍、张仪难道不是真正的大丈夫吗？'),
    r('冠', '行冠礼', '丈夫之冠也，父命之。', '男子举行冠礼时，父亲训导他。'),
    r('顺', '顺从', '以顺为正者，妾妇之道也。', '把顺从作为准则，是妇女之道。'),
    r('屈', '使……屈服', '威武不能屈。', '威武不能使我屈服。'),
  ]),
  chapter('八年级上册', '第六单元（课内）', '富贵不能淫', 2, [
    r('焉', '语气助词，呢', '是焉得为大丈夫乎？', '这怎么能算是大丈夫呢？'),
    r('之', '助词，的', '丈夫之冠也，父命之。', '男子举行冠礼时，父亲训导他。'),
    r('其', '代词，他的（范围词原文待复核）', null, '附件将“其”列入范围，但现行篇目正文未检出明确用例，暂保留草稿待复核。'),
  ]),
  chapter('八年级上册', '第六单元（课内）', '生于忧患，死于安乐', 1, [
    r('举', '被选拔', '傅说举于版筑之间。', '傅说从筑墙的劳作中被选拔出来。'),
    r('拂', '同“弼”，辅佐', '入则无法家拂士。', '在国内没有守法度的大臣和辅佐君王的贤士。'),
    r('恒', '常常', '人恒过，然后能改。', '人常常犯错误，然后才能改正。'),
    r('过', '犯错误', '人恒过，然后能改。', '人常常犯错误，然后才能改正。'),
    r('曾', '同“增”，增加', '曾益其所不能。', '增加他原来所没有的能力。'),
  ]),
  chapter('八年级上册', '第六单元（课内）', '生于忧患，死于安乐', 2, [
    r('于', '介词，从', '舜发于畎亩之中。', '舜从田野耕作之中被任用。'),
    r('其', '代词，他的', '必先苦其心志。', '一定先使他的内心痛苦。'),
  ]),
  chapter('八年级上册', '第六单元（课内）', '愚公移山', 1, [
    r('方', '方圆，纵横', '方七百里，高万仞。', '方圆七百里，高七八千丈。'),
    r('惩', '苦于', '惩山北之塞，出入之迂也。', '苦于山北的阻塞，出来进去都要绕远路。'),
    r('毕', '尽，全', '毕力平险。', '尽全力铲平险峻的大山。'),
    r('许', '赞同，同意', '杂然相许。', '纷纷表示赞同。'),
    r('易', '交换', '寒暑易节，始一反焉。', '冬夏换季，才往返一次。'),
    r('亡', '同“无”，没有', '河曲智叟亡以应。', '河曲的智叟没有话来回答。'),
  ]),
  chapter('八年级上册', '第六单元（课内）', '愚公移山', 2, [
    r('且', '况且', '且焉置土石？', '况且把土石放到哪里呢？'),
    r('之', '助词，的', '惩山北之塞。', '苦于山北的阻塞。'),
    r('其', '代词，他的', '其妻献疑曰。', '他的妻子提出疑问说。'),
    r('而', '连词，表承接', '面山而居。', '面向着山居住。'),
  ]),
  chapter('八年级上册', '第六单元（课内）', '周亚夫军细柳', 1, [
    r('军', '驻军，驻扎', '军霸上。', '驻军在霸上。'),
    r('备', '防备', '以备胡。', '用来防备匈奴。'),
    r('固', '坚固，牢固', '其将固可袭而虏也。', '他们的将军一定可以被袭击并俘虏。'),
    r('谢', '告知', '使人称谢：“皇帝敬劳将军。”', '派人告诉将军：“皇帝敬重地慰劳将军。”'),
  ]),
  chapter('八年级上册', '第六单元（课内）', '周亚夫军细柳', 2, [
    r('之', '动词，到，往', '已而之细柳军。', '不久到了细柳军营。'),
    r('为', '范围词原文待复核', null, '附件将“为”列入范围，但现行篇目正文未检出明确虚词用例，暂保留草稿待复核。'),
    r('且', '将要', '天子且至。', '天子将要到来。'),
  ]),

  chapter('八年级下册', '第三单元（课内）', '桃花源记', 1, [
    r('缘', '沿着，顺着', '缘溪行，忘路之远近。', '沿着溪流行船，忘记了路程的远近。'),
    r('穷', '尽', '欲穷其林。', '想要走到那片林子的尽头。'),
    r('悉', '全，都', '男女衣着，悉如外人。', '男女的穿戴，都像外面的人。'),
    r('寻', '寻找', '寻向所志，遂迷。', '寻找先前所做的标记，终于迷路了。'),
    r('规', '计划', '欣然规往。', '高兴地计划前往。'),
    r('异', '对……感到诧异', '渔人甚异之。', '渔人对此感到非常诧异。'),
  ]),
  chapter('八年级下册', '第三单元（课内）', '桃花源记', 2, [
    r('为', '对，向', '不足为外人道也。', '不值得向外面的人说。'),
    r('乃', '于是，就', '乃大惊，问所从来。', '于是大吃一惊，问他从哪里来。'),
    r('之', '助词，的', '忘路之远近。', '忘记了路程的远近。'),
    r('其', '代词，他的', '欲穷其林。', '想要走到那片林子的尽头。'),
    r('而', '连词，表承接（范围词原文待复核）', null, '附件将“而”列入范围，但现行篇目正文未检出明确用例，暂保留草稿待复核。'),
  ]),
  chapter('八年级下册', '第三单元（课内）', '小石潭记', 1, [
    r('闻', '听到', '隔篁竹，闻水声。', '隔着竹林，听到了水声。'),
    r('乐', '以……为乐', '心乐之。', '心里以这件事为乐。'),
    r('清', '清澈', '水尤清冽。', '水格外清澈凉爽。'),
    r('近', '靠近', '近岸，卷石底以出。', '靠近岸边，石底有些部分翻卷出来。'),
  ]),
  chapter('八年级下册', '第三单元（课内）', '小石潭记', 2, [
    r('以', '介词，因为', '以其境过清，不可久居。', '因为这里的环境过于凄清，不能长时间停留。'),
    r('其', '代词，这个，指小石潭', '以其境过清。', '因为这里的环境过于凄清。'),
    r('乃', '于是，就', '乃记之而去。', '于是记下了这里的情景就离开了。'),
    r('之', '代词，指小石潭的景物', '乃记之而去。', '于是记下了这里的情景就离开了。'),
  ]),
  chapter('八年级下册', '第三单元（课内）', '核舟记', 1, [
    r('奇', '零数，余数', '舟首尾长约八分有奇。', '船头到船尾大约八分多一点。'),
    r('属', '类，类别', '神情与苏、黄不属。', '神情和苏轼、黄鲁直不相同。', 'shǔ'),
    r('类', '相似，像', '佛印绝类弥勒。', '佛印极像弥勒佛。'),
    r('绝', '极，非常', '佛印绝类弥勒。', '佛印极像弥勒佛。'),
    r('若', '像，好像', '细若蚊足。', '细得像蚊子的脚。'),
  ]),
  chapter('八年级下册', '第三单元（课内）', '核舟记', 2, [
    r('为', '雕刻，刻制', '为宫室、器皿、人物。', '雕刻宫室、器皿、人物。'),
    r('而', '连词，表转折，却', '而计其长曾不盈寸。', '可是计算它的长度还不满一寸。'),
    r('之', '助词，的', '能以径寸之木。', '能够用直径一寸的木头。'),
    r('以', '介词，用', '能以径寸之木。', '能够用直径一寸的木头。'),
  ]),
  chapter('八年级下册', '第六单元（课内）', '北冥有鱼', 1, [
    r('若', '像，好像', '其翼若垂天之云。', '它的翅膀像悬挂在天空的云。'),
    r('去', '离开', '去以六月息者也。', '凭借六月的大风离开北海。'),
    r('志', '记载', '《齐谐》者，志怪者也。', '《齐谐》是记载怪异事物的书。'),
    r('极', '尽头', '天之苍苍，其正色邪？其远而无所至极邪？', '天空苍苍茫茫，难道是它真正的颜色吗？还是因为天空高远而看不到尽头呢？'),
  ]),
  chapter('八年级下册', '第六单元（课内）', '北冥有鱼', 2, [
    r('其', '代词，它的', '其名为鲲。', '它的名字叫作鲲。'),
    r('而', '连词，表修饰', '怒而飞。', '奋发而飞。'),
    r('之', '用于主谓之间，取消句子独立性', '鹏之徙于南冥也。', '鹏鸟迁徙到南海。'),
  ]),
  chapter('八年级下册', '第六单元（课内）', '庄子与惠子游于濠梁之上', 1, [
    r('安', '怎么', '子非鱼，安知鱼之乐？', '你不是鱼，怎么知道鱼的快乐呢？'),
    r('固', '本来', '我非子，固不知子矣。', '我不是你，本来就不知道你。'),
    r('既', '已经', '既已知吾知之而问我。', '你已经知道我知道鱼的快乐还来问我。'),
  ]),
  chapter('八年级下册', '第六单元（课内）', '庄子与惠子游于濠梁之上', 2, [
    r('于', '介词，在', '庄子与惠子游于濠梁之上。', '庄子和惠子在濠水的桥上游玩。'),
    r('之', '助词，的', '庄子与惠子游于濠梁之上。', '庄子和惠子在濠水的桥上游玩。'),
    r('其', '代词，这个，指话题的本源', '请循其本。', '请追溯话题的本源。'),
  ]),
  chapter('八年级下册', '第六单元（课内）', '虽有嘉肴', 1, [
    r('旨', '味美', '虽有嘉肴，弗食，不知其旨也。', '即使有美味的菜，不吃就不知道它的味美。'),
    r('至', '达到极点', '虽有至道，弗学，不知其善也。', '即使有最好的道理，不学习就不知道它的好处。', 'zhì'),
    r('道', '道理', '虽有至道，弗学，不知其善也。', '即使有最好的道理，不学习就不知道它的好处。'),
    r('困', '困惑', '知困，然后能自强也。', '知道了困惑，然后才能自我勉励。'),
  ]),
  chapter('八年级下册', '第六单元（课内）', '虽有嘉肴', 2, [
    r('其', '代词，它的，指佳肴', '弗食，不知其旨也。', '不吃就不知道它的味美。'),
    r('之', '助词，的（范围词原文待复核）', null, '附件将“之”列入范围，但现行篇目正文未检出明确用例，暂保留草稿待复核。'),
  ]),
  chapter('八年级下册', '第六单元（课内）', '大道之行也', 1, [
    r('行', '施行', '大道之行也，天下为公。', '在大道施行的时候，天下是公共的。'),
    r('分', '职分，职守', '男有分，女有归。', '男子有职务，女子有归宿。'),
    r('作', '兴起，发生', '盗窃乱贼而不作。', '盗窃、造反和害人的事情不发生。'),
  ]),
  chapter('八年级下册', '第六单元（课内）', '大道之行也', 2, [
    r('之', '助词，的', '大道之行也，天下为公。', '在大道施行的时候，天下是公共的。'),
    r('其', '代词，他们的', '不独亲其亲，不独子其子。', '不只是把自己的父母当作父母，不只是把自己的子女当作子女。'),
  ]),
  chapter('八年级下册', '第六单元（课内）', '马说', 1, [
    r('尽', '吃尽', '一食或尽粟一石。', '一顿有时能吃掉一石粮食。'),
    r('见', '同“现”，显现', '才美不外见。', '才能和美好的素质不能表现在外面。', 'xiàn'),
    r('策', '用马鞭驱赶', '策之不以其道。', '用马鞭赶它，却不按照正确的方法。'),
  ]),
  chapter('八年级下册', '第六单元（课内）', '马说', 2, [
    r('而', '连词，表转折，却', '而伯乐不常有。', '可是伯乐不常有。'),
    r('安', '怎么', '安求其能千里也？', '怎么能要求它日行千里呢？'),
    r('以', '介词，按照', '策之不以其道。', '用马鞭赶它，却不按照正确的方法。'),
  ]),

  chapter('九年级上册', '第三单元（课内）', '岳阳楼记', 1, [
    r('属', '同“嘱”，嘱托', '属予作文以记之。', '嘱托我写一篇文章来记述这件事。', 'zhǔ'),
    r('观', '景象', '此则岳阳楼之大观也。', '这就是岳阳楼的壮丽景象。'),
    r('极', '到达极点，尽头', '南极潇湘。', '南面直到潇水、湘水。'),
    r('胜', '美好', '予观夫巴陵胜状。', '我看那巴陵郡的美好景色。'),
    r('备', '详尽', '前人之述备矣。', '前人的记述已经很详尽了。'),
  ]),
  chapter('九年级上册', '第三单元（课内）', '岳阳楼记', 2, [
    r('以', '连词，表目的，来', '属予作文以记之。', '嘱托我写一篇文章来记述这件事。'),
    r('之', '代词，这件事', '属予作文以记之。', '嘱托我写一篇文章来记述这件事。'),
    r('则', '就是', '此则岳阳楼之大观也。', '这就是岳阳楼的壮丽景象。'),
    r('其', '代词，那，指岳阳楼', '刻唐贤今人诗赋于其上。', '把唐代名家和当代人的诗赋刻在它上面。'),
  ]),
  chapter('九年级上册', '第三单元（课内）', '醉翁亭记', 1, [
    r('名', '命名', '名之者谁？太守自谓也。', '给它命名的人是谁？是太守用自己的别号命名的。'),
    r('秀', '秀丽', '望之蔚然而深秀者，琅琊也。', '远远看去树木茂盛、幽深秀丽的，是琅琊山。'),
    r('去', '离开', '游人去而禽鸟乐也。', '游人离开后鸟儿就欢乐起来。', 'qù'),
    r('乐', '以……为乐', '山水之乐，得之心而寓之酒也。', '欣赏山水的乐趣，领会在心里，寄托在酒上。'),
    r('意', '意趣，情趣', '醉翁之意不在酒，在乎山水之间也。', '醉翁的情趣不在酒上，而在山水之间。'),
  ]),
  chapter('九年级上册', '第三单元（课内）', '醉翁亭记', 2, [
    r('而', '连词，表承接', '若夫日出而林霏开。', '像那太阳出来，树林里的雾气就散了。'),
    r('之', '助词，的', '醉翁之意不在酒。', '醉翁的情趣不在酒上。'),
    r('于', '介词，在', '有亭翼然临于泉上者。', '有一座亭子像鸟张开翅膀一样高踞在泉水上面。'),
    r('其', '代词，他们的', '醉能同其乐。', '醉了能够同大家一起欢乐。'),
  ]),
  chapter('九年级上册', '第三单元（课内）', '湖心亭看雪', 1, [
    r('绝', '消失', '湖中人鸟声俱绝。', '湖中人的声音和鸟的声音都消失了。'),
    r('更', '古代夜间计时单位', '是日更定矣。', '这天晚上八点左右。'),
  ]),
  chapter('九年级上册', '第三单元（课内）', '湖心亭看雪', 2, [
    r('其', '代词，那', '问其姓氏，是金陵人，客此。', '问他们的姓氏，得知是金陵人，客居在此。'),
    r('乃', '竟然（范围词原文待复核）', null, '附件将“乃”列入范围，但现行篇目正文未检出明确用例，暂保留草稿待复核。', 'nǎi'),
  ]),
  chapter('九年级上册', '第五单元（课内）', '曹刿论战', 1, [
    r('鄙', '目光短浅', '肉食者鄙，未能远谋。', '当权者目光短浅，不能深谋远虑。'),
    r('安', '怎么', '衣食所安，弗敢专也。', '衣食这类养生的东西，不敢独自享用。'),
    r('孚', '使……信服', '小信未孚，神弗福也。', '小小的信用不能使神灵信服，神灵不会保佑你。'),
    r('信', '信用', '小信未孚，神弗福也。', '小小的信用不能使神灵信服。'),
    r('福', '赐福，保佑', '神弗福也。', '神灵不会保佑你。'),
    r('逐', '追赶', '故逐之。', '所以追赶齐军。'),
    r('尽', '竭尽，耗尽（范围词原文待复核）', null, '附件将“尽”列入范围，但现行篇目正文未检出该字，暂保留草稿待复核。'),
    r('既', '已经', '既克，公问其故。', '已经战胜齐军后，鲁庄公问其中的原因。'),
  ]),
  chapter('九年级上册', '第五单元（课内）', '曹刿论战', 2, [
    r('之', '代词，指齐军', '公与之乘，战于长勺。', '鲁庄公和曹刿同乘一辆战车，在长勺交战。'),
    r('以', '介词，按照', '必以情。', '一定按照实际情况处理。'),
    r('于', '介词，在', '战于长勺。', '在长勺交战。'),
  ]),
  chapter('九年级上册', '第五单元（课内）', '邹忌讽齐王纳谏', 1, [
    r('修', '长，这里指身高', '邹忌修八尺有余。', '邹忌身高八尺多。'),
    r('窥', '从缝隙中看', '窥镜而自视。', '从镜子里照了照自己。'),
    r('私', '偏爱', '臣之妻私臣。', '我的妻子偏爱我。'),
    r('蔽', '受蒙蔽', '王之蔽甚矣。', '大王受蒙蔽很深了。'),
    r('闻', '使……听到', '闻寡人之耳者，受下赏。', '能够传到我的耳朵里的，受下等奖赏。'),
    r('朝', '朝见', '燕、赵、韩、魏闻之，皆朝于齐。', '燕、赵、韩、魏听说这件事，都到齐国来朝见。'),
  ]),
  chapter('九年级上册', '第五单元（课内）', '邹忌讽齐王纳谏', 2, [
    r('之', '助词，的', '臣之妻私臣。', '我的妻子偏爱我。'),
    r('于', '介词，到', '皆朝于齐。', '都到齐国来朝见。'),
    r('而', '连词，表修饰', '窥镜而自视。', '从镜子里照了照自己。'),
  ]),
  chapter('九年级上册', '第五单元（课内）', '陈涉世家', 1, [
    r('辍', '停止', '辍耕之垄上。', '停止耕作走到田埂上。'),
    r('若', '你', '若为佣耕，何富贵也？', '你是给人家耕田的，哪里来的富贵呢？'),
    r('安', '怎么', '燕雀安知鸿鹄之志哉！', '燕雀怎么知道鸿鹄的志向呢！'),
    r('会', '适逢，恰逢', '会天大雨，道路不通。', '适逢天下大雨，道路不通。'),
    r('亡', '逃亡', '今亡亦死，举大计亦死。', '现在逃跑也是死，发动起义也是死。'),
    r('闻', '听说（范围词原文待复核）', null, '附件将“闻”列入范围，但现行篇目正文未检出明确用例，暂保留草稿待复核。', 'wén'),
    r('间', '私下，暗中', '又间令吴广之次所旁丛祠中。', '又暗中派吴广到驻地旁的丛林里的神庙中。'),
    r('属', '下属，部属', '召令徒属曰。', '召集并号令所属的人说。', 'shǔ'),
  ]),
  chapter('九年级上册', '第五单元（课内）', '陈涉世家', 2, [
    r('之', '动词，到，往', '辍耕之垄上。', '停止耕作走到田埂上。'),
    r('以', '介词，因为', '扶苏以数谏故。', '扶苏因为多次劝谏的缘故。'),
    r('为', '筑，建立', '为坛而盟，祭以尉首。', '筑台并举行盟誓，用军官的头祭祀。'),
  ]),
  chapter('九年级上册', '第五单元（课内）', '出师表', 1, [
    r('诚', '确实，的确', '诚宜开张圣听。', '确实应当扩大圣明的听闻。'),
    r('喻', '说明，譬喻', '不宜妄自菲薄，引喻失义，以塞忠谏之路也。', '不应当随意看轻自己，说话不恰当，以致堵塞忠臣进谏的道路。', 'yù'),
    r('若', '如果', '若有作奸犯科及为忠善者。', '如果有做奸邪事情、触犯科条或尽忠行善的人。'),
    r('效', '任务，功效', '愿陛下托臣以讨贼兴复之效。', '希望陛下把讨伐奸贼、兴复汉室的任务交给我。'),
    r('闻', '使……听到，听说', '不求闻达于诸侯。', '不谋求在诸侯那里扬名显达。'),
    r('顾', '拜访', '三顾臣于草庐之中。', '三次到草庐来拜访我。'),
    r('驰', '奔走效劳', '遂许先帝以驱驰。', '于是答应为先帝奔走效劳。'),
  ]),
  chapter('九年级上册', '第五单元（课内）', '出师表', 2, [
    r('以', '介词，因为', '先帝不以臣卑鄙。', '先帝不因为我的身份低微、见识短浅。'),
    r('之', '助词，的', '此臣所以报先帝而忠陛下之职分也。', '这是我用来报答先帝、尽忠陛下的职责。'),
    r('于', '介词，在', '受任于败军之际。', '在兵败的时候接受任命。'),
    r('而', '连词，表承接', '此臣所以报先帝而忠陛下之职分也。', '这是我用来报答先帝、尽忠陛下的职责。'),
  ]),
];

const PINYIN = {
  骤: 'zhòu', 若: 'ruò', 拟: 'nǐ', 期: 'qī', 去: 'qù', 委: 'wěi', 引: 'yǐn', 顾: 'gù', 乃: 'nǎi', 之: 'zhī',
  愠: 'yùn', 省: 'xǐng', 罔: 'wǎng', 殆: 'dài', 而: 'ér', 其: 'qí', 于: 'yú', 致: 'zhì', 驰: 'chí', 以: 'yǐ',
  止: 'zhǐ', 从: 'cóng', 绝: 'jué', 暇: 'xiá', 道: 'dào', 闻: 'wén', 舍: 'shě', 辞: 'cí', 见: 'jiàn', 就: 'jiù',
  过: 'guò', 更: 'gēng', 善: 'shàn', 酌: 'zhuó', 遣: 'qiǎn', 名: 'míng', 素: 'sù', 劳: 'láo', 益: 'yì', 鲜: 'xiǎn',
  宜: 'yí', 为: 'wéi', 具: 'jù', 三峡: 'sān xiá', 阙: 'quē', 属: 'shǔ', 引: 'yǐn', 时: 'shí', 歇: 'xiē', 与: 'yǔ',
  念: 'niàn', 至: 'zhì', 甚: 'shèn', 穷: 'qióng', 寡: 'guǎ', 固: 'gù', 诚: 'chéng', 冠: 'guàn', 顺: 'shùn', 屈: 'qū',
  焉: 'yān', 举: 'jǔ', 拂: 'bì', 恒: 'héng', 过: 'guò', 曾: 'zēng', 方: 'fāng', 惩: 'chéng', 毕: 'bì', 许: 'xǔ',
  易: 'yì', 军: 'jūn', 备: 'bèi', 谢: 'xiè', 缘: 'yuán', 悉: 'xī', 寻: 'xún', 规: 'guī', 异: 'yì', 乐: 'lè', 清: 'qīng',
  近: 'jìn', 奇: 'qí', 类: 'lèi', 北冥: 'běi míng', 志: 'zhì', 极: 'jí', 安: 'ān', 既: 'jì', 旨: 'zhǐ', 困: 'kùn', 行: 'xíng',
  分: 'fèn', 作: 'zuò', 尽: 'jìn', 策: 'cè', 岳阳: 'yuè yáng', 观: 'guān', 胜: 'shèng', 备: 'bèi', 则: 'zé', 秀: 'xiù', 意: 'yì',
  湖心: 'hú xīn', 鄙: 'bǐ', 孚: 'fú', 信: 'xìn', 福: 'fú', 逐: 'zhú', 修: 'xiū', 窥: 'kuī', 私: 'sī', 蔽: 'bì', 朝: 'cháo',
  辍: 'chuò', 会: 'huì', 亡: 'wáng', 间: 'jiàn', 喻: 'yù', 效: 'xiào', 驰: 'chí', 若: 'ruò',
};

function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function mark(text, word) {
  if (!text || !word) return text;
  return String(text).replace(new RegExp(escapeRegExp(word), 'g'), `<b>${word}</b>`);
}
function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\u0000/g, '')}'`;
}
function cleanExample(value) { return value ? value.replace(/<b>|<\/b>/g, '') : ''; }

const records = [];
const unresolved = [];
for (const book of chapters) {
  for (const item of book.rows) {
    const example = item.example ? mark(item.example, item.word) : null;
    const record = {
      id: BASE_SENSE_ID + records.length,
      wordClass: book.wordClass,
      word: item.word,
      pinyin: item.pinyin || PINYIN[item.word] || '',
      meaning: formatMeaning(book.wordClass, item.word, item.meaning),
      example,
      source: `${VERSION.name}｜${book.volume}｜${book.unit}｜《${book.title}》`,
      exampleTrans: item.translation,
      volume: book.volume,
      unit: book.unit,
      chapter: `《${book.title}》`,
      questionEnabled: Boolean(example),
    };
    if (!example) unresolved.push(record);
    records.push(record);
  }
}

const questions = buildQuestions(records.filter(item => item.questionEnabled), externalExamples)
  .map((row, index) => ({ id: BASE_QUESTION_ID + index, ...row }));

function senseSql() {
  const rows = records.map(row => `(${row.id}, ${row.wordClass}, ${sqlString(row.word)}, ${sqlString(row.pinyin)}, ${sqlString(row.meaning)}, ${sqlString(row.example)}, ${sqlString(row.source)}, ${sqlString(row.exampleTrans)}, ${row.example ? 1 : 0}, 0)`).join(',\n');
  const q = String.fromCharCode(96);
  return `-- 语文积累本-六三制初中课内文言文实虚词词义例句\n-- 范围来自《六三制初中语文课内文言文词汇.docx》；附件未提供六年级、九年级下册，未擅自补充。\n-- 本批内容为初稿，status=0；例句未检出的范围词以 NULL 保留并在脚本校验报告中列出。\nSTART TRANSACTION;\n\nINSERT INTO ${q}edu_chn_word_sense${q}\n(${q}id${q}, ${q}word_class${q}, ${q}word${q}, ${q}pinyin${q}, ${q}meaning${q}, ${q}example${q}, ${q}source${q}, ${q}example_trans${q}, ${q}status${q}, ${q}is_del${q})\nVALUES\n${rows}\nON DUPLICATE KEY UPDATE\n${q}word_class${q} = VALUES(${q}word_class${q}),\n${q}word${q} = VALUES(${q}word${q}),\n${q}pinyin${q} = VALUES(${q}pinyin${q}),\n${q}meaning${q} = VALUES(${q}meaning${q}),\n${q}example${q} = VALUES(${q}example${q}),\n${q}source${q} = VALUES(${q}source${q}),\n${q}example_trans${q} = VALUES(${q}example_trans${q}),\n${q}status${q} = VALUES(${q}status${q}),\n${q}is_del${q} = VALUES(${q}is_del${q});\n\nCOMMIT;\n`;
}
function questionSql() {
  const rows = questions.map(row => `(${row.id}, ${row.senseId}, ${row.type}, ${sqlString(row.stem)}, ${sqlString(JSON.stringify(row.options))}, 1, 0)`).join(',\n');
  const q = String.fromCharCode(96);
  return `-- 语文积累本-六三制初中课内文言文实虚词题目\n-- 题型一固定 4 个选项，第一个正确；题型二固定 2 个选项，第一个正确。\nSTART TRANSACTION;\n\nINSERT INTO ${q}edu_chn_word_question${q}\n(${q}id${q}, ${q}sense_id${q}, ${q}question_type${q}, ${q}stem${q}, ${q}options_json${q}, ${q}status${q}, ${q}is_del${q})\nVALUES\n${rows}\nON DUPLICATE KEY UPDATE\n${q}sense_id${q} = VALUES(${q}sense_id${q}),\n${q}question_type${q} = VALUES(${q}question_type${q}),\n${q}stem${q} = VALUES(${q}stem${q}),\n${q}options_json${q} = VALUES(${q}options_json${q}),\n${q}status${q} = VALUES(${q}status${q}),\n${q}is_del${q} = VALUES(${q}is_del${q});\n\nCOMMIT;\n`;
}
function catalogSql() {
  const relationRows = records.map((row, index) => {
    const vId = volumeId(row.volume);
    return `(${BASE_CATALOG_ID + index}, ${sqlString(VERSION.id)}, ${sqlString(VERSION.name)}, ${sqlString(vId)}, ${sqlString(row.volume)}, ${row.id}, ${index + 1}, ${row.example ? 1 : 0}, 0)`;
  }).join(',\n');
  return catalogSqlV2(relationRows);
  /* legacy unit/chapter relation SQL retained below only as historical reference */
  const q = String.fromCharCode(96);
  const c = name => `${q}${name}${q}`;
  return `-- 语文积累本-六三制初中课内文言文实虚词教材关系\n-- version_id 固定；volume_id=MD5(版本名称|分册名称)；unit_id=MD5(版本名称|分册名称|单元名称)。\nCREATE TABLE IF NOT EXISTS ${c('edu_chn_word_catalog')} (\n${c('id')} int(10) NOT NULL AUTO_INCREMENT COMMENT '实虚词教材关联ID',\n${c('version_id')} varchar(32) NOT NULL COMMENT '教材版本ID',\n${c('version_name')} varchar(64) NOT NULL COMMENT '教材版本名称',\n${c('volume_id')} varchar(32) NOT NULL COMMENT '教材分册ID',\n${c('volume_name')} varchar(64) NOT NULL COMMENT '教材分册名称',\n${c('unit_id')} varchar(32) NOT NULL COMMENT '教材单元ID',\n${c('unit_name')} varchar(128) NOT NULL COMMENT '教材单元名称',\n${c('chapter')} varchar(64) NOT NULL COMMENT '教材篇目',\n${c('word_class')} tinyint NOT NULL COMMENT '分类：1=实词，2=虚词',\n${c('word')} varchar(32) NOT NULL COMMENT '原词',\n${c('sense_id')} int(10) NOT NULL COMMENT '词义ID，关联 edu_chn_word_sense.id',\n${c('sort')} int(10) NOT NULL DEFAULT 0 COMMENT '单元内排序',\n${c('status')} tinyint(2) NOT NULL DEFAULT 0 COMMENT '0=草稿，1=上架',\n${c('is_del')} tinyint(2) NOT NULL DEFAULT 0 COMMENT '0=未删除，1=已删除',\n${c('create_time')} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n${c('update_time')} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',\nPRIMARY KEY (${c('id')}),\nUNIQUE KEY ${c('uk_book_sense')} (${c('version_id')}, ${c('volume_id')}, ${c('unit_id')}, ${c('sense_id')}),\nKEY ${c('idx_sense')} (${c('sense_id')}, ${c('is_del')}, ${c('status')}),\nKEY ${c('idx_book')} (${c('version_id')}, ${c('volume_id')}, ${c('unit_id')}, ${c('is_del')}, ${c('status')})\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='语文积累本-实虚词教材关联';\n\nSTART TRANSACTION;\n\nINSERT INTO ${c('edu_chn_word_catalog')}\n(${c('id')}, ${c('version_id')}, ${c('version_name')}, ${c('volume_id')}, ${c('volume_name')}, ${c('unit_id')}, ${c('unit_name')}, ${c('chapter')}, ${c('word_class')}, ${c('word')}, ${c('sense_id')}, ${c('sort')}, ${c('status')}, ${c('is_del')})\nVALUES\n${relationRows}\nON DUPLICATE KEY UPDATE\n${c('version_id')} = VALUES(${c('version_id')}),\n${c('version_name')} = VALUES(${c('version_name')}),\n${c('volume_id')} = VALUES(${c('volume_id')}),\n${c('volume_name')} = VALUES(${c('volume_name')}),\n${c('unit_id')} = VALUES(${c('unit_id')}),\n${c('unit_name')} = VALUES(${c('unit_name')}),\n${c('chapter')} = VALUES(${c('chapter')}),\n${c('word_class')} = VALUES(${c('word_class')}),\n${c('word')} = VALUES(${c('word')}),\n${c('sense_id')} = VALUES(${c('sense_id')}),\n${c('sort')} = VALUES(${c('sort')}),\n${c('status')} = VALUES(${c('status')}),\n${c('is_del')} = VALUES(${c('is_del')});\n\nCOMMIT;\n`;
}
function catalogSqlV2(relationRows) {
  const q = String.fromCharCode(96);
  const c = name => `${q}${name}${q}`;
  return `-- 语文积累本-六三制初中课内文言文实虚词教材关系\n-- version_id 固定；volume_id=MD5(版本名称|分册名称)。\nCREATE TABLE IF NOT EXISTS ${c('edu_chn_word_catalog')} (\n${c('id')} int(10) NOT NULL AUTO_INCREMENT COMMENT '主键',\n${c('version_id')} varchar(64) NOT NULL COMMENT '学校管理平台教材版本ID',\n${c('version_name')} varchar(512) DEFAULT NULL COMMENT '版本名称',\n${c('volume_id')} varchar(64) NOT NULL COMMENT '分册/书目ID',\n${c('volume_name')} varchar(512) DEFAULT NULL COMMENT '分册/书目名称',\n${c('sense_id')} int(10) NOT NULL COMMENT '词义ID，关联 edu_chn_word_sense.id',\n${c('sort')} int(10) NOT NULL DEFAULT '0' COMMENT '词表顺序',\n${c('status')} tinyint(2) NOT NULL DEFAULT '0' COMMENT '0=草稿，1=上架',\n${c('is_del')} tinyint(2) NOT NULL DEFAULT '0' COMMENT '0=未删除，1=已删除',\n${c('create_time')} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n${c('update_time')} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',\nPRIMARY KEY (${c('id')}),\nKEY ${c('version_id')} (${c('version_id')}),\nKEY ${c('volume_id')} (${c('volume_id')}),\nKEY ${c('idx_sense')} (${c('sense_id')})\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='语文积累本-实虚词目录挂载';\n\nSTART TRANSACTION;\n\nINSERT INTO ${c('edu_chn_word_catalog')}\n(${c('id')}, ${c('version_id')}, ${c('version_name')}, ${c('volume_id')}, ${c('volume_name')}, ${c('sense_id')}, ${c('sort')}, ${c('status')}, ${c('is_del')})\nVALUES\n${relationRows}\nON DUPLICATE KEY UPDATE\n${c('version_id')} = VALUES(${c('version_id')}),\n${c('version_name')} = VALUES(${c('version_name')}),\n${c('volume_id')} = VALUES(${c('volume_id')}),\n${c('volume_name')} = VALUES(${c('volume_name')}),\n${c('sense_id')} = VALUES(${c('sense_id')}),\n${c('sort')} = VALUES(${c('sort')}),\n${c('status')} = VALUES(${c('status')}),\n${c('is_del')} = VALUES(${c('is_del')});\n\nCOMMIT;\n`;
}
function csv() {
  const head = ['version_id','version_name','volume_id','volume_name','sense_id','sort','status'];
  const quote = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = records.map((row, index) => [VERSION.id, VERSION.name, volumeId(row.volume), row.volume, row.id, index + 1, row.example ? 1 : 0]);
  return [head, ...rows].map(row => row.map(quote).join(',')).join('\n') + '\n';
}

function validate() {
  if (records.length !== 263) throw new Error(`范围词条数量异常：${records.length}，预期 263`);
  const senseIds = new Set(records.map(row => row.id));
  if (senseIds.size !== records.length) throw new Error('sense_id 存在重复');
  const missingMarks = records.filter(row => row.example && !row.example.includes('<b>')).map(row => `${row.id}:${row.word}:${row.chapter}`);
  if (missingMarks.length) throw new Error(`例句未包含原词：${missingMarks.join('；')}`);
  for (const row of records.filter(item => item.questionEnabled)) {
    const own = questions.filter(q => q.senseId === row.id);
    if (own.length !== 2 || own[0].type !== 1 || own[1].type !== 2 || own[0].options.length !== 4 || own[1].options.length !== 2) throw new Error(`题目结构异常：${row.id}`);
    if (!own[0].options[0].correct || !own[1].options[0].correct) throw new Error(`正确选项位置异常：${row.id}`);
  }
  const seen = new Set();
  for (const row of records) { const key = `${row.volume}|${row.unit}|${row.chapter}|${row.wordClass}|${row.word}|${row.meaning}`; if (seen.has(key)) throw new Error(`重复词义：${key}`); seen.add(key); }
}

validate();
fs.mkdirSync(SQL_DIR, { recursive: true });
fs.writeFileSync(path.join(SQL_DIR, 'edu_chn_junior_word_sense.sql'), senseSql());
fs.writeFileSync(path.join(SQL_DIR, 'edu_chn_junior_word_question.sql'), questionSql());
fs.writeFileSync(path.join(SQL_DIR, 'edu_chn_junior_word_catalog.sql'), catalogSql());
fs.writeFileSync(path.join(SQL_DIR, 'junior_word_book_scope.csv'), csv());
console.log(JSON.stringify({ records: records.length, questions: questions.length, chapters: new Set(records.map(row => row.chapter)).size, unresolved: unresolved.map(row => ({ id: row.id, word: row.word, chapter: row.chapter, source: row.source })) }, null, 2));
