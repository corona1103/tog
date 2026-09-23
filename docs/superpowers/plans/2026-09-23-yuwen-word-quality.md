# 语文实虚词内容质量修订实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修订统一实虚词内容的词性、空例句质量和预览页审核复制能力。

**Architecture:** 以现有高中、初中词条生成脚本为数据源，在统一合并前完成释义格式和例句校验；最终由统一 SQL 与预览页共享同一份记录映射。预览页从每条例句的 `sense_id` 和题目映射生成复制文本，不改变数据库表结构。

**Tech Stack:** Node.js 生成脚本、静态 HTML/CSS/JavaScript、MySQL INSERT SQL、Git。

---

### Task 1: 统一词性格式

**Files:**
- Modify: `/Users/tal/Desktop/tog/tools/generate_yuwen_word_content.js`
- Modify: `/Users/tal/Desktop/tog/tools/generate_junior_word_content.js`
- Modify: `/Users/tal/Desktop/tog/tools/merge_yuwen_word_content.js`
- Modify: `/Users/tal/Desktop/tog/sql/edu_chn_word_sense.sql`

- [ ] 为高中和初中源数据增加词性格式化函数，保证所有 `meaning` 以 `<...>` 开头。
- [ ] 对已有统一 SQL 的 500 条记录执行同一套格式化校验，避免只修改预览数据。
- [ ] 运行生成和合并脚本，确认词义数量仍为 500，且不存在无词性释义。

### Task 2: 空例句复核与报告

**Files:**
- Modify: `/Users/tal/Desktop/tog/tools/generate_yuwen_word_content.js`
- Modify: `/Users/tal/Desktop/tog/tools/generate_junior_word_content.js`
- Create: `/Users/tal/Desktop/tog/sql/edu_chn_word_missing_examples.md`
- Modify: `/Users/tal/Desktop/tog/sql/edu_chn_word_sense.sql`
- Modify: `/Users/tal/Desktop/tog/sql/edu_chn_word_question.sql`
- Modify: `/Users/tal/Desktop/tog/sql/edu_chn_word_catalog.sql`

- [ ] 逐条检查 49 条空例句，补录能从项目原文确认的例句和译文。
- [ ] 对仍缺少原文的记录输出 `sense_id、词、篇目、当前释义、缺失原因` 清单并保持草稿。
- [ ] 确认空例句不生成题目，补齐例句后自动生成对应两类题目和上架目录关系。

### Task 3: 预览页复制定位信息

**Files:**
- Modify: `/Users/tal/Desktop/tog/demo/yuwen/accumulation/word-student-preview.html`

- [ ] 在每条例句操作区增加“复制”按钮。
- [ ] 为记录建立题目 ID 映射，并复制 `sense_id、word、meaning、book、example、question_id` 信息。
- [ ] 实现 Clipboard API 和文本域回退，复制成功后按钮显示短暂反馈。
- [ ] 保持现有题目按钮、词义 Tab、版本/分册/篇目筛选逻辑不变。

### Task 4: 校验与交付

**Files:**
- Modify: `/Users/tal/Desktop/tog/sql/edu_chn_word_missing_examples.md`

- [ ] 运行 SQL 行数、ID、题型选项、目录孤儿关系和空例句校验。
- [ ] 运行 `git diff --check` 和页面脚本语法检查。
- [ ] 检查预览页按钮文案、复制内容和无题目记录的表现。

