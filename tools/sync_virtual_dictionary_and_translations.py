#!/usr/bin/env python3
"""同步《虚词字典》释义，并补齐已有例句的译文。

本脚本只处理 edu_chn_word_sense 中 is_del=0 的虚词记录，不删除例句、来源或
历史审核记录；释义和题型一正确选项通过追加 SQL UPDATE 方式落盘，便于研发按
文件顺序执行后得到最终值。
"""

from collections import Counter, defaultdict
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from add_high_virtual_reference_examples import quote, read_rows  # noqa: E402

SENSE_SQL = ROOT / "sql/edu_chn_word_sense.sql"
QUESTION_SQL = ROOT / "sql/edu_chn_word_question.sql"
REPORT = ROOT / "sql/edu_chn_word_dictionary_merge_report.md"

WORDS = set("于 而 之 者 也 其 乎 所 则 焉 以 何 夫 与 为 乃 因 且 若 安".split())
SENSE_MARKER = "-- 按更新版《虚词字典.docx》同步21个虚词释义并补齐例句译文 v3"
QUESTION_MARKER = "-- 题型一正确选项同步采用更新版《虚词字典.docx》释义 v3"


# 释义字符串严格取自更新后的《虚词字典.docx》；个别原数据标签比字典更细时，
# 按例句语境合并到字典已有义项，不新增字典外释义。
U_LOCATION = '<介>介绍动作行为发生时间、处所，可译为“在”、“到”、“从”等'
U_CAUSE = '<介>介绍动作行为产生的原因，可译为“由于”、“因为”'
U_OBJECT = '<介>介绍动作行为涉及的对象，可译为“对”、“向”等'
U_PASSIVE = '<介>介绍动作行为的主动者，可译为“被”'
U_COMPARE = '<介>介绍比较的对象，可译为“比”'
U_SUFFIX = '<词缀>用在动词前，无义'

A_NOUN = '<名>颊毛；胡须'
A_PRONOUN = '<代>通“尔”你，你的'
A_LIKE = '<动>通“如”。好像'
A_PARALLEL = '<连>表并列'
A_SUCCESSION = '<连>表承接'
A_PROGRESSIVE = '<连>表递进'
A_TURN = '<连>表转折'
A_MODIFIER = '<连>表修饰'
A_CONDITION = '<连>表假设'
A_CAUSE = '<连>表因果'
A_BOUNDARY = '<连>表时间、方位、范围的界限'
A_EXCLAMATION = '<助>表感叹语气，相当于“啊”“吧”'
A_SUFFIX = '词缀，嵌在某些时间词后面'

Z_GO = '<动>到……去'
Z_DEMONSTRATIVE = '<代>指示代词，相当于“这个”、“这”、“这种”等'
Z_THIRD = '<代>第三人称代词，相当于“他”、“它”、“它们”、“他们”等'
Z_SPEAKER = '<代>指代说话者本人或听话者的对方'
Z_SECOND = '<代>第二人称代词，相当于“你”、“您”'
Z_DE = '<助>用在定语和中心词之间，表示修饰、领属的关系，相当于“的”'
Z_SUBJECT = '<助>用在主谓之间，取消句子独立性，一般不必译出'
Z_POST_ATTR = '<助>定语后置的标志'
Z_COMPLEMENT = '<助>补语的标志。用在中心词（动词、形容词）和补语之间，可译作“得”'
Z_OBJECT_FRONT = '<助>用宾语前置的标志'
Z_SYLLABLE = '<助>用在表示时间的副词后，补足音节，没有实义'
Z_SCOPE = '<助>用在“前”、“后”、“内”、“外”等词语和它们的修饰语之间，表示对方位、时间、范围等的限制'

C_NOMINAL = '<助>用动词、形容词和动词性词组、形容词性词组的后面，组成一个名词性结构，相当于“……的人（人、事、情况等）”'
C_NUMBER = '<代>用在数词后面，往往总指上文所提到的人、事、物。翻译时在人、事、物名称前加“个”、“件”、“种”等'
C_DISTINGUISH = '<代>用在名词名词性词组后面，起区别作用，可译作“这样的”、“这个”等，有时不必译出'
C_SUBJECT = '<助>用在句中主语的后面，表示停顿、判断，无实义'
C_REASON = '<助>用在因果复句或条件复句偏句的末尾，提示原因或条件'
C_QUESTION = '<助>用在疑问句全句末，表示疑问语气，相当于“呢”'
C_TIME = '<助>用在时间词后面，起语助作用，可不译'
C_APPEARANCE = '<助>用某些比况、描写的词语后面，相当于“……的样子”'
C_ATTR = '<助>定语后置的标志'

Y_END_JUDGE = '<语助>用于句末；表判断'
Y_END_QUESTION = '<语助>用于句末；表疑问或反问'
Y_END_EXCLAMATION = '<语助>用于句末；表感叹'
Y_END_IMPERATIVE = '<语助>用于句末；表祈使'
Y_END_STATEMENT = '<语助>用于句末；表示陈述或解释'
Y_MIDDLE = '<助>语气助词，用于句中；表判断、陈述、解释或语气停顿'
Y_PAUSE = '<助>用于复句的前分句末或并列的句子成分之后，表示停顿和上下文的互相关连，兼有舒缓语气和抒情的作用'

Q_POSSESSIVE = '<代>第三人称代词。相当于“他（她）的”、“它的”、“他们的”'
Q_THIRD = '<代>第三人称代词。相当于“他（她）”、“它”、“他们”'
Q_FIRST = '<代>第一人称代词，相当于“我”、“我的”'
Q_SECOND = '<代>第二人称代词。相当于“你的”、“你们的”'
Q_THAT = '<代>指示代词，相当于“那”、“那些”'
Q_AMONG = '<代>指示代词，相当于“其中”、“当中”'
Q_GUESS = '<副>恐怕；大概。表示推测、估计'
Q_RHETORIC = '<副>难道，岂。表示反诘、反问'
Q_CONSULT = '<副>还是。表示委婉地商量'
Q_EXPECT = '<副>可要。表示期望'
Q_IF = '<连>如果；假如。表示假设'
Q_EMPTY = '<助>无实义，起调节节奏、舒缓语气等作用'

H_LOCATION = '<介>相当于“于”；介绍处所、方向、时间。译为“在”、“由”等'
H_COMPARE = '<介>相当于“于”；介绍比较对象。译为“与”、“对”、“比”'
H_CONDITION = '<介>相当于“于”；介绍依凭的条件'
H_OBJECT = '<介>相当于“于”；介绍动作行为的对象'
H_END_QUESTION = '<助>用在句末，表示疑问或反问'
H_END_GUESS = '<助>用在句末，表示推测'
H_END_IMPERATIVE = '<助>用在句末，表示祈使'
H_END_EXCLAMATION = '<助>用在句末，表示感叹'
H_MIDDLE = '<助>用在句中，表示停顿或舒缓'
H_SUFFIX = '<词缀>用于形容词、叠音词后面'

S_PLACE = '<名>处所；地方'
S_RESULT = '<名>合理的结果；应有的归宿'
S_NOMINAL = '<代>放在动词或动短语前，组成名词性短语，表示“……的地方”、“……的人”、“……的事物”等'
S_PASSIVE = '<助>与“为”相呼应，构成“为……所……”的被动句式'
S_NUMBER = '<数>表示不确定的数目'
S_BUILDING = '<量>处；座。用于建筑物等'
S_METHOD = '<助>“所以”：表示行为所凭借的方式、方法或依据'
S_REASON = '<助>“所以”：表示原因，相当于“……的原因、缘故”'

