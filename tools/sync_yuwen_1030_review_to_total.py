"""将 1030 实虚词二审 SQL 的最终结果同步覆盖到三份总表 SQL。

同步策略：
* 二审与总表均存在的同 ID 记录，按二审整行字段覆盖；
* 二审新增 ID 使用 INSERT ... ON DUPLICATE KEY UPDATE；
* 总表中属于二审范围、但二审已删除的词义及关联题目/目录，置为 status=0、is_del=1；
* 同步区块带固定标记，可重复执行，不会重复追加有效数据。
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from apply_word_audit_total import extract_tuples, read_rows, split_tuple, sql_value as parse_sql_value


TOTAL_DIR = ROOT / "sql"
REVIEW_DIR = TOTAL_DIR / "1030实虚词二审"
MARKER_START = "/* 1030实虚词二审复审同步总表：START */"
MARKER_END = "/* 1030实虚词二审复审同步总表：END */"


TABLES = {
    "sense": {
        "table": "edu_chn_word_sense",
        "columns": ["id", "word_class", "word", "pinyin", "meaning", "example", "source", "example_trans", "status", "is_del"],
        "file": "edu_chn_word_sense.sql",
        "reference_index": None,
    },
    "catalog": {
        "table": "edu_chn_word_catalog",
        "columns": ["id", "version_id", "version_name", "volume_id", "volume_name", "sense_id", "sort", "status", "is_del"],
        "file": "edu_chn_word_catalog.sql",
        "reference_index": 5,
    },
    "question": {
        "table": "edu_chn_word_question",
        "columns": ["id", "sense_id", "question_type", "stem", "options_json", "status", "is_del"],
        "file": "edu_chn_word_question.sql",
        "reference_index": 1,
    },
}


def sql_value(value: object) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, int):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def row_sql(row: list) -> str:
    return "(" + ", ".join(sql_value(value) for value in row) + ")"


def read_base_rows(path: Path, field_count: int) -> list[list]:
    """读取总表原始 INSERT，排除本脚本上次生成的同步区块。"""
    text = path.read_text()
    start = text.find(MARKER_START)
    if start >= 0:
        end = text.find(MARKER_END, start)
        if end < 0:
            raise RuntimeError(f"同步区块缺少结束标记：{path}")
        text = text[:start] + text[end + len(MARKER_END):]
    rows = []
    for item in extract_tuples(text):
        fields = split_tuple(item)
        if len(fields) == field_count and fields[0].isdigit():
            rows.append([parse_sql_value(field) for field in fields])
    return rows


def update_sql(spec: dict, row: list) -> str:
    assignments = ", ".join(
        f"`{column}` = {sql_value(value)}"
        for column, value in zip(spec["columns"][1:], row[1:])
    )
    return f"UPDATE `{spec['table']}` SET {assignments} WHERE `id` = {row[0]};"


def insert_sql(spec: dict, rows: list[list]) -> str:
    if not rows:
        return ""
    columns = ", ".join(f"`{column}`" for column in spec["columns"])
    updates = ",\n".join(
        f"`{column}` = VALUES(`{column}`)" for column in spec["columns"][1:]
    )
    values = ",\n".join(row_sql(row) for row in rows)
    return (
        f"INSERT INTO `{spec['table']}`\n({columns})\nVALUES\n{values}\n"
        "ON DUPLICATE KEY UPDATE\n"
        f"{updates};"
    )


def replace_sync_block(path: Path, block: str) -> None:
    text = path.read_text()
    start = text.find(MARKER_START)
    if start >= 0:
        end = text.find(MARKER_END, start)
        if end < 0:
            raise RuntimeError(f"同步区块缺少结束标记：{path}")
        end += len(MARKER_END)
        text = text[:start].rstrip() + "\n\n" + text[end:].lstrip()
    commit = text.rfind("COMMIT;")
    if commit < 0:
        raise RuntimeError(f"未找到 COMMIT：{path}")
    text = text[:commit].rstrip() + "\n\n" + block.rstrip() + "\n\n" + text[commit:]
    path.write_text(text)


def main() -> None:
    parsed = {}
    for name, spec in TABLES.items():
        total_path = TOTAL_DIR / spec["file"]
        review_path = REVIEW_DIR / spec["file"]
        parsed[name] = {
            "spec": spec,
            "total_path": total_path,
            "review_path": review_path,
            "total": read_base_rows(total_path, len(spec["columns"])),
            "review": read_rows(review_path, len(spec["columns"])),
        }

    total_senses = {row[0]: row for row in parsed["sense"]["total"]}
    review_senses = {row[0]: row for row in parsed["sense"]["review"]}
    review_words = {row[2] for row in parsed["sense"]["review"]}
    deleted_sense_ids = {
        row[0]
        for row in parsed["sense"]["total"]
        if row[2] in review_words and row[0] not in review_senses
    }

    counts = {"updated": {}, "inserted": {}, "deleted": sorted(deleted_sense_ids)}
    for name, data in parsed.items():
        spec = data["spec"]
        total = {row[0]: row for row in data["total"]}
        review = {row[0]: row for row in data["review"]}
        updates = [review[row_id] for row_id in sorted(set(total) & set(review)) if total[row_id] != review[row_id]]
        inserts = [review[row_id] for row_id in sorted(set(review) - set(total))]

        if name == "sense":
            for row_id in sorted(deleted_sense_ids):
                row = list(total[row_id])
                row[-2:] = [0, 1]
                if row not in updates:
                    updates.append(row)
        else:
            ref_index = spec["reference_index"]
            for row in data["total"]:
                if row[0] in {item[0] for item in data["review"]}:
                    continue
                if ref_index is not None and row[ref_index] in deleted_sense_ids:
                    updated = list(row)
                    updated[-2:] = [0, 1]
                    if updated != row:
                        updates.append(updated)

        counts["updated"][name] = len(updates)
        counts["inserted"][name] = len(inserts)
        lines = [MARKER_START, f"-- 来源：{REVIEW_DIR}"]
        if updates:
            lines.append("\n".join(update_sql(spec, row) for row in updates))
        if inserts:
            lines.append(insert_sql(spec, inserts))
        lines.append(MARKER_END)
        replace_sync_block(data["total_path"], "\n".join(lines))

    print({"updated": counts["updated"], "inserted": counts["inserted"], "deleted_sense_ids": counts["deleted"]})


if __name__ == "__main__":
    main()
