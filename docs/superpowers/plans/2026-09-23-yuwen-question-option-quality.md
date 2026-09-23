# 语文实虚词题目选项质量修订 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按已确认的优先级重生成统一高中、初中实虚词题目，让题型一使用可靠的多义词混淆项，题型二使用同义/异义真实例句，并在缺失时显示“暂无例句”。

**Architecture:** 将题目选项选择逻辑集中到 `tools/word_question_options.js`，将外部词典经人工确认的内容固化到 `tools/yuwen_word_external_examples.js`，由独立的统一题目生成器读取合并后的词义 SQL 并重写题目 SQL。预览页继续读取统一 SQL，但在渲染时将“暂无例句”标红。

**Tech Stack:** Node.js CommonJS、MySQL INSERT SQL、静态 HTML/CSS/JavaScript、Node.js 内置 `assert`/文件读写。

---

## 文件结构与职责

- Create: `/Users/tal/Desktop/tog/tools/yuwen_word_external_examples.js`：保存经人工确认的外部词义、例句、译文和来源。
- Create: `/Users/tal/Desktop/tog/tools/word_question_options.js`：纯题目候选选择模块，负责题型一、题型二的排序、去重和“暂无例句”兜底。
- Create: `/Users/tal/Desktop/tog/tools/regenerate_yuwen_word_questions.js`：读取统一词义 SQL，调用候选模块，写出统一题目 SQL。
- Create: `/Users/tal/Desktop/tog/tools/check_word_questions.js`：校验题目结构、首项正确、候选来源和“暂无例句”标记。
- Modify: `/Users/tal/Desktop/tog/tools/replace_high_word_content.js`：保留高中与初中词义/目录合并能力，统一生成完成后调用新的题目生成器。
- Modify: `/Users/tal/Desktop/tog/tools/merge_yuwen_word_content.js`：兼容历史合并入口，统一生成完成后调用新的题目生成器。
- Modify: `/Users/tal/Desktop/tog/tools/update_yuwen_word_preview.js`：从题目 SQL 读取题型选项，并让“暂无例句”拥有专用 CSS 类。
- Modify: `/Users/tal/Desktop/tog/tools/generate_yuwen_word_content.js`：同步基础预览模板的选项标记逻辑和题型规则说明。
- Modify: `/Users/tal/Desktop/tog/demo/yuwen/accumulation/word-student-preview.html`：由预览更新脚本重新生成，不手工维护数据块。
- Modify: `/Users/tal/Desktop/tog/sql/edu_chn_word_question.sql`：统一生成 1=词义选择、2=辨析选择题目。

## Task 1: 固化外部词典参考资源

**Files:**

- Create: `/Users/tal/Desktop/tog/tools/yuwen_word_external_examples.js`

- [ ] **Step 1: 设计资源记录格式并写入可追溯来源**

每条记录使用以下字段，`meaning` 必须包含词性前缀：

```js
module.exports = [
  {
    word: '为',
    meaning: '<介>被',
    example: '身死人手，为天下笑者，何也？',
    exampleTrans: '自己死在别人手里，被天下人嘲笑，是什么原因呢？',
    source: '《过秦论》｜华夏文库文言文词典参考',
    sourceUrl: 'https://wyw.hwxnet.com/view/hwxE4hwxB8hwxBA.html',
  },
];
```

从用户提供的网站逐词核对原文和释义；仅写入可以确认原文、词义和翻译的条目。优先补充当前统一数据中题型二 A/B 缺失最多的原词，尤其是同一原词存在多个义项但缺少交叉例句的词。

- [ ] **Step 2: 为资源提供稳定索引函数**

在同一文件导出：

```js
function getExternalExamples() {
  return module.exports;
}

module.exports.getExternalExamples = getExternalExamples;
```

生成器通过 `getExternalExamples()` 读取数组，不在运行时访问网络。

- [ ] **Step 3: 运行资源自检**

执行：

```bash
node -e "const rows=require('./tools/yuwen_word_external_examples'); if(!rows.every(x=>x.word&&x.meaning&&x.example&&x.exampleTrans&&x.source&&x.sourceUrl)) process.exit(1); console.log(rows.length)"
```

预期：输出外部参考条目数量且退出码为 0。

## Task 2: 实现统一题目候选选择模块

**Files:**

- Create: `/Users/tal/Desktop/tog/tools/word_question_options.js`
- Test: `/Users/tal/Desktop/tog/tools/check_word_questions.js`

- [ ] **Step 1: 定义候选模块接口**

实现以下接口，输入的 `records` 是统一词义记录数组，字段至少包括 `id`、`word`、`meaning`、`example`、`source`：