R_RULE = '<名>法则；准则'
R_MODEL = '<名>榜样'
R_IMITATE = '<动>效法'
R_LEVEL = '<名>等级'
R_JUDGE = '<副>用于加强判断，相当于“乃”、“就是”'
R_LIMIT = '<副>表示限定范围，相当于“只”、“仅仅”'
R_SUCCESSION = '<连>表示顺承，相当于“就”、“便”'
R_TURN = '<连>表示转折，相当于“却”、“可是”'
R_DISCOVER = '<连>表示后一件事是新发现的情况，相当于“原来已经”'
R_IF = '<连>表示假设，相当于“如果”、“假使”'
R_CONCESSION = '<连>表示让步，相当于“倒”、“倒是”'
R_EMPTY = '<助>无意义'
R_QUESTION = '<助>表示疑问，相当于“呢”'

E_PRONOUN = '<代>相当于“之”，可译作“它”、“他”等'
E_WHERE = '<代>表示疑问，相当于“何”，可译作“怎么”、“哪里”'
E_COMBO = '<兼词，相当于“于是”、“于之”'
E_RHETORIC = '<副>多用于反问，相当于“怎么”'
E_END_STATEMENT = '<助>用于句末，表示陈述语气，相当于“了”、“呢”，常可不译'
E_END_QUESTION = '<助>用于句末，表示疑问或反问，可译为“呢”'
E_MIDDLE = '<助>用于句中，表示语气舒缓、停顿'
E_SUFFIX = '词缀，用于形容词之后，相当于“……的样子”；在动词前可译作“……地”'

I_USE = '<动>用；使用'
I_DO = '<动>做'
I_CONSIDER = '<动>认为'
I_TOOL = '<介>表示动作行为所用或所凭借的工具、方法，可视情况译为“拿”、“用”、“凭”、“把”等'
I_OBJECT = '<介>起提宾作用，可译为“把”'
I_CAUSE = '<介>表示动作行为产生的原因，可译为“因为”、“由于”等'
I_TIME = '<介>表示动作行为发生的时间、地点，可译为“在”、“从”'
I_WITH = '<介>表示动作、行为的对象，用法同“与”，可译为“和”、“跟”；有时可译为“率领、带领”'
I_PARALLEL = '<连>表示并列或递进关系，可译为“而”、“又”、“并且”等，也可省去'
I_SUCCESSION = '<连>表示承接关系，“以”前的动作行为，往往是后一动作行为的手段和方式，可译为“而”，也可省去'
I_CAUSAL = '<连>表示因果关系，常用在表原因的分句前，可译为“因为”、“由于”'
I_MODIFIER = '<连>表修饰和被修饰关系'
I_PURPOSE = '<连>表目的关系，可译为“而”“来”“用来”等'
I_SCOPE = '<连>表示时间、方位、数量的界限或范围，用法同现代汉语'
I_AS_FOR = '<连>表示在叙述某件事时又转到另一件事上，可译为“至于”'
I_ALREADY = '<副>通“已”。已经'
I_STOP = '<动>通“已”。停止'
I_ONLY = '<副>只是'

H_WHAT = '<代>什么'
H_WHERE = '<代>哪里'
H_WHY = '<代>为什么'
H_HOW = '<代>怎么'
H_WHICH = '<代>哪；哪个'
H_MUCH = '<副>多么'
H_ASK = '<动>通“呵”，呵问'
H_CARRY = '<动>通“荷”，扛，背'

F_MAN = '<名>成年男子'
F_HUSBAND = '<名>女子的配偶；丈夫'
F_INTRO = '<助>用在句首，引起议论'
F_MIDDLE = '<助>用在句中，使语气显得舒缓'
F_EXCLAMATION = '<助>用在句末，表示感叹。相当于“啊”“吧”'

G_GIVE = '<动>给予'
G_RELATE = '<动>结交；交好'
G_FRIEND = '<名>朋友；同类者'
G_ALL = '<动>通“举”。整个；都'
G_AND = '<连>和'
G_OBJECT = '<介>介绍动作行为所涉及的对方，相当于“跟”、“同”等'
G_COMPARE = '<介>介绍比较对象，相当于“跟……相比”'
G_FOR = '<介>为；替'
G_AGREE = '<动>赞同'
G_PARTICIPATE = '<动>参与；参加'
G_END = '<助>表示疑问、反诘或感叹，相当于“吗”、“吧”、“啊”'

V_DO = '<动>做；干'
V_MAKE = '<动>发明；制造；制作'
V_AS = '<动>作为；当作'
V_BECOME = '<动>成为；变成'
V_BE = '<动>是'
V_GOVERN = '<动>治；治理'
V_WRITE = '<动>写；题'
V_CONSIDER = '<动>以为；认为'
V_CALL = '<动>叫做；称做'
V_TREAT = '<动>对待'
V_COUNT = '<动>算作；算是'
V_SERVE = '<动>担任'
V_DEAL = '<动>对付'
V_PASSIVE = '<介>表示被动'
V_IF = '<连>如果；假如'
V_PARTICLE = '<助>用在句中，起提前宾语的用；用在句末，表示感叹或疑问'
W_FOR = '<介>给；替'
W_TO = '<介>向；对'
W_BECAUSE = '<介>因为'
W_PURPOSE = '<介>为了'
W_PASSIVE = '<介>被'
W_TIME = '<介>在……的时候'

N_YOU = '<代>你(的)；你们(的)'
N_THIS = '<代>这；这样'
N_BE = '<动>表判断，是'
N_YET = '<副>竟然；却'
N_ONLY = '<副>仅仅；只'
N_AGAIN = '<副>又'
N_EVEN = '<副>甚至'
N_THEN = '<连>于是；就'

FOL_INHERIT = '<动>因袭；遵循'
FOL_CONTINUE = '<动>接续'
FOL_FOLLOW = '<动>依照'
FOL_ADAPT = '<动>顺应'
FOL_NOUN = '<名>原因；机会'
FOL_CAUSE = '<介>介绍动作行为发生的原因，可译为“因为”、“由于”'
FOL_RELY = '<介>介绍动作行为的依据，可译为“依靠”、“凭借”'
FOL_OBJECT = '<介>介绍动作行为的对象，可译为“依照”、“根据”'
FOL_OPPORTUNITY = '<介>介绍动作行为发生的条件，可译为“趁机”、“趁着”'
FOL_THEN = '<副>就；于是'
FOL_LINK = '<连>因为；于是'

T_SOON = '<副>将要；将近'
T_TEMP = '<副>暂且；姑且'
T_STILL = '<副>尚；尚且'
T_PARALLEL = '<连>又；一边……一边。表示并列关系'
T_PROGRESSIVE = '<连>而且；况且；并且。表示递进关系'
T_CONCESSIVE = '<连>即使；即或。表示假设关系、让步关系'
T_CHOICE = '<连>或者；还是。表示选择关系'

J_LIKE = '<动>像'
J_COMPARE = '<动>及；比得上'
J_YOU = '<代>你；你们；你(们)的'
J_THIS = '<代>这样的；这'
J_AS_FOR = '<连>至于'
J_IF = '<连>假如；如果'
J_OR = '<连>或；或者'
J_SEEM = '<副>好像；似乎'
J_SUFFIX = '<词缀>用于形容词后，表示“……的样子”，也可不译出'
A_QUESTION = '<疑问副词>怎么；哪里'


def update_map(text, field):
    result = {}
    for statement in re.finditer(r"UPDATE\s+`edu_chn_word_sense`\s+SET\s+([\s\S]*?)\nWHERE[\s\S]*?;", text):
        field_case = re.search(rf"`{field}`\s*=\s*CASE\s+`id`([\s\S]*?)END\s*(?:,|$)", statement.group(1))
        if not field_case:
            continue
        for m in re.finditer(r"WHEN\s+(\d+)\s+THEN\s+'((?:''|[^'])*)'", field_case.group(1)):
            result[m.group(1)] = m.group(2).replace("''", "'")
    return result


