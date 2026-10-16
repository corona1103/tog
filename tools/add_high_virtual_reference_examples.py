#!/usr/bin/env python3
"""只追加《高三文言文阅读第2讲：常考文言虚词》中的虚词例句。

本脚本不会更新或删除已有 sense/catalog/question 记录；新增内容统一为草稿。
"""

from collections import Counter, defaultdict
from datetime import date
from hashlib import md5
from pathlib import Path
import json
import re

from docx import Document


ROOT = Path(__file__).resolve().parents[1]
SQL_DIR = ROOT / "sql"
DOCX = Path("/Users/tal/Documents/toG进校项目九章AI学/内容和运营/语文产品/词典内容/高三文言文阅读第2讲：常考文言虚词.docx")
SENSE_SQL = SQL_DIR / "edu_chn_word_sense.sql"
CATALOG_SQL = SQL_DIR / "edu_chn_word_catalog.sql"
QUESTION_SQL = SQL_DIR / "edu_chn_word_question.sql"
REPORT = SQL_DIR / "edu_chn_word_virtual_reference_examples.md"

VERSION_ID = "00b6bf17df4345109f570bf0273705f3"
VERSION_NAME = "部编版"
WORDS = ["而", "何", "乎", "乃", "其", "且", "若", "所", "为", "焉", "也", "以", "因", "于", "与", "则", "者", "之"]
PINYIN = {
    "而": "ér", "何": "hé", "乎": "hū", "乃": "nǎi", "其": "qí", "且": "qiě",
    "若": "ruò", "所": "suǒ", "为": "wéi", "焉": "yān", "也": "yě", "以": "yǐ",
    "因": "yīn", "于": "yú", "与": "yǔ", "则": "zé", "者": "zhě", "之": "zhī",
}


def sql_tuples(text):
    out = []
    i = 0
    while True:
        i = text.find("\n(", i)
        if i < 0:
            break
        start = i + 1
        end = start
        quoted = False
        while end < len(text):
            char = text[end]
            if char == "'":
                if quoted and end + 1 < len(text) and text[end + 1] == "'":
                    end += 2
                    continue
                quoted = not quoted
            elif char == ")" and not quoted:
                out.append(text[start:end + 1])
                i = end + 1
                break
            end += 1
        if end >= len(text):
            break
    return out


def split_tuple(item):
    body = item[1:-1]
    fields = []
    start = 0
    quoted = False
    index = 0
    while index < len(body):
        char = body[index]
        if char == "'":
            if quoted and index + 1 < len(body) and body[index + 1] == "'":
                index += 2
                continue
            quoted = not quoted
        elif char == "," and not quoted:
            fields.append(body[start:index].strip())
            start = index + 1
        index += 1
    fields.append(body[start:].strip())
    return fields


def sql_value(token):
    if token == "NULL":
        return None
    if token.startswith("'") and token.endswith("'"):
        return token[1:-1].replace("''", "'").replace("\\\\", "\\")
    return token


def read_rows(path, field_count):
    rows = []
    for item in sql_tuples(path.read_text(encoding="utf-8")):
        fields = split_tuple(item)
        if len(fields) == field_count and re.fullmatch(r"\d+", fields[0]):
            rows.append([sql_value(field) for field in fields])
    return rows


def quote(value):
    if value is None:
        return "NULL"
    text = str(value).replace("\\", "\\\\").replace("'", "''")
    return f"'{text}'"


def normalize(text):
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", "", str(text))
    text = re.sub(r"\s+", "", text)
    text = text.translate(str.maketrans({"；": ";", "。": ".", "，": ",", "！": "!", "？": "?", "：": ":", "“": '"', "”": '"'}))
    return text.strip(".,;!?：；，。！？")


def strip_doc_annotations(text):
    # 文档中的圆括号主要是出处、释义提示或注音提示，不属于原文例句。
    text = re.sub(r"[（(][^（）()]*[）)]", "", text)
    text = re.sub(r"《[^》]+》", "", text)
    return re.sub(r"\s+", "", text).strip()


def clean_title(title):
    title = title.replace("〈", "《").replace("〉", "》").replace("?", "·").replace("•", "·")
    return title


def source_title(title):
    return title if title.startswith("《") else f"《{title}》"