```js
const UNAVAILABLE_EXAMPLE = '暂无例句';

function buildQuestions(records, externalExamples) {
  // 返回 [{ senseId, type: 1|2, stem, options: [{content, correct}] }]
}

module.exports = {
  UNAVAILABLE_EXAMPLE,
  buildQuestions,
};
```

- [ ] **Step 2: 实现题型一混淆释义优先级**

对每条有原文例句的词义：

```js
const meanings = unique([
  ...records
    .filter(item => item.word === row.word && item.meaning !== row.meaning)
    .sort(byId)
    .map(item => item.meaning),
  ...externalExamples
    .filter(item => item.word === row.word && item.meaning !== row.meaning)
    .map(item => item.meaning),
  ...(TYPE1_FALLBACK_MEANINGS[row.word] || []),
]).filter(item => item !== row.meaning);

const options = [
  { content: row.meaning, correct: true },
  ...meanings.slice(0, 3).map(content => ({ content, correct: false })),
];
```

当不足 3 项时，按词配置的常考义、反义或字面义继续补足；每个候选必须有词性前缀或明确的语义标签，不能使用随机词。最终固定为 4 项。

- [ ] **Step 3: 实现题型二真实例句优先级**

为当前记录排除自身后分别寻找：

```js
const sameExample = records
  .filter(item => item.id !== row.id && item.word === row.word && item.meaning === row.meaning && item.example)
  .sort(byId)[0]
  || externalExamples.find(item => item.word === row.word && item.meaning === row.meaning && item.example);

const otherExample = records
  .filter(item => item.word === row.word && item.meaning !== row.meaning && item.example)
  .sort(byId)[0]
  || externalExamples.find(item => item.word === row.word && item.meaning !== row.meaning && item.example);
```

题型二固定返回：

```js
[
  { content: sameExample ? sameExample.example : UNAVAILABLE_EXAMPLE, correct: true },
  { content: otherExample ? otherExample.example : UNAVAILABLE_EXAMPLE, correct: false },
]
```

禁止生成“该词在该句中表示……”这类非原文伪例句。若外部例句存在 `<b>` 标记，保留标记；没有标记时由统一高亮函数补齐。

- [ ] **Step 4: 添加纯逻辑断言用例**

在 `check_word_questions.js` 中构造以下最小记录集并断言：

```js
const records = [
  { id: 1, word: '望', meaning: '<动>远看', example: '吾尝跂而望矣。' },
  { id: 2, word: '望', meaning: '<名>农历每月十五日', example: '七月既望。' },
  { id: 3, word: '绝', meaning: '<动>横渡', example: '而绝江河。' },
];
```

断言结果：

- “望”题型一 A 为 `<动>远看`，B 至少为 `<名>农历每月十五日`。
- “望”题型二 A 为 `七月既望。`，B 为 `暂无例句`。
- “绝”题型二 A、B 都为 `暂无例句`，但 A `correct=true`、B `correct=false`。
- 每道题型一正好 4 项，题型二正好 2 项。

## Task 3: 接入统一 SQL 生成流程

**Files:**

- Create: `/Users/tal/Desktop/tog/tools/regenerate_yuwen_word_questions.js`
- Modify: `/Users/tal/Desktop/tog/tools/replace_high_word_content.js`
- Modify: `/Users/tal/Desktop/tog/tools/merge_yuwen_word_content.js`
- Modify: `/Users/tal/Desktop/tog/sql/edu_chn_word_question.sql`

- [ ] **Step 1: 实现统一词义 SQL 读取器**

复用现有 SQL tuple 解析方式，读取 `edu_chn_word_sense.sql` 的 10 个字段，转换为：

```js
{
  id: Number(row[0]),
  wordClass: Number(row[1]),
  word: row[2],
  meaning: row[4],
  example: row[5],
  source: row[6],
}
```

只把 `example !== null` 的词义送入题目生成；空例句继续保持无题目。

- [ ] **Step 2: 写出统一题目 SQL**

使用现有表结构和字段顺序：

```sql
INSERT INTO `edu_chn_word_question`
(`id`, `sense_id`, `question_type`, `stem`, `options_json`, `status`, `is_del`)
VALUES (...)
ON DUPLICATE KEY UPDATE
`sense_id` = VALUES(`sense_id`),
`question_type` = VALUES(`question_type`),
`stem` = VALUES(`stem`),
`options_json` = VALUES(`options_json`),
`status` = VALUES(`status`),
`is_del` = VALUES(`is_del`);
```

题目 ID 按词义 ID 升序、题型一后题型二顺序生成，保证同一份输入可重复得到相同 ID。题型一 stem 使用原文去除 `<b>` 标记后的内容；题型二 stem 保持现有辨析题干。