def effective_senses(text):
    meaning_updates = update_map(text, "meaning")
    rows = read_rows(SENSE_SQL, 10)
    return [r[:4] + [meaning_updates.get(str(r[0]), r[4])] + r[5:] for r in rows]


def ex_text(row):
    return re.sub(r"<[^>]+>", "", row[5] or "")


def classify(row):
    sid, _, word, _, old, example, *_ = row
    old = old or ""
    ex = ex_text(row)
    text = f"{old} {ex}"

    if word == "于":
        if "被" in old: return U_PASSIVE
        if "由于" in old: return U_CAUSE
        if "比" in old and "在" not in old: return U_COMPARE
        if any(x in old for x in ("向", "对", "对于", "和；跟；同", "与；跟；同")): return U_OBJECT
        if "词缀" in old or ("于飞" in ex): return U_SUFFIX
        return U_LOCATION
    if word == "而":
        if "颊毛" in old: return A_NOUN
        if "第二人称" in old: return A_PRONOUN
        if "像" in old or "好像" in old or "如同" in old: return A_LIKE
        if "表并列" in old: return A_PARALLEL
        if "表递进" in old or "何况" in old: return A_PROGRESSIVE
        if "表转折" in old: return A_TURN
        if "表修饰" in old: return A_MODIFIER
        if "表假设" in old: return A_CONDITION
        if "表因果" in old or "因而" in old: return A_CAUSE
        if "表限止" in old or "罢了" in old or "已而" in ex or "俄而" in ex: return A_BOUNDARY if "限止" in old else A_SUFFIX
        if "才" in old or "方才" in old: return A_BOUNDARY
        if "表感叹" in old: return A_EXCLAMATION
        if "表目的" in old: return A_SUCCESSION
        if "不久" in old or "一会儿" in old: return A_SUFFIX
        return A_SUCCESSION
    if word == "之":
        if "补语" in old: return Z_COMPLEMENT
        if "宾语前置" in old: return Z_OBJECT_FRONT
        if "定语后置" in old: return Z_POST_ATTR
        if "范围" in old or "前后" in old or "内外" in old: return Z_SCOPE
        if "主谓" in old or ("主语" in old and "谓语" in old): return Z_SUBJECT
        if "到" in old and ("动" in old or "往" in old): return Z_GO
        if "第二人称" in old: return Z_SECOND
        if "说话者" in old or "听话者" in old: return Z_SPEAKER
        if "指示" in old or "这件事" in old or "指这" in old: return Z_DEMONSTRATIVE
        if "代词" in old: return Z_THIRD
        if "凑足音节" in old or "人名" in old: return Z_SYLLABLE
        return Z_DE
    if word == "者":
        if "数词" in old or "数" in old and "用在" in old: return C_NUMBER
        if "样子" in old: return C_APPEARANCE
        if "定语后置" in old: return C_ATTR
        if "主语" in old or "判断" in old: return C_SUBJECT
        if "时间词" in old: return C_TIME
        if "疑问" in old: return C_QUESTION
        if "分句末" in old or "原因" in old: return C_REASON
        if "区别" in old or "这样的" in old: return C_DISTINGUISH
        return C_NOMINAL
    if word == "也":
        if "停顿" in old: return Y_MIDDLE
        if "疑问" in old or "反诘" in old: return Y_END_QUESTION
        if "祈使" in old: return Y_END_IMPERATIVE
        if "感叹" in old or "肯定" in old or "啊" in old: return Y_END_EXCLAMATION
        if "判断" in old: return Y_END_JUDGE
        return Y_END_STATEMENT
    if word == "其":
        if "第一或第二" in old or "我的" in old or "我" in old and "代词" in old: return Q_FIRST
        if "第二人称" in old or "你的" in old or "你们" in old: return Q_SECOND
        if "其中" in old: return Q_AMONG
        if "恐怕" in old or "揣测" in old: return Q_GUESS
        if "反问" in old or "难道" in old or "多么" in old: return Q_RHETORIC
        if "选择" in old: return Q_CONSULT
        if "祈使" in old: return Q_EXPECT
        if "假设" in old: return Q_IF
        if "调节" in old: return Q_EMPTY
        if "他们" in old and "的" not in old: return Q_THIRD
        if "他；它" in old: return Q_THIRD
        if "那" in old or "这" in old or "这种" in old:
            if any(x in ex for x in ("其家", "其境", "其本", "其心志", "其贤", "其利")): return Q_POSSESSIVE
            return Q_THAT
        if "他的" in old or "它的" in old or "他们的" in old: return Q_POSSESSIVE
        return Q_THIRD
    if word == "乎":
        if "词尾" in old: return H_SUFFIX
        if "句中" in old or "停顿" in old: return H_MIDDLE
        if "疑问" in old or "反问" in old: return H_END_QUESTION
        if "测度" in old or "商量" in old: return H_END_GUESS
        if "祈使" in old: return H_END_IMPERATIVE
        if "感叹" in old: return H_END_EXCLAMATION
        if "对；对于" in old: return H_OBJECT
        if "比" in old: return H_COMPARE
        return H_LOCATION
    if word == "所":
        if "建筑物" in old: return S_BUILDING
        if "数目" in old: return S_NUMBER
        if "被动" in old: return S_PASSIVE
        if "原因" in old or "缘故" in old: return S_REASON
        if "用来" in old or "方法" in old: return S_METHOD
        if "所说" in old or "所……" in old or "的人" in old or "事物" in old or "情况" in old: return S_NOMINAL
        if "到处" in old or "处所" in old or "所在" in old: return S_PLACE
        return S_NOMINAL
    if word == "则":
        if "法则" in old or "准则" in old: return R_RULE
        if "榜样" in old: return R_MODEL
        if "效法" in old: return R_IMITATE
        if "等级" in old: return R_LEVEL
        if "疑问" in old: return R_QUESTION
        if "限定" in old or "只" in old or "仅" in old: return R_LIMIT
        if "判断" in old or "就是" in old or "只当是" in old: return R_JUDGE
        if "已然" in old or "原来" in old: return R_DISCOVER
        if "假设" in old or "条件" in old: return R_IF
        if "让步" in old or "虽然" in old: return R_CONCESSION
        if "选择" in old: return R_SUCCESSION
        if "无意义" in old or "拟声" in old: return R_EMPTY
        if "转折" in old: return R_TURN
        return R_SUCCESSION
    if word == "焉":
        if "词尾" in old or "样子" in old: return E_SUFFIX
        if "句中" in old or "停顿" in old: return E_MIDDLE
        if "句末" in old and ("疑问" in old or "反问" in old): return E_END_QUESTION
        if "句末" in old or "语气助词" in old: return E_END_STATEMENT
        if "相当于“之”" in old: return E_PRONOUN
        if "于何" in old or "哪里" in old or "怎么" in old: return E_WHERE
        if "兼词" in old: return E_COMBO
        return E_RHETORIC
    if word == "以":
        if re.search(r"乾隆|崇祯|始元|八月|年十二月", ex): return I_TIME
        if "停止" in old: return I_STOP
        if "已经" in old: return I_ALREADY
        if "只是" in old: return I_ONLY
        if "认为" in old or "以为" in old: return I_CONSIDER
        if "用；任用" in old: return I_USE
        if "提宾" in old or old == "<介>把": return I_OBJECT
        if "把……作为" in old or "制成" in old: return I_OBJECT
        if "因为" in old or "因果" in old: return I_CAUSE if "连" not in old else I_CAUSAL
        if "在；从" in old: return I_TIME
        if "按照" in old or "依照" in old or "根据" in old: return I_TOOL
        if "凭" in old or "拿" in old or "用" in old: return I_TOOL
        if "对象" in old or "和；跟" in old: return I_WITH
        if "并列" in old or "递进" in old: return I_PARALLEL
        if "承接" in old: return I_SUCCESSION
        if "目的" in old: return I_PURPOSE
        if "时间" in old or "方位" in old or "范围" in old: return I_SCOPE
        if "转到" in old or "至于" in old: return I_AS_FOR
        if "缘由" in old or "原因" in old: return I_TOOL
        if "有什么" in old or "没有办法" in old: return I_TOOL
        if "用；使用" in old: return I_USE
        if "做" in old: return I_DO
        return I_TOOL
    if word == "何":
        if "喝问" in old: return H_ASK
        if "扛" in old or "背" in old: return H_CARRY
        if "多么" in old: return H_MUCH
        if "哪里" in old: return H_WHERE
        if "为什么" in old or "原因" in old: return H_WHY
        if "怎么" in old or "怎么办" in old or "怎能" in old: return H_HOW
        if "哪" in old or "什么" in old: return H_WHAT if "哪" not in old else H_WHICH
        if "啊" in old: return H_MUCH
        return H_WHAT
    if word == "夫":
        if "句首" in old: return F_INTRO
        if "句中" in old: return F_MIDDLE
        if "句末" in old or "感叹" in old: return F_EXCLAMATION
        if "丈夫" in old: return F_HUSBAND
        if "成年" in old or "男子" in old: return F_MAN
        return F_INTRO
    if word == "与":
        if "给予" in old or "授予" in old: return G_GIVE
        if "结交" in old or "亲附" in old: return G_RELATE
        if "朋友" in old or "同类" in old: return G_FRIEND
        if "通“举" in old or "整个" in old or "都" in old: return G_ALL
        if "赞许" in old or "同意" in old: return G_AGREE
        if "参加" in old or "参与" in old: return G_PARTICIPATE
        if "语气" in old or "欤" in old: return G_END
        if "比较" in old or "比；" in old: return G_COMPARE
        if "为；替" in old: return G_FOR
        if "和；跟" in old: return G_AND if "连" in old else G_OBJECT
        if "对付" in old: return G_RELATE
        return G_OBJECT
    if word == "为":
        if "范围词" in old: return W_TIME
        if "句末" in old or "语气" in old: return V_PARTICLE
        if "被" in old: return V_PASSIVE
        if "如果" in old or "假如" in old: return V_IF
        if "在……" in old or "当；等到" in old: return W_TIME
        if "因为" in old: return W_BECAUSE
        if "为了" in old: return W_PURPOSE
        if "给；替" in old: return W_FOR
        if "对；向" in old: return W_TO
        if "以为" in old or "认为" in old: return V_CONSIDER
        if "成为" in old or "变成" in old: return V_BECOME
        if "是" in old: return V_BE
        if "对待" in old: return V_TREAT
        if "担任" in old: return V_SERVE
        if "对付" in old: return V_DEAL
        if "作为" in old or "当作" in old: return V_AS
        if "算作" in old: return V_COUNT
        if "写" in old or "题" in old: return V_WRITE
        if "叫做" in old or "称做" in old: return V_CALL
        if "治" in old: return V_GOVERN
        if "发明" in old or "制造" in old: return V_MAKE
        if "做" in old: return V_DO
        return V_DO
    if word == "乃":
        if "你的" in old or "你" in old: return N_YOU
        if "这样" in old: return N_THIS
        if "判断" in old or "是；就是" in old: return N_BE
        if "只" in old or "仅" in old: return N_ONLY
        if "恐怕" in old: return N_YET
        if "竟然" in old or "转折" in old: return N_YET
        if "又" in old: return N_AGAIN
        if "甚至" in old: return N_EVEN
        if "承接" in old or "于是" in old: return N_THEN
        return N_THEN
    if word == "因":
        if "因遗策" in ex: return FOL_INHERIT
        if "因之以饥馑" in ex: return FOL_CONTINUE
        if "沿袭" in old or "继续" in old: return FOL_INHERIT if "沿袭" in old else FOL_CONTINUE
        if "根据" in old or "依照" in old: return FOL_FOLLOW
        if "顺应" in old: return FOL_ADAPT
        if "原因" in old or "缘由" in old or "机缘" in old: return FOL_NOUN
        if "因为" in old and "连" not in old: return FOL_CAUSE
        if "凭借" in old or "依靠" in old: return FOL_RELY
        if "对象" in old: return FOL_OBJECT
        if "趁" in old: return FOL_OPPORTUNITY
        if "于是" in old or "就" in old: return FOL_THEN
        return FOL_LINK
    if word == "且":
        if "将" in old or "将要" in old: return T_SOON
        if "暂且" in old or "姑且" in old: return T_TEMP
        if "尚且" in old or "让步" in old: return T_STILL
        if "并列" in old or "又" in old: return T_PARALLEL
        if "选择" in old or "或者" in old or "还是" in old: return T_CHOICE
        if "让步" in old or "即使" in old: return T_CONCESSIVE
        return T_PROGRESSIVE
    if word == "若":
        if "像" in old or "好像" in old: return J_LIKE
        if "比得上" in old: return J_COMPARE
        if "你" in old or "你们" in old: return J_YOU
        if "这样" in old or "如此" in old: return J_THIS
        if "至于" in old: return J_AS_FOR
        if "假设" in old or "如果" in old: return J_IF
        if "或者" in old or "或" in old: return J_OR
        if "从容" in old or "怎么样" in old: return J_SEEM
        if "句首" in old or "若夫" in ex: return J_AS_FOR
        if "几" in old or "多少" in old: return J_OR
        return J_SUFFIX if "词缀" in old else J_LIKE
    if word == "安":
        return A_QUESTION if "怎么" in old or "哪里" in old else A_QUESTION
    raise ValueError(word)