def parse_docx():
    doc = Document(DOCX)
    current_word = None
    section = ""
    rows = []
    for paragraph_index, paragraph in enumerate(doc.paragraphs):
        text = " ".join(paragraph.text.split()).strip()
        if not text:
            continue
        if text in WORDS:
            current_word = text
            section = ""
            continue
        if not current_word:
            continue
        if (text.startswith("【") or re.match(r"^（[一二三四五六七八九十]+）", text)
                or re.match(r"^\d+[．.]", text)):
            section = text
        match = re.match(r"^[①②③④⑤⑥⑦⑧⑨⑩]\s*(.*)$", text)
        if not match:
            continue
        raw = match.group(1).strip()
        titles = re.findall(r"《([^》]+)》", raw)
        title = clean_title(titles[-1]) if titles else "常考虚词例句"
        example = strip_doc_annotations(raw)
        if not example:
            continue
        rows.append({
            "word": current_word,
            "example": example,
            "title": title,
            "section": section,
            "paragraph": paragraph_index,
        })
    if len(rows) != 369:
        raise RuntimeError(f"文档例句数量异常：期望 369，实际 {len(rows)}")
    return rows


def section_meaning(word, section, example):
    text = section.replace("。", "")
    if word == "而":
        if "并列" in text: return "<连>表并列；又"
        if "递进" in text: return "<连>表递进；并且；而且"
        if "承接" in text: return "<连>表承接；就；接着"
        if "转折" in text: return "<连>表转折；但是；却"
        if "假设" in text: return "<连>表假设；如果；假如"
        if "修饰" in text: return "<连>表修饰"
        if "因果" in text: return "<连>表因果；因而"
        if "目的" in text: return "<连>表目的；来；用来"
        if "通“尔”" in text: return "<代>第二人称代词；你的；你"
        if "通“如”" in text: return "<动>像；好像；如同"
        if "而已" in text: return "<助>表限止；罢了"
        if "而后" in text: return "<副>才；方才"
        if "而况" in text: return "<副>何况"
        if "既而" in text: return "<副>不久；一会儿"
    if word == "何":
        if "单独作谓语" in text: return "<代>为什么；什么原因"
        if "作动词或介词的宾语" in text: return "<代>哪里；什么"
        if "作定语" in text: return "<代>什么；哪"
        if "疑问副词" in text or "句首或动词前" in text: return "<副>为什么；怎么"
        if "形容词前" in text: return "<副>怎么；多么；怎么这样"
        if "语助词" in text: return "<语气>啊"
        if "通“呵”" in text: return "<动>喝问"
        if "何如" in text: return "<副>怎么样；怎么办；为什么"
        if "何以" in text: return "<介>拿什么；凭什么"
        if "无何" in text: return "<副>不久；没多久"
        if "何乃" in text: return "<副>怎能"
    if word == "乎":
        if "表疑问" in text or "反问" in text: return "<语气>表疑问或反问；吗；呢"
        if "测度" in text or "商量" in text: return "<语气>表测度或商量；吧"
        if "感叹" in text or "祈使" in text: return "<语气>表感叹或祈使；啊；呀"
        if "停顿" in text: return "<语气>表停顿"
        if "介词" in text:
            if "乎己" in example or "对于" in text: return "<介>相当于“于”；对；对于"
            if "比" in example or "盖进" in example or "长乎" in example: return "<介>相当于“于”；比"
            return "<介>相当于“于”；在；从"
        if "词尾" in text: return "<助>词尾；……的样子；……地"
    if word == "乃":
        if "顺承" in text or "紧接" in text: return "<副>表承接；才；这才；就"
        if "出乎意料" in text or "违背常理" in text: return "<副>表转折；却；竟然；反而"
        if "范围" in text or "限制" in text: return "<副>只；仅"
        if "判断句" in text: return "<动>是；就是"
        if "第二人称" in text: return "<代>第二人称；你的；你"
        if "指示代词" in text: return "<代>这样"
        if "无乃" in text: return "<副>恐怕"
        if "乃尔" in text: return "<副>这样"
    if word == "其":
        if "领属性定语" in text: return "<代>第三人称代词；他的；它的；他们的"
        if "小主语" in text: return "<代>第三人称代词；他；它；他们"
        if "第一人称或第二人称" in text: return "<代>第一或第二人称；我的；我；你的；你"
        if "远指" in text: return "<代>指示代词；那；那个；那些；那里"
        if "近指" in text: return "<代>指示代词；这；这个；这些"
        if "其中的" in text: return "<代>其中的"
        if "祈使" in text: return "<副>表祈使；可；还是"
        if "揣测" in text: return "<副>表揣测；恐怕；或许；大概；可能"
        if "反问" in text: return "<副>表反问；难道；怎么"
        if "选择" in text: return "<连>表选择；是……还是……"
        if "假设" in text: return "<连>表假设；如果"
        if "调节音节" in text: return "<助>调节音节；不译"
        if "何其" in text: return "<副>多么"
    if word == "且":
        if "况且" in text or "再说" in text: return "<连>表递进；况且；再说"
        if "而且" in text or "并且" in text: return "<连>表递进；而且；并且"
        if "让步" in text or "尚且" in text: return "<连>表让步；尚且；还"
        if "并列" in text: return "<连>表并列；又；又……又……"
        if "将" in text: return "<副>将；将要"
        if "暂且" in text or "姑且" in text: return "<副>暂且；姑且"
        if "且夫" in text: return "<助>况且；再说"
        if "且如" in text: return "<介>就像"
    if word == "若":
        if "动词" in text or "像，好像" in text: return "<动>像；好像"
        if "对称" in text: return "<代>你；你们；你的"
        if "近指" in text: return "<代>这；这样；如此"
        if "假设" in text: return "<连>表假设；如果；假如"
        if "选择" in text: return "<连>表选择；或；或者"
        if "至，至于" in text: return "<动>到；至于"
        if "若夫" in text: return "<助>用于句首；要说那；像那"
        if "若定" in text: return "<副>心中有数；从容不迫"
        if "若何" in text: return "<副>怎么样"
        if "若干" in text: return "<数>几；多少"
    if word == "所":
        if "名词，处所" in text: return "<名>处所；地方"
        if ("所字结构" in text or "“所”字结构" in text) and "定语" not in text: return "<助>所……的人；所……的事物；所……的情况"
        if "定语" in text: return "<助>所……的"
        if "为……所" in text: return "<助>与“为”组成被动结构"
        if "凭借的方式" in text: return "<助>用来……的方法；是用来……的"
        if "表示原因" in text: return "<助>……的原因；缘故"
        if "所谓" in text: return "<助>所说的"
        if "到处" in text: return "<副>到处"
        if "所在之处" in text: return "<名>所在之处；处所"
    if word == "为":
        if "有“做”" in text: return "<动>做；作为；充当；变成；成为"
        if "以为" in text: return "<动>以为；认为"
        if "判断词" in text: return "<动>是"
        if "被动" in text: return "<介>被"
        if "原因或目的" in text: return "<介>为了；因为"
        if "涉及的对象" in text: return "<介>给；替"
        if "对，向" in text: return "<介>对；向"
        if "时间" in text: return "<介>当；等到"
        if "句末" in text: return "<语气>句末语气；呢"
    if word == "焉":
        if "于之" in text or "于此" in text or "于彼" in text: return "<兼>相当于“于之”；在其中；从这里；在这件事上"
        if "于何" in text: return "<代>相当于“于何”；哪里；从哪里"
        if "相当于“之”" in text: return "<代>相当于“之”"
        if "哪里，怎么" in text: return "<副>哪里；怎么"
        if "句末" in text: return "<语气>句末语气；了；啊；呢"
        if "句中" in text: return "<语气>句中语气；表停顿"
        if "词尾" in text: return "<助>词尾；……的样子；……地"
    if word == "也":
        if "判断" in text: return "<助>表判断；是"
        if "陈述或解释" in text: return "<助>表陈述、解释"
        if "肯定、感叹" in text: return "<语气>表肯定、感叹"
        if "疑问或反诘" in text: return "<语气>表疑问或反诘"
        if "祈使" in text: return "<语气>表祈使"
        if "句中或句末" in text or "句中语气词" in text or ("句中" in text and "停顿" in text): return "<助>表停顿"
        if "之谓" in text: return "<语气>说的就是……啊"
        if "也哉" in text: return "<语气>表感叹或反诘"
    if word == "以":
        if "表示工具" in text: return "<介>拿；用；凭着"
        if "表示凭借" in text: return "<介>凭；靠"
        if "所处置的对象" in text: return "<介>把"
        if "时间、处所" in text: return "<介>在；从"
        if "表示原因" in text: return "<介>因为；由于"
        if "表示依据" in text: return "<介>按照；依照；根据"
        if "并列或递进" in text: return "<连>表并列或递进；而；又；而且；并且"
        if "承接关系" in text: return "<连>表承接；而；或不译"
        if "目的关系" in text: return "<连>表目的；来；用来；以致"
        if "因果关系" in text: return "<连>表因果；因为"
        if "修饰关系" in text: return "<连>表修饰；而；或不译"
        if "时间、方位和范围" in text: return "<助>表示时间、方位、范围"
        if "调整音节" in text: return "<助>调整音节；不译"
        if "以为，认为" in text or "认为，把" in text: return "<动>以为；认为"
        if "用，任用" in text: return "<动>用；任用"
        if "名词" in text: return "<名>缘由；原因"
        if "通“已”" in text and "止" in text: return "<副>通“已”；停止"
        if "通“已”" in text: return "<副>通“已”；已经"
        if "把……作为" in text or "制成" in text: return "<介>把……作为；制成"
        if "以是" in text: return "<连>因此"
        if "有以" in text or "无以" in text: return "<助>有什么或没有办法用来……"
    if word == "因":
        if "依照" in text: return "<介>依照；根据"
        if "依靠" in text: return "<介>依靠；凭借"
        if "趁着" in text: return "<介>趁着；趁此"
        if "通过" in text: return "<介>通过；经由"
        if "因为" in text: return "<介>因为；由于"
        if "于是" in text: return "<副>于是；就；因而"
        if "原因" in text: return "<名>原因；缘由；机缘"
        if "根据" in text: return "<动>根据"
        if "沿袭" in text: return "<动>沿袭；继续"
    if word == "于":
        if text.startswith("1．在") or "在，从，到" in text: return "<介>在；从；到"
        if "在……方面" in text or "从……中" in text: return "<介>在……方面；从……中"
        if "由于" in text: return "<介>由于"
        if "向，对" in text or "对于" in text: return "<介>向；对；对于"
        if "被" in text: return "<介>被"
        if "与，跟" in text: return "<介>与；跟；同"
        if "比" in text: return "<介>比"
        if "于+此" in text: return "<介>相当于“于+此”；在这时；对此；因此；从此"
        if "连词" in text: return "<连>表承接或因果；于是"
        if "见……于" in text: return "<介>表被动"
    if word == "与":
        if "介词" in text and "和" in text: return "<介>和；跟；同"
        if "给，替" in text: return "<介>给；替"
        if "比" in text: return "<介>比；和……比较"
        if "连词" in text: return "<连>和；跟；同"
        if "给予" in text: return "<动>给予；授予"
        if "结交" in text: return "<动>结交；亲附"
        if "对付" in text: return "<动>对付"
        if "参加" in text: return "<动>参加；参与"
        if "赞许" in text: return "<动>赞许；同意"
        if "通假" in text: return "<语气>通“欤”；表感叹或疑问"
        if "孰与" in text: return "<介>和……比较；哪一个"
        if "孰若" in text: return "<介>哪如；与其……哪如……"
    if word == "则":
        if "承接" in text: return "<连>表承接；就；便"
        if "条件" in text or "假设" in text: return "<连>表条件、假设；如果……就……；那么"
        if "并列" in text: return "<连>表并列；就；或不译"
        if "转折" in text or "让步" in text: return "<连>表转折、让步；可是；却；虽然"
        if "选择" in text: return "<连>表选择；就是；不是……就是……"
        if "判断句" in text: return "<副>表判断；是；就是"
        if "已然" in text or "发现" in text: return "<副>表已然；已经；原来"
        if "文字的条数" in text: return "<名>篇；条"
        if "准则" in text: return "<名>准则；法则"
        if "动词" in text: return "<动>效法"
        if "通假" in text: return "<副>通“辄”；总是；常常"
        if "则是" in text: return "<副>只当是"
        if "则则" in text: return "<拟声>赞叹的声音"
    if word == "者":
        if "指人、物、事" in text: return "<助>指人、物、事、时、地等；……的"
        if "数词" in text: return "<助>用在数词后；……个方面；……样东西；……件事情"
        if "若”“似”“如" in text: return "<助>……的样子"
        if "后置的定语" in text: return "<助>定语后置的标志"
        if "主语后面" in text: return "<助>放在主语后；表判断"
        if "时间词" in text: return "<助>用在时间词后；不译"
        if "引出原因" in text: return "<助>放在分句末；引出原因"
        if "疑问句" in text: return "<语气>表疑问"
    if word == "之":
        if "第三人称代词" in text: return "<代>第三人称代词；他；她；它（们）"
        if "指示代词" in text: return "<代>指示代词；这；此"
        if "相当于现代汉语的“的”" in text: return "<助>相当于现代汉语的“的”"
        if "主语和谓语" in text: return "<助>放在主语和谓语之间；取消句子独立性"
        if "宾语提前" in text: return "<助>宾语前置的标志"
        if "定语后置" in text: return "<助>定语后置的标志"
        if "凑足音节" in text: return "<助>凑足音节；不译"
        if "动词" in text or "到……去" in text: return "<动>到……去"
    raise RuntimeError(f"无法根据文档分类：{word} / {section} / {example}")