- [ ] **Step 3: 让合并入口调用统一题目生成器**

在 `replace_high_word_content.js` 和 `merge_yuwen_word_content.js` 生成统一 `edu_chn_word_sense.sql` 后调用：

```js
const { regenerateQuestions } = require('./regenerate_yuwen_word_questions');
regenerateQuestions();
```

删除两个入口中旧的 `REAL_WRONGS`、`VIRTUAL_WRONGS`、`compareFallback` 和旧题目拼装逻辑，避免再次生成随机/伪例句题目。初中拆分 SQL 即使作为中间产物，也只用于词义生成，最终题目统一由新脚本产出。

- [ ] **Step 4: 重新生成并检查统一 SQL**

执行：

```bash
node tools/generate_junior_word_content.js
node tools/replace_high_word_content.js
node tools/regenerate_yuwen_word_questions.js
node tools/update_yuwen_word_preview.js
node tools/check_word_questions.js
```

预期：统一词义仍为 500 条；题目数量等于有原文例句词义数乘 2；所有题型一为 4 项、题型二为 2 项，首项正确。

## Task 4: 更新预览页的“暂无例句”展示

**Files:**

- Modify: `/Users/tal/Desktop/tog/tools/update_yuwen_word_preview.js`
- Modify: `/Users/tal/Desktop/tog/tools/generate_yuwen_word_content.js`
- Modify: `/Users/tal/Desktop/tog/demo/yuwen/accumulation/word-student-preview.html`

- [ ] **Step 1: 增加不可用选项 CSS**

加入：

```css
.option.option-unavailable {
  background: #fff1f1;
  color: #d84a4a;
  border: 1px solid #f3b5b5;
}
```

- [ ] **Step 2: 让题目选项渲染根据内容添加标记**

将 `optionMarkup` 的每个选项渲染为：

```js
const unavailable = String(item) === '暂无例句';
return '<div class="option' + (unavailable ? ' option-unavailable' : '') + '" data-label="' + label + '">' + content + '</div>';
```

仍然使用 `correct` 字段保存答案位置，预览页只用红色表达“内容待补充”，不把正确答案直接渲染成绿色。

- [ ] **Step 3: 重新生成预览并检查交互**

验证：

- 打开 `word-student-preview.html`。
- 筛选包含“望”的篇目，点击例句后的“查看题目”。
- 题型一显示 4 个释义，题型二显示 2 个真实例句或“暂无例句”。
- 所有“暂无例句”均为红色背景/红色文字。
- 复制按钮仍能复制 `sense_id`、两个 `question_id`、原词、释义、篇目、原文和译文。

## Task 5: 完整回归校验与提交

**Files:**

- Modify: `/Users/tal/Desktop/tog/sql/edu_chn_word_question.sql`
- Modify: `/Users/tal/Desktop/tog/demo/yuwen/accumulation/word-student-preview.html`
- Create/Modify: `/Users/tal/Desktop/tog/tools/check_word_questions.js`

- [ ] **Step 1: 运行全部校验**

```bash
node tools/check_word_examples.js
node tools/check_word_questions.js
node --check tools/word_question_options.js
node --check tools/regenerate_yuwen_word_questions.js
node --check tools/update_yuwen_word_preview.js
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('demo/yuwen/accumulation/word-student-preview.html', 'utf8');
for (const match of html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)) new Function(match[1]);
console.log('preview scripts ok');
NODE
git diff --check
```

预期所有命令退出码为 0，输出 `preview scripts ok`，且报告中不出现题目结构错误。

- [ ] **Step 2: 删除中间初中拆分 SQL**

确认统一 SQL 已生成且 `regenerate_yuwen_word_questions.js` 可独立运行后，删除：

```text
/Users/tal/Desktop/tog/sql/edu_chn_junior_word_sense.sql
/Users/tal/Desktop/tog/sql/edu_chn_junior_word_question.sql
/Users/tal/Desktop/tog/sql/edu_chn_junior_word_catalog.sql
```

- [ ] **Step 3: 提交实现**

```bash
git add tools/yuwen_word_external_examples.js \
  tools/word_question_options.js \
  tools/regenerate_yuwen_word_questions.js \
  tools/check_word_questions.js \
  tools/replace_high_word_content.js \
  tools/merge_yuwen_word_content.js \
  tools/update_yuwen_word_preview.js \
  tools/generate_yuwen_word_content.js \
  sql/edu_chn_word_question.sql \
  demo/yuwen/accumulation/word-student-preview.html
git commit -m "feat: improve Chinese word question options"
```