# 原文例句译文。优先使用项目已有篇目译文；以下为更新批次中没有历史译文的
# 外部/片段例句，均按原句语境补齐，避免出现有原文无译文。
TRANSLATIONS = {
1388: '螃蟹有六条腿和两只钳子，如果没有蛇鳝的洞穴就无处藏身。',
1389: '剑阁高峻崎岖而崔嵬险要，一人把守关口，万人也难以攻破。',
1390: '君子广泛学习并且每天检查反省自己，就能智慧明达、行为没有过错。',
1391: '楚怀王贪图利益却相信张仪，于是同齐国断绝了关系。',
1392: '把玉斗放在地上，拔出剑撞击它，把它击破了。',
1393: '人不是生下来就懂得道理的，谁能没有疑惑呢？',
1394: '却有这样的形势，仍被秦国积久的威势所胁迫。',
1395: '各位如果有意，请听从我的指挥就可以了。',
1396: '如果死后有知觉，那我们之间还要分别多久呢？',
1397: '我曾经踮起脚跟远望，却不如登高看得广阔。',
1398: '战鼓咚咚地敲响，兵器已经交锋，士兵们却丢下铠甲、拖着兵器逃跑。',
1399: '我也后悔跟随他们出来，却没有能够尽情享受游览的乐趣。',
1400: '曹操嫉妒他的才能却不能任用他。',
1401: '长久地站着远远观望，盼望得到皇帝的宠幸。',
1402: '登记官吏和百姓，封闭官府仓库，来等待将军。',
1403: '你的父亲回来，自然会再来和你算账。',
1404: '我祖母每次对我说：“某个地方，你的母亲曾经站在这里。”',
1405: '军队受到惊吓，因而撞坏了城里的房屋。',
1406: '听闻道理有先有后，学术技艺各有专门研究，如此而已。',
1407: '我一下子起身飞向榆树和檀树，飞到树上就停下来；有时飞不上去，便落在地上罢了。',
1408: '我恭敬谨慎地竭尽全力，直到死了才停止。',
1409: '三个月以后才完成。',
1410: '我虽然是最愚笨的人，也知道这样做不对，何况明智的人呢？',
1411: '不久以后，因为吴地百姓作乱的事向朝廷请求，按照法律处死了五个人。',
1412: '不久找到了他的尸体在井里，于是因而由愤怒变成悲伤，呼天抢地，哭喊得几乎气绝。',
1413: '为什么呢？是为了显示大国的威严来表示敬意。',
1414: '齐国不曾贿赂秦国，最终也随着五国灭亡，为什么呢？',
1415: '大王来的时候带了什么东西？',
1416: '一旦太后去世，长安君将凭什么在赵国托身呢？',
1417: '早晚听到的是什么声音呢？是杜鹃啼血、猿猴哀鸣。',
1418: '那么什么时候才快乐呢？',
1419: '为什么不放下武器、捆束铠甲，面向北方侍奉他呢？',
1420: '徐公怎么能比得上您呢？',
1421: '等到对天发誓、割断头发，眼泪流下沾湿衣襟，怎么衰败到这种地步啊！',
1422: '新娘的车在后面，车轮声隐隐约约，轰轰作响。',
1423: '拿着精锐的臣子和士卒、锋利的兵器来喝问：“是谁？”',
1424: '那么怎么样呢？',
1425: '刘邦大吃一惊，说：“这件事怎么办呢？”',
1426: '一旦太后去世，长安君将凭什么在赵国托身呢？',
1427: '不去做和不能做的情形有什么不同呢？',
1428: '巡抚没有忘记成名的来历，不久，县令便因他的才能出众而听闻于上级，县令很高兴，免除了成名的差役。',
1429: '母亲对府吏说：“为什么竟然这样过分愚拙？”',
1430: '天气有点冷吗？想吃东西吗？',
1431: '想要到哪里去归附呢？',
1432: '平民之间的交往尚且不互相欺骗，何况在国家之间呢？',
1433: '我学习的是道理，哪里要了解他的年龄比我大还是小呢？',
1434: '每天的饮食该不会减少了吧？',
1435: '现在逃亡也是死，发动大事也是死，同样是死，为国事而死可以吗？',
1436: '看来百姓认为我吝啬是适宜的了。',
1437: '向西望是夏口，向东望是武昌，山水相互缭绕，草木郁郁苍苍。',
1438: '于是就写下了这篇文章。',
1439: '醉翁的情趣不在酒上，而在山水之间。',
1440: '现在即使死在这里，也比我的乡邻死得晚了。',
1441: '出生在我前面的人，他懂得道理本来就比我早；出生在我后面的人，他懂得道理也可能比我早。',
1442: '君子广泛学习并且每天检查反省自己。',
1443: '也就不奇怪他偏爱自己的孩子了。',
1444: '已经进入了技艺的境界。',
1445: '因为我比你年长一天。',
1446: '用没有厚度的刀刃插入有间隙的骨节，刀刃游动起来宽绰有余。',
1447: '浩浩荡荡仿佛凌空乘风而行，不知停在哪里；飘飘然像脱离尘世、独立存在，飞升成仙。',
1448: '在朝廷上设置九宾的礼仪，我才敢把和氏璧献上去。',
1449: '估计我已经回到军营，您才进去。',
1450: '问现在是什么朝代，竟然不知道有汉朝，更不必说魏朝和晋朝了。',
1451: '现在他们的智慧反而赶不上这些人。',
1452: '项王于是又带领军队向东走，到达东城时，只剩下二十八名骑兵。',
1453: '如果事情不能成功，这就是天意。',
1454: '嬴原来是夷门的守门人。',
1455: '等到王师向北平定中原的那一天，家祭时不要忘记告诉你们的父亲。',
1456: '可是我这样做了以后，反过来再寻求这样做的原因，却不明白自己的心意。',
1457: '现在大王已经退守会稽山上，这才来寻求谋臣，恐怕太晚了吧。',
1458: '恐怕该责备的是您吧。',
1459: '府吏拜了两拜回去，在空房中长叹，打定主意的计划才这样确定下来。',
1460: '我听从了他的计策，大王也幸运地赦免了我。',
1461: '秦王害怕他撞破和氏璧。',
1462: '他懂得道理本来就比我早。',
1463: '可是我也后悔跟随他出来，却没有能够尽情享受游览的乐趣。',
1464: '我认为赵太后替长安君考虑得短浅，所以认为她疼爱燕后。',
1465: '等到出来以后，就有人责怪那个想要出来的人。',
1466: '蒋氏独自享有这种好处已经三代了。',
1468: '安陵君可要答应我啊！',
1469: '进攻不能取胜，包围又没有后援，我们还是回去吧。',
1470: '圣人之所以成为圣人、愚人之所以成为愚人，大概都出于这个原因吧？',
1471: '大王喜爱音乐很厉害，那么齐国大概就差不多治理好了吧？',
1472: '凭我残余的年岁和力量，连山上的一根草木都不能毁掉，能把土石怎么样呢？',
1473: '竭尽我的志向却不能到达，便可以没有悔恨了，难道还有谁能讥笑我吗？',
1474: '难道真的没有千里马吗？恐怕是真的不认识千里马啊。',
1475: '如果他的学业有不精通、品德有不成就的地方，不是天资低下，就是用心不如我专一。',
1476: '道路漫长而遥远，我将上天下地寻求真理。',
1477: '等到对天发誓、割断头发，眼泪流下沾湿衣襟，怎么衰败到这种地步啊！',
1478: '并且在他的墓门前立了一块石碑。',
1479: '鲁肃宣布孙权的意旨，谈论天下的形势，表达殷切的情意，并且问刘备。',
1480: '况且壮士不死就罢了，死了就要成就大的名声。',
1481: '况且燕、赵两国正处在秦国变法改革、几乎灭亡的时刻。',
1482: '我连死都不躲避，一杯酒哪里值得推辞！',
1483: '所以古代的圣人，他们远远超过一般人，尚且跟从老师请教。',
1484: '表明赵国弱小而且胆怯。',
1485: '寿命像南山的石头一样长，身体健康而且挺直。',
1486: '有懈怠而想出来的人说：“不出去，火就要燃尽了。”',
1487: '你们这些人将要被他俘虏。',
1488: '活着的人姑且偷生，死去的人永远完结了。',
1489: '发誓不再同你分离，你暂且回娘家去。',
1490: '况且天下并没有缩小削弱，雍州的土地、崤山函谷关的险固，仍然和原来一样。',
1491: '况且天地之间，万物各有自己的主人。',
1492: '况且像今年冬天，关西的士卒还没有休息。',
1493: '看它的形状像土狗，长着梅花斑的翅膀，方头、长腿，心里认为它似乎是上好的。',
1494: '我不忍心看它恐惧战栗，像没有罪却走向死地一样。',
1495: '你进去上前敬酒，敬完酒，请求用剑起舞。',
1496: '否则你们这些人都将被他俘虏。',
1497: '拿你所做的去求你想要的，就像爬到树上去捉鱼一样。',
1498: '如果占据它并拥有它，这是成就帝王事业的凭借。',
1499: '如果刘备和他们同心协力，上下团结一致，就应该安抚他们，和他们结盟交好。',
1500: '如果不能这样，为什么不放下武器、捆束铠甲，面向北方侍奉他呢？',
1501: '用一万人或者一个郡投降的，封给他万户的封地。',
1502: '至于百姓，如果没有固定的产业，就没有长久不变的心。',
1503: '像那连绵不断的阴雨，接连几个月不放晴。',
1504: '至于顺应天地万物的本性、驾驭六气的变化而遨游无穷境界的人，他还需要凭借什么呢？',
1505: '指挥若定，十分从容。',
1506: '用来使我国疲敝，怎么样呢？',
1507: '车后还有几个人递送役夫。',
1508: '又暗中让吴广到驻地旁边的丛林祠堂里去。',
1509: '成反复思考，莫非是教我寻找蟋蟀的地方吗？',
1510: '道理存在的地方，就是老师存在的地方。',
1511: '过分承蒙提拔，恩命优厚，哪里敢徘徊不前，还有什么希望呢？',
1512: '夜里就用兵包围了所住的房屋。',
1513: '我所经过的屠户朱亥。',
1514: '我听说如姬的父亲被人杀害。',
1515: '我因为言语获罪遭遇这场灾祸，又被乡里人耻笑，使先人受到侮辱。',
1516: '我用来对待侯生的礼数很周到，天下没有人不知道。',
1518: '我之所以离开亲属来侍奉您，只是仰慕您的高尚品德。',
1519: '派遣将领把守函谷关的原因，是防备其他盗贼的进入和意外的变故。',
1520: '这就是所说的在朝廷上战胜别国。',
1521: '不是我所说的传授道理、解答疑惑的老师。',
1522: '石头敲击时发出铿锵声音的地方，到处都是这样。',
1523: '原来有这样一个地方，暂且回衙门去吧。',
1524: '急忙追赶它，转过墙角，迷失了它所在的地方。',
1525: '砍下树木做兵器，举起竹竿做旗帜。',
1526: '然后把天下作为家，把崤山函谷关作为宫殿。',
1527: '最终彼此交欢，结为可以生死与共的朋友。',
1528: '冰是水凝结而成的，却比水更寒冷。',
1529: '我私下听说秦王善于演奏秦地的乐曲。',
1530: '今天我替公子做了这些事，也就足够了。',
1531: '向南夺取百越的土地，把它设置为桂林郡和象郡。',
1532: '用礼来治理国家，说话却不谦让，所以讥笑他。',
1533: '这只是灭亡的秦朝的后续罢了，我私下认为大王不应该采取这种做法。',
1534: '两个小孩笑着说：“谁说你知道得多呢？”',
1535: '如今别人正是刀和砧板，我们正是鱼和肉。',
1536: '不是因为织布缓慢，而是同一家的妇女难以织成。',
1537: '我们这些人现在要被他俘虏了。',
1538: '自己死在别人手里，被天下人嘲笑，是什么原因呢？',
1539: '否则你们这些人都将被他俘虏。',
1540: '疲弱的士兵被人马践踏，陷在泥里死去的人很多。',
1541: '千万不要因为回去就白白送死，贵贱的分别为什么这样轻易呢？',
1542: '是为了住宅的华美、妻妾的侍奉和我所认识的穷困人的感激吗？',
1543: '请允许我用赵国十五座城给秦王祝寿。',
1544: '请允许我给大王谈谈音乐。',
1545: '这件事怎么办呢？',
1546: '如姬替公子哭泣。',
1547: '趁他到来的时候，请允许我捆绑一个人从大王面前走过。',
1548: '如今别人正是刀和砧板，我们正是鱼和肉，还推辞什么呢？',
1549: '这是国家的重臣，为什么还要讨伐它呢？',
1551: '堆积土石成为高山，风雨就从那里兴起。',
1552: '这五个人，是周蓼洲先生被捕时，受到正义激励而死在这里的人。',
1553: '况且把土石放在哪里呢？',
1554: '如果不是第二次到那里，怎么知道它竟然是这样呢？',
1555: '哪里有仁德的人在位，却可以做欺骗百姓的事呢？',
1556: '还跟从老师请教他。',
1557: '离开现在的墓地把他们安葬在那里，距离现在只不过十一个月。',
1558: '还没有懂得活着的道理，怎么能懂得死呢？',
1559: '杀鸡哪里用得着宰牛的大刀呢？',
1561: '那么牛和羊有什么区别呢？',
1562: '有的从师学习，有的不从师学习，小的方面学习，大的方面却丢弃了。',
1564: '楼阁盘旋曲折，屋檐像鱼鳞一样排列，密集得不知有几千万座。',
1565: '在乱石中选择一两处敲击，发出硿硿的声音。',
1566: '城北的徐公，是齐国最美丽的人。',
1567: '张良说：“刘邦的参乘樊哙，是这样的人。”',
1568: '就是不忍心看它恐惧战栗，像无罪却走向死地，所以用羊替换了它。',
1569: '像雷霆突然震响一样，是宫车经过了。',
1570: '灭掉六国的是六国自己，不是秦国；使秦国灭族的是秦国自己，不是天下人。',
1571: '等到对天发誓、割断头发，眼泪流下沾湿衣襟，怎么衰败到这种地步啊！',
1572: '公子难道是怕死吗？为什么哭泣呢？',
1573: '假使秦国又爱护六国的百姓，那么传到三世乃至万世做君王，谁能够灭掉它呢？',
1574: '进攻不能取胜，包围又没有后援，我们还是回去吧。',
1575: '我们应当共同谋划这件事，不要让姐姐有走投无路的忧虑啊。',
1576: '这是关于石钟山的说法，人们常常怀疑它。',
1577: '他懂得道理也比我早。',
1578: '《诗经》说：“别人有心思，我可以揣测他。”说的就是先生您这样的人。',
1579: '难道不是长久的计策、让子孙相继为王吗？',
1580: '难道只是伶人才这样吗？',
1581: '希望用十五座城请求交换和氏璧。',
1582: '士大夫最终也不肯用小船在夜里停泊在陡峭的山壁下面。',
1583: '凭借勇气在诸侯中闻名。',
1584: '时间久了，能够凭脚步声辨认人。',
1585: '都爱好文辞，并且凭借辞赋受到称赞。',
1586: '曹操应当把鲁肃送还给乡里。',
1587: '在八月十三日被斩首于市集。',
1588: '在崇祯十七年夏天，从京城步行到华山，做了道士。',
1589: '赵王难道会因为一块璧的缘故欺骗秦国吗？',
1590: '怀王因为不知道忠臣的职分，所以在内被郑袖迷惑，在外被张仪欺骗。',
1591: '现在用事实来核对它。',
1592: '我的船只依次都向前行进。',
1593: '以一人抵挡十人。',
1594: '夜以继日，日夜不停。',
1595: '把秋天作为婚期。',
1596: '平坦而且近，游览的人就多。',
1597: '忽然间魂惊魄动。',
1598: '我和四个人举着火把进去。',
1599: '樊哙侧过他的盾牌来撞击。',
1600: '请立太子为王，来断绝秦国的希望。',
1601: '被秦国积久的威势所胁迫，天天削减、月月割让，以至于走向灭亡。',
1602: '不贿赂秦国的国家因为贿赂秦国的国家而灭亡。',
1603: '诸侯因为公子贤能、门客众多，十多年不敢出兵谋取魏国。',
1604: '接受遗命以来，早晚忧虑叹息。',
1605: '从这里往前，十五座城都给赵国。',
1606: '从王侯以下，没有不奢侈的。',
1607: '反而因此使我的心情受到煎熬。',
1608: '我认为赵太后替长安君考虑得短浅。',
1609: '都认为比徐公美。',
1610: '忠臣不一定被任用，贤者不一定被使用。',
1611: '古人拿着蜡烛游玩，确实有原因啊。',
1612: '本来已经因此对它感到奇怪了。',
1613: '太阳一天天地西下，很快就要完全落尽了。',
1614: '没有办法，就实行王道吗？',
1615: '老虎像看待一般东西一样看它，觉得它是一个庞然大物，把它当作神来敬畏。',
1616: '医生喜欢给没有病的人治病，把这当作自己的功劳！',
1617: '向南夺取百越的土地，把它设置为桂林郡和象郡。',
1618: '铸造它来制作十二个金人。',
1619: '我因此记下这件事，是感叹郦道元的简略，也嘲笑李渤的浅陋。',
1620: '公子先走而我没有送行，因此知道公子怨恨我又返回来了。',
1621: '项王没有办法回答，说：“坐下。”',
1622: '齐王把喜爱音乐的事情告诉我，我没有什么可以回答的。',
1623: '所以不积累半步，就没有办法到达千里；不汇聚细小水流，就没有办法形成江海。',
1624: '我没有祖母，就没有办法活到今天；祖母没有我，就没有办法终了她的余年。',
1625: '没有不依据地势的形状来刻画的，各自具有各自的情态。',
1626: '善于作战的人顺应敌我形势，因势利导。',
1628: '依靠别人的力量却反过来损害他，这是不仁义的。',
1629: '又因为用丰厚的礼物收买当权者靳尚。',
1630: '不如趁此机会优厚地款待他。',
1631: '趁机在座位上袭击刘邦。',
1632: '通过门客引领到蔺相如门前谢罪。',
1633: '因为修建玉清宫，砍伐山上的树木取材，才有人看见它。',
1634: '对于恩惠所施加的人，就要想到不要因一时高兴而错误地奖赏。',
1635: '于是拔出刀砍向前面的奏案。',
1636: '相如于是拿着璧退后站立。',
1637: '到现在还没有相会的机会。',
1638: '所以事情因循世俗，却要使准备适合事情的需要。',
1639: '承接已有的基业，沿袭前代的策略。',
1640: '加上有军队来攻打，接着又有饥荒。',
1641: '于是就在朝廷上设置九宾的礼仪。',
1642: '缙绅、大夫和士人聚集在左丞相府，没有人知道计策从哪里来。',
1643: '从小路逃走，把和氏璧送回赵国。',
1644: '楚国有多余的土地，却不够分给百姓。',
1645: '在别人看来是值得讥笑的，在自己却是悔恨。',
1646: '学业由于勤奋而精通，由于嬉游而荒废。',
1647: '请奉命向孙将军请求救援。',
1648: '鲁肃听说刘表去世了，把这件事告诉孙权说……',
1649: '爱自己的孩子，选择老师来教他；对于他自己，却以从师学习为可耻。',
1650: '您被赵王宠幸。',
1651: '所以在内被郑袖迷惑，在外被张仪欺骗。',
1652: '身高八尺，常常把自己比作管仲、乐毅。',
1653: '燕王想同您结交。',
1654: '孔子说：“苛刻的政治比老虎还要凶猛。”',
1656: '在这时宾客没有不变了脸色离开席位的。',
1657: '我的祖父死在这里，我的父亲也死在这里。',
1658: '于是秦王很不高兴，为此击打一块瓦缶。',
1659: '于是我对此有所感叹。',
1660: '于是用黑色衣服安葬文公，晋国从这时开始穿黑色丧服。',
1661: '于是秦王很不高兴，为此击打一只瓦缶。',
1662: '吴地百姓正感到痛心，于是趁他声色严厉地呵斥时，喧闹着追逐起来。',
1663: '于是替长安君约定车辆一百辆，把他送到齐国做人质。',
1664: '我将长久地被大方之家嘲笑。',
1665: '现在这条溪水偏偏被愚弄而受到侮辱，为什么呢？',
1666: '刘邦的军队驻扎在霸上，还没有能够和项羽相见。',
1667: '你的父亲回来，自然会再来和你算账。',
1668: '陈涉年轻时，曾经和别人一起被雇佣耕田。',
1669: '给你三支箭，你一定不要忘记你父亲的遗志！',
1670: '我和徐公相比，谁更美？',
1671: '把秦国受贿赂所得的土地，同战胜别国所得的土地比较，实际上多一百倍。',
1672: '然而谋臣和勇士，不能不培养并选择。',
1673: '勾践把稻米和油脂装在船上出发。',
1674: '生了三个孩子，公就给他们母亲衣食；生了两个孩子，公就给他们粮食。',
1675: '就给他一只完整的猪腿。',
1676: '给你三支箭，你一定不要忘记你父亲的遗志。',
1677: '依靠别人的力量却反过来损害他，这是不仁义的；失去自己的同盟，不明智。',
1678: '联合各国缔结盟约，彼此结为一体。',
1679: '齐国亲附秦国，却不帮助其他五国。',
1680: '庞暖是很容易对付的。',
1681: '蹇叔的儿子参加了军队。',
1682: '我赞同曾点。',
1683: '早晨犯错晚上就改正，君子赞许他。',
1684: '恐怕该责备的是您吧。',
1685: '虎兕从笼子里跑出，龟甲和玉器在匣子里毁坏，这是谁的过错呢？',
1686: '那么废除衅钟的仪式吗？',
1687: '他对妻子说：“我和城北徐公相比，谁更美？”',
1688: '刘邦说：“你和项伯相比，谁年长谁年幼？”',
1689: '您看廉颇将军和秦王相比，谁更强？',
1690: '我和徐公相比，谁更美？',
1691: '与其坐着等待灭亡，不如站起来拯救它。',
1692: '与其杀死这个孩子，不如把他卖掉。',
1693: '项王说：“壮士！赏给他一杯酒。”于是给他一大杯酒。',
1694: '所以木材用墨线量过就直，刀剑靠近磨刀石就锋利。',
1695: '进入国内如果没有守法的大臣，离开国内如果没有敌国外患，国家常常会灭亡。',
1696: '假如当初我不做这件差事，那么早已经困苦不堪了。',
1697: '职位低就觉得羞耻，官职高就近于谄媚。',
1698: '在家就孝顺父母，出门就敬爱兄长。',
1700: '手刚抬起，两只蟋蟀就迅速跳开了。',
1701: '他的房屋相距很近，那个人却相隔很远。',
1702: '不是死了，就是迁徙。',
1703: '不是自己种的粮食就不吃。',
1705: '等到了黄河边，却发现他已经在船里了。',
1706: '十条。',
1707: '以自身的行为作为榜样。',
1708: '遵循后稷、公刘的事业，就是古公、公季的法度。',
1709: '平日在家就说：“没有人了解我！”',
1710: '给窦娥烧一陌纸钱，就算是看在你死去的孩子的面上。',
1711: '接连发出啧啧的赞叹声。',
1712: '如果再有人说让长安君去做人质，我一定吐他一脸唾沫。',
1713: '秦穆公以来二十多位君主，从来没有能够坚定明确地遵守约定的。',
1714: '这几件事，是用兵的祸患。',
1715: '有人不同于这两种人的心情，为什么呢？',
1716: '说起这些，脸色好像非常忧伤。',
1717: '然而来来回回地观察它，觉得它没有什么特殊本领。',
1718: '寻找一个可以出使回复秦国的人，没有找到。',
1719: '不久，烟火冲天，人和马烧死、淹死的很多。',
1720: '廉颇，是赵国的优秀将领。',
1721: '老师，是用来传授道理、教授学业、解答疑难问题的人。',
1722: '近来奉命讨伐有罪的人。',
1723: '古时候把天下人作为主人，君主作为客人。',
1724: '然而曹操最终能够战胜袁绍，以弱小变为强大，不只是天时，也是人的谋划。',
1725: '我之所以离开亲属来侍奉您，只是仰慕您的高尚品德。',
1726: '我的妻子认为我美，是因为偏爱我。',
1727: '为什么呢？是为了显示大国的威严来表示敬意。',
1728: '是谁替大王出了这个计策？',
1729: '太后怒气冲冲地向他作揖。',
1730: '不知道将军宽待我到了这样的地步。',
1731: '我本是市井中击鼓宰牛的屠夫，可是公子多次救济我。',
1732: '这样告诉你，又怕你每天替我担忧。',
1733: '孔子想要这样做，我们两个大臣都不想这样做。',
1734: '君子痛恨那些不说自己想要它，却一定要替自己的欲望找借口的人。',
1735: '这两只小虫又知道什么呢？',
1736: '比较这两种计策，宁可答应秦国使它承担理亏。',
1737: '虎兕从笼子里跑出，龟甲和玉器在匣子里毁坏，这是谁的过错呢？',
1738: '儿子想到要报父母的仇，臣子想到要报君主的仇。',
1739: '我年轻时尚且不如别人，现在年老了，更没有能力了。',
1740: '客人认为我美，是因为想要向我有所求。',
1741: '不担心他们人数不足，却担心他们的志向品行缺少羞耻之心。',
1742: '大王不要对百姓认为我吝啬这件事感到奇怪。',
1743: '不懂得断句，不能解决疑惑，有的从师学习，有的不从师学习。',
1744: '比如把肉投给饥饿的老虎，有什么功效呢？',
1745: '《诗经》说：“别人有心思，我可以揣测他。”说的就是先生您这样的人。',
1746: '蚯蚓没有锋利的爪牙和强健的筋骨。',
1747: '世上又有谁能让洁白的身体蒙受污浊，受到外物玷污呢？',
1748: '战鼓咚咚地敲响，兵器已经交锋，士兵们丢下铠甲、拖着兵器逃跑。',
1749: '我关着窗子独自居住，时间久了，能够凭脚步声辨认人。',
1750: '一会儿，烟火冲天。',
1751: '为什么还要心神不定地想去哪里呢？',
1752: '凭什么要飞到九万里的高空再向南飞呢？',
1753: '有一头牛经过堂下，齐王看见它，问道：“牛要到哪里去？”',
}