def apply_meaning_updates(rows, sql_text):
    updates = {}
    for block in re.finditer(r"UPDATE\s+`edu_chn_word_sense`\s+SET\s+`meaning`\s*=\s*CASE\s+`id`([\s\S]*?)END\s*\nWHERE[\s\S]*?;", sql_text):
        for match in re.finditer(r"WHEN\s+(\d+)\s+THEN\s+'((?:''|[^'])*)'", block.group(1)):
            updates[int(match.group(1))] = match.group(2).replace("''", "'")
    return [dict(row, meaning=updates.get(row["id"], row["meaning"])) for row in rows]


def rows_from_sql(path, count):
    out = []
    for raw in read_rows(path, count):
        out.append(raw)
    return out


def load_senses():
    sql_text = SENSE_SQL.read_text(encoding="utf-8")
    result = []
    for row in rows_from_sql(SENSE_SQL, 10):
        result.append({
            "id": int(row[0]), "word_class": int(row[1]), "word": row[2], "pinyin": row[3],
            "meaning": row[4], "example": row[5], "source": row[6], "translation": row[7],
            "status": int(row[8]), "is_del": int(row[9]),
        })
    return apply_meaning_updates(result, sql_text)


def load_catalogs():
    result = []
    for row in rows_from_sql(CATALOG_SQL, 9):
        result.append({"id": int(row[0]), "version_id": row[1], "version_name": row[2], "volume_id": row[3], "volume_name": row[4], "sense_id": int(row[5]), "sort": int(row[6]), "status": int(row[7]), "is_del": int(row[8])})
    return result


