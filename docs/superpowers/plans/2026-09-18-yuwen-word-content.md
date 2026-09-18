# 高中必修上册实虚词内容与学生端预览 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为《芣苢》《劝学》《师说》生成可入库的实虚词词义、题目和教材映射数据，并提供独立学生端预览页面。

**Architecture:** 使用一个 Node.js 生成脚本维护经过整理的核心词内容，脚本同时输出两张业务表的 SQL、教材映射 CSV 和无后端 HTML 预览。预览页面复用同一份生成数据，避免 SQL 与页面内容漂移。

**Tech Stack:** Node.js、原生 HTML/CSS/JavaScript、MySQL INSERT SQL、CSV。

---

### Task 1: 建立可重复生成的内容数据源

**Files:**
- Create: `tools/generate_yuwen_word_content.js`
- Reference: `sql/edu_chn_poem_catalog_demo.sql`
- Reference: `docs/superpowers/specs/2026-09-18-yuwen-word-content-design.md`

- [x] **Step 1: 定义固定教材常量和核心词数据结构**

在生成脚本中定义固定版本、分册、单元 ID，并为每条词义记录保存：词类、原词、拼音、词义、原文例句、来源、翻译、题目混淆项、辨析句选项和正确项。

- [x] **Step 2: 覆盖三篇课文的核心实词与虚词**

内容至少覆盖：

- 《芣苢》：薄言、采、有、掇、捋、袺、襭。
- 《劝学》：已、中、輮、砺、参省、知、跂、假、绝、跬步、驾、锲、镂、用心、躁，以及虚词而、于、之、以、者、焉。
- 《师说》：师、受、道、惑、固、从、师道、出、下、耻、圣、愚、所以、为、身、句读、或、遗、族、相、复、不齿、乃、及、攻、贻，以及虚词之、其、而、于、以、者、焉。

- [x] **Step 3: 实现生成函数和转义函数**

实现 MySQL 字符串转义、HTML 文本转义、题目选项 JSON 序列化和教材映射行生成，确保中文、单引号、换行和 `<b>` 标记不会破坏输出。

### Task 2: 生成 SQL 与教材映射

**Files:**
- Modify: `tools/generate_yuwen_word_content.js`
- Create: `sql/edu_chn_word_sense.sql`
- Create: `sql/edu_chn_word_question.sql`
- Create: `sql/edu_chn_word_catalog.sql`
- Create: `word_book_scope.csv`

- [x] **Step 1: 输出词义 SQL**

输出完整建表说明注释、事务、显式 `id` 的 `INSERT INTO edu_chn_word_sense` 和 `ON DUPLICATE KEY UPDATE`，记录从 1 开始连续编号，初始 `status=0,is_del=0`。

- [x] **Step 2: 输出题目 SQL**

每条词义输出 `question_type=1` 和 `question_type=2` 各一条，题目 ID 从 1 开始连续编号，选项 JSON 固定四项且恰好一个正确项；使用 `ON DUPLICATE KEY UPDATE` 对应 `uk_sense_type`。

- [x] **Step 3: 输出教材映射 CSV**

输出固定版本、分册、单元、篇目、词类、原词和 `sense_id`，每个词义只挂载到其来源篇目对应的单元。

- [x] **Step 4: 输出教材关系 SQL**

创建 `edu_chn_word_catalog` 关系表，并写入与 CSV 相同的 78 条映射记录，使用 `(version_id, volume_id, unit_id, sense_id)` 唯一约束。

### Task 3: 创建独立学生端预览

**Files:**
- Create: `demo/yuwen/accumulation/word-student-preview.html`

- [x] **Step 1: 创建横屏平板外壳和词卡列表**

实现教材上下文、实词/虚词筛选、篇目筛选、原词聚合卡片、拼音、词义、例句、翻译和来源展示。

- [x] **Step 2: 创建查看题目抽屉**

点击词卡按钮后，按该原词的全部词义例句展示两类题目；支持关闭、点击遮罩关闭和长内容滚动。

- [x] **Step 3: 加入可读性边界**

窄视口显示横屏提示；长句、选项和抽屉内容不溢出；不实现提交、判题和审核状态。

### Task 4: 自动校验与浏览器验收

**Files:**
- Modify: `tools/generate_yuwen_word_content.js`
- Verify: `sql/edu_chn_word_sense.sql`
- Verify: `sql/edu_chn_word_question.sql`
- Verify: `word_book_scope.csv`
- Verify: `demo/yuwen/accumulation/word-student-preview.html`

- [x] **Step 1: 运行生成脚本**

运行 `node tools/generate_yuwen_word_content.js`，确认四个输出文件生成。

- [x] **Step 2: 校验 SQL 记录关系**

解析 INSERT 行和 `options_json`，确认每个 `sense_id` 有两题、每题四个选项且只有一个正确项，CSV 中的 `sense_id` 全部存在。

- [x] **Step 3: 静态检查页面脚本和交互挂载点**

打开本地 HTML，验证筛选、查看题目、关闭抽屉、滚动长内容和页面可读性。

- [x] **Step 4: 检查工作区差异**

确认只新增本任务相关文件，不覆盖用户已有的 `index.html` 或无关改动。