def question_updates(mapping):
    rows = read_rows(QUESTION_SQL, 7)
    by_word = defaultdict(list)
    for sid, meaning in mapping.items():
        by_word[meaning["word"]].append(meaning["meaning"])
    for word in by_word:
        by_word[word] = list(dict.fromkeys(by_word[word]))
    updates = {}
    for row in rows:
        if row[2] != "1" or row[6] != "0":
            continue
        item = mapping.get(str(row[1]))
        if not item:
            continue
        options = [{"content": item["meaning"], "correct": True}]
        options += [{"content": x, "correct": False} for x in by_word[item["word"]] if x != item["meaning"]][:3]
        while len(options) < 4:
            options.append({"content": "暂无其他字典释义", "correct": False})
        updates[str(row[0])] = json.dumps(options, ensure_ascii=False, separators=(",", ":"))
    return updates


def append_update(path, marker, lines):
    text = path.read_text(encoding="utf-8")
    if marker in text:
        return False
    path.write_text(text.rstrip() + "\n\n" + marker + "\n" + "\n".join(lines) + "\n", encoding="utf-8")
    return True


def main():
    sense_text = SENSE_SQL.read_text(encoding="utf-8")
    rows = effective_senses(sense_text)
    mapping = {}
    for row in rows:
        if row[1] == "2" and row[2] in WORDS and row[9] == "0":
            mapping[str(row[0])] = {"word": row[2], "old": row[4], "meaning": classify(row)}

    missing = [r for r in rows if r[1] == "2" and r[2] in WORDS and r[9] == "0" and r[5] and not r[7]]
    missing_ids = {int(r[0]) for r in missing}
    translation_updates = {sid: TRANSLATIONS[sid] for sid in missing_ids if sid in TRANSLATIONS}
    unresolved = sorted(missing_ids - set(translation_updates))
    if unresolved:
        raise RuntimeError(f"仍缺译文映射：{unresolved}")

    sense_ids = sorted(mapping, key=int)
    sense_lines = ["START TRANSACTION;", "UPDATE `edu_chn_word_sense` SET `meaning` = CASE `id`"]
    for sid in sense_ids:
        sense_lines.append(f"  WHEN {sid} THEN {quote(mapping[sid]['meaning'])}")
    sense_lines += ["  ELSE `meaning` END,", "  `example_trans` = CASE `id`"]
    for sid in sorted(translation_updates):
        sense_lines.append(f"  WHEN {sid} THEN {quote(translation_updates[sid])}")
    sense_lines += ["  ELSE `example_trans` END", f"WHERE `id` IN ({','.join(sense_ids)}) AND `word_class` = 2 AND `is_del` = 0;", "COMMIT;"]
    sense_written = append_update(SENSE_SQL, SENSE_MARKER, sense_lines)

    q_updates = question_updates(mapping)
    q_ids = sorted(q_updates, key=int)
    q_lines = ["START TRANSACTION;", "UPDATE `edu_chn_word_question` SET `options_json` = CASE `id`"]
    for qid in q_ids:
        q_lines.append(f"  WHEN {qid} THEN {quote(q_updates[qid])}")
    q_lines += ["  ELSE `options_json` END;", f"WHERE `id` IN ({','.join(q_ids)}) AND `question_type` = 1 AND `is_del` = 0;", "COMMIT;"]
    q_written = append_update(QUESTION_SQL, QUESTION_MARKER, q_lines)

    report = [
        "# 虚词字典释义与译文同步报告", "", "依据：更新后的 `/Users/tal/Desktop/tog/yuwen/虚词字典.docx`。", "",
        "本次只处理 `word_class=2`、`is_del=0` 的现有虚词记录；不删除例句、来源、目录关系和历史审核记录。", "",
        f"- 同步虚词：{', '.join(sorted({v['word'] for v in mapping.values()}))}",
        f"- 释义同步：{len(mapping)} 条 sense", f"- 译文补齐：{len(translation_updates)} 条有原文记录",
        f"- 题型一同步：{len(q_updates)} 条", f"- 仍缺译文：{len(unresolved)} 条",
        f"- sense SQL 已追加：{'是' if sense_written else '否（已有同名标记）'}",
        f"- question SQL 已追加：{'是' if q_written else '否（已有同名标记）'}", "",
        "## 重点校验", "", f"- sense_id=1533：{TRANSLATIONS.get(1533, '未找到')}", "",
        "## 各字记录数", "", "| 原词 | 有效 sense | 有例句 | 本次补译 |", "| --- | ---: | ---: | ---: |",
    ]
    counts = Counter(v["word"] for v in mapping.values())
    with_example = Counter(r[2] for r in rows if r[1] == "2" and r[2] in WORDS and r[9] == "0" and r[5])
    added = Counter(r[2] for r in missing if int(r[0]) in translation_updates)
    for word in sorted(counts):
        report.append(f"| {word} | {counts[word]} | {with_example[word]} | {added[word]} |")
    report += ["", "## 仍缺译文记录", ""]
    report.append("无。" if not unresolved else "、".join(map(str, unresolved)))
    REPORT.write_text("\n".join(report) + "\n", encoding="utf-8")
    print(json.dumps({"senseUpdates": len(mapping), "translationUpdates": len(translation_updates), "questionUpdates": len(q_updates), "unresolved": unresolved, "report": str(REPORT)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