def load_questions():
    result = []
    for row in rows_from_sql(QUESTION_SQL, 7):
        result.append({"id": int(row[0]), "sense_id": int(row[1]), "type": int(row[2]), "stem": row[3], "options": json.loads(row[4]), "status": int(row[5]), "is_del": int(row[6])})
    return result


def mark_word(example, word):
    if not example or "<b>" in example:
        return example
    escaped = re.escape(word)
    return re.sub(escaped, f"<b>{word}</b>", example)


def volume_map(catalogs):
    volumes = {}
    for row in catalogs:
        if row["version_id"] == VERSION_ID and row["volume_name"] not in volumes:
            volumes[row["volume_name"]] = row["volume_id"]
    return volumes


CURRENT_VOLUMES = {
    "高中必修上册": {"劝学", "师说", "赤壁赋", "登泰山记", "愚公移山"},
    "高中必修下册": {"子路、曾皙、冉有、公西华侍坐", "齐桓晋文之事", "鸿门宴", "促织", "谏逐客书", "谏太宗十思疏", "答司马谏议书", "阿房宫赋", "庖丁解牛", "六国论", "烛之武退秦师"},
    "高中选择性必修上册": {"论语", "大学之道", "老子四章"},
    "高中选择性必修中册": {"屈原列传", "五代史伶官传序", "过秦论"},
    "高中选择性必修下册": {"石钟山记", "种树郭橐驼传", "归去来兮辞并序", "陈情表", "项脊轩志", "兰亭集序"},
}


