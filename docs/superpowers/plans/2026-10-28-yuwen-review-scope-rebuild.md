# 语文实虚词审核范围恢复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 以审核问题修改.xlsx 为唯一增量范围，恢复未审核数据，并让 SQL 与预览页一致。

**Architecture:** 以提交前 SQL 的有效状态为基线；仅对审核表明确涉及的词义、题目、教材关系做覆盖，新增和删除分别处理；最后从 SQL 重新生成预览页并做逐行范围校验。

**Tech Stack:** Python、openpyxl、SQL 文本解析、现有 Node 预览生成脚本。

---

### Task 1: 按审核范围重建三张词典 SQL

**Files:**
- Create: `tools/rebuild_yuwen_word_sql_review_scope.py`
- Modify: `sql/edu_chn_word_sense.sql`
- Modify: `sql/edu_chn_word_question.sql`
- Modify: `sql/edu_chn_word_catalog.sql`

- [x] 从 `HEAD` 的有效 SQL 状态读取基线。
- [x] 从审核表读取已有词义、删除项和新增项；只覆盖对应 sense_id 及其题目/教材关系。
- [x] 写入完整 INSERT 加明确删除 UPDATE，保留未审核记录的原值。

### Task 2: 重新生成并校验预览页

**Files:**
- Modify: `demo/yuwen/accumulation/word-student-preview.html`

- [x] 执行 `node tools/update_yuwen_word_preview.js`。
- [x] 校验预览页内嵌数据与三张 SQL 的有效记录逐条一致。
- [x] 校验未涉及记录与基线一致，审核涉及记录与当前审核覆盖一致。