def volume_for_title(title, existing_volumes):
    for volume, titles in CURRENT_VOLUMES.items():
        if title in titles:
            return volume
    return "高中常考虚词"


def sql_insert(table, columns, rows):
    lines = [f"INSERT INTO `{table}`", "(" + ", ".join(f"`{column}`" for column in columns) + ")", "VALUES"]
    lines.append(",\n".join("(" + ", ".join(quote(item) if not isinstance(item, int) else str(item) for item in row) + ")" for row in rows) + ";")
    return "\n".join(lines)


def main():
    if not DOCX.exists():
        raise FileNotFoundError(DOCX)
    senses = load_senses()
    catalogs = load_catalogs()
    questions = load_questions()
    doc_rows = parse_docx()

    existing_key = {(row["word"], normalize(row["example"]), normalize(row["meaning"])) for row in senses if row["word_class"] == 2 and row["word"] in WORDS and row["example"]}
    existing_translation = {}
    for row in senses:
        if row["word_class"] == 2 and row["word"] in WORDS and row["example"] and row["translation"]:
            existing_translation.setdefault((row["word"], normalize(row["example"])), row["translation"])

    additions = []
    seen = set()
    for item in doc_rows:
        meaning = section_meaning(item["word"], item["section"], item["example"])
        key = (item["word"], normalize(item["example"]), normalize(meaning))
        if key in existing_key or key in seen:
            continue
        seen.add(key)
        additions.append({**item, "meaning": meaning})

    max_sense = max((row["id"] for row in senses), default=0)
    next_sense = max_sense + 1
    for item in additions:
        item["id"] = next_sense
        next_sense += 1
        item["pinyin"] = PINYIN[item["word"]]
        item["example"] = mark_word(item["example"], item["word"])
        item["translation"] = existing_translation.get((item["word"], normalize(item["example"])))
        item["volume_name"] = volume_for_title(item["title"], volume_map(catalogs))
        item["source"] = f"{item['volume_name']}｜{source_title(item['title'])}"
        item["status"] = 0
        item["is_del"] = 0

    if not additions:
        raise RuntimeError("文档例句均已存在，没有可追加内容")

    existing_volumes = volume_map(catalogs)
    for item in additions:
        if item["volume_name"] not in existing_volumes:
            existing_volumes[item["volume_name"]] = md5(f"{VERSION_NAME}|{item['volume_name']}".encode()).hexdigest()
    max_sort = defaultdict(int)
    for row in catalogs:
        if row["version_id"] == VERSION_ID and row["is_del"] == 0:
            max_sort[row["volume_id"]] = max(max_sort[row["volume_id"]], row["sort"])
    max_catalog_id = max((row["id"] for row in catalogs), default=0)
    catalog_additions = []
    for item in additions:
        volume_id = existing_volumes[item["volume_name"]]
        max_catalog_id += 1
        max_sort[volume_id] += 1
        catalog_additions.append((max_catalog_id, VERSION_ID, VERSION_NAME, volume_id, item["volume_name"], item["id"], max_sort[volume_id], 0, 0))

    # 生成新增题目：题型一四选项，题型二固定两选项，两个题型 A 均为正确答案。
    all_records = senses + additions
    meanings_by_word = defaultdict(list)
    for row in all_records:
        if row.get("word_class", 2) == 2 and row["word"] in WORDS:
            meanings_by_word[row["word"]].append(row["meaning"])
    examples_by_meaning = defaultdict(list)
    examples_by_word = defaultdict(list)
    for row in all_records:
        if row.get("word_class", 2) == 2 and row["example"]:
            marked = mark_word(row["example"], row["word"])
            examples_by_meaning[(row["word"], normalize(row["meaning"]))].append(marked)
            examples_by_word[row["word"]].append((normalize(row["meaning"]), marked))
    max_question_id = max((row["id"] for row in questions), default=0)
    question_additions = []
    for item in additions:
        distractors = []
        for meaning in meanings_by_word[item["word"]]:
            if meaning != item["meaning"] and meaning not in distractors:
                distractors.append(meaning)
            if len(distractors) == 3:
                break
        plain = re.sub(r"^<[^>]+>", "", item["meaning"])
        for fallback in (f"<反义>与“{plain}”相反", f"<字面义>按“{item['word']}”字面理解", f"<字面义>“{item['word']}”的本义"):
            if len(distractors) == 3:
                break
            if fallback not in distractors and fallback != item["meaning"]:
                distractors.append(fallback)
        q1_options = [{"content": item["meaning"], "correct": True}] + [{"content": d, "correct": False} for d in distractors[:3]]

        same = examples_by_meaning.get((item["word"], normalize(item["meaning"])), [])
        same = [example for example in same if normalize(example) != normalize(item["example"])]
        other = [example for meaning, example in examples_by_word[item["word"]] if meaning != normalize(item["meaning"])]
        q2_options = [
            {"content": same[0] if same else "暂无例句", "correct": True},
            {"content": other[0] if other else "暂无例句", "correct": False},
        ]
        max_question_id += 1
        question_additions.append((max_question_id, item["id"], 1, f"下列对例句“{re.sub(r'<[^>]+>', '', item['example'])}”中“{item['word']}”的解释，正确的一项是", json.dumps(q1_options, ensure_ascii=False, separators=(",", ":")), 0, 0))
        max_question_id += 1
        question_additions.append((max_question_id, item["id"], 2, f"下列句子中“{item['word']}”的意义和用法，与例句相同的一项是", json.dumps(q2_options, ensure_ascii=False, separators=(",", ":")), 0, 0))

    sense_values = [(item["id"], 2, item["word"], item["pinyin"], item["meaning"], item["example"], item["source"], item["translation"], 0, 0) for item in additions]
    sense_block = sql_insert("edu_chn_word_sense", ["id", "word_class", "word", "pinyin", "meaning", "example", "source", "example_trans", "status", "is_del"], sense_values)
    catalog_block = sql_insert("edu_chn_word_catalog", ["id", "version_id", "version_name", "volume_id", "volume_name", "sense_id", "sort", "status", "is_del"], catalog_additions)
    question_block = sql_insert("edu_chn_word_question", ["id", "sense_id", "question_type", "stem", "options_json", "status", "is_del"], question_additions)
    marker = "-- 高三常考虚词文档例句补充（仅追加）"
    sense_sql = SENSE_SQL.read_text(encoding="utf-8")
    if marker not in sense_sql:
        append = f"\n\n{marker}\nSTART TRANSACTION;\n{sense_block}\nCOMMIT;\n"
        SENSE_SQL.write_text(sense_sql + append, encoding="utf-8")
    catalog_sql = CATALOG_SQL.read_text(encoding="utf-8")
    if marker not in catalog_sql:
        append = f"\n\n{marker}\nSTART TRANSACTION;\n{catalog_block}\nCOMMIT;\n"
        CATALOG_SQL.write_text(catalog_sql + append, encoding="utf-8")
    question_sql = QUESTION_SQL.read_text(encoding="utf-8")
    if marker not in question_sql:
        append = f"\n\n{marker}\nSTART TRANSACTION;\n{question_block}\nCOMMIT;\n"
        QUESTION_SQL.write_text(question_sql + append, encoding="utf-8")

    missing_translation = [item for item in additions if not item["translation"]]
    by_word = Counter(item["word"] for item in additions)
    report = [
        "# 高三常考虚词文档例句补充结果",
        "",
        f"更新时间：{date.today().isoformat()}",
        "",
        "本批仅追加文档中的虚词例句；已有 sense、catalog、question 记录未更新、未删除。新增记录均为 `status = 0, is_del = 0`。",
        "",
        f"- 文档例句：{len(doc_rows)} 条",
        f"- 实际新增词义例句：{len(additions)} 条",
        f"- 同步新增目录关系：{len(catalog_additions)} 条",
        f"- 同步新增题目：{len(question_additions)} 条（每条新增例句 2 题）",
        f"- 暂无可靠译文：{len(missing_translation)} 条；未自行编写译文",
        "",
        "## 按字统计",
        "",
        "| 原词 | 新增例句 | 新 sense_id 范围 |",
        "| --- | ---: | --- |",
    ]
    for word in WORDS:
        items = [item for item in additions if item["word"] == word]
        if items:
            report.append(f"| {word} | {len(items)} | {items[0]['id']}–{items[-1]['id']} |")
    report += ["", "## 译文待补列表", "", "以下新增记录的原文来自参考文档，但项目现有 SQL 中没有可安全复用的逐句译文；本批保留 NULL，待后续人工补充。", "", "| sense_id | 原词 | 原文 | 来源 |", "| ---: | --- | --- | --- |"]
    for item in missing_translation:
        report.append(f"| {item['id']} | {item['word']} | {item['example']} | {item['source']} |")
    REPORT.write_text("\n".join(report) + "\n", encoding="utf-8")
    print(json.dumps({"documentExamples": len(doc_rows), "addedSenses": len(additions), "addedCatalogs": len(catalog_additions), "addedQuestions": len(question_additions), "missingTranslations": len(missing_translation), "byWord": by_word, "report": str(REPORT)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
