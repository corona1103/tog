# 语文积累本学习记录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在现有语文积累本静态 Demo 中实现“我的学习记录”二级页面、练习详情回看、背诵/词卡跳转，并同步最新背诵完成交互。

**Architecture:** 继续使用现有单文件 SPA，在 `state` 中增加统一 `learningRecords` 日志；新增 `learningRecords` 屏幕和记录详情展开状态。所有真实完成动作通过小型 `appendLearningRecord` 入口写日志，示例数据作为初始化日志，渲染层只负责筛选、分组和展示。

**Tech Stack:** 原生 HTML、CSS、JavaScript；现有 `setState` + `render` 路由模式；验证使用 Node 语法检查和浏览器手工流程。

---

## 文件边界

- 修改：`/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html`
  - 新增学习记录数据、日志写入、时间分组和记录页渲染。
  - 复用现有篇目详情、词卡和题目数据，不新增独立页面。
  - 修改背诵完成页按钮和日志写入时机。
- 已完成：`/Users/tal/Desktop/tog/docs/superpowers/specs/2026-09-10-yuwen-learning-records-design.md`
  - 作为实现口径，不再重复扩展需求范围。

## Task 1: 建立统一学习日志和示例数据

**Files:**
- Modify: `/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html`，`state`、工具函数区域

- [ ] **Step 1: 扩展状态结构**

在 `state` 中增加以下字段，保留现有字段不变：

```js
learningRecords: createSeedLearningRecords(),
recordFilter: "all",
expandedRecordId: null
```

`learningRecords` 每条记录统一使用：

```js
{
  id, date, time,
  category: "poem" | "word",
  type: "recite" | "direct" | "comprehension" | "random" | "wordCard",
  title, poemId, wordKey,
  questions: [],
  status, rate
}
```

- [ ] **Step 2: 增加预置数据工厂**

新增 `createSeedLearningRecords()`，返回至少以下记录：

```js
[
  {id:"seed-recite",date:"2026-09-10",time:"19:20",category:"poem",type:"recite",title:"《观沧海》",poemId:"guancang",status:"completed"},
  {id:"seed-comp",date:"2026-09-10",time:"19:24",category:"poem",type:"comprehension",title:"观沧海 理解性默写 5题",poemId:"guancang",questions:seedQuestions("理解性默写"),status:"completed",rate:80},
  {id:"seed-direct",date:"2026-09-09",time:"17:20",category:"poem",type:"direct",title:"观沧海 直接默写 5题",poemId:"guancang",questions:seedQuestions("直接默写"),status:"completed",rate:100},
  {id:"seed-random",date:"2026-09-09",time:"18:06",category:"poem",type:"random",title:"随机抽查 5题",poemId:"guancang",questions:seedQuestions("随机抽查"),status:"completed",rate:60},
  {id:"seed-word-fu",date:"2026-09-09",time:"17:42",category:"word",type:"wordCard",title:"“负”",wordKey:"负-实词",status:"learned"},
  {id:"seed-word-group",date:"2026-09-08",time:"16:15",category:"word",type:"wordCard",title:"“临”“顾”“亡”",wordKey:"亡-实词",status:"learned"}
]
```

`seedQuestions(type)` 生成 5 个带 `question`、`userAnswer`、`correctAnswer`、`correct` 的静态明细；随机抽查的题目需额外带 `poemTitle`，详情能显示实际篇目。

- [ ] **Step 3: 增加日志工具函数**

实现以下接口，后续任务只调用这些接口写日志：

```js
function appendLearningRecord(record) {
  const id = record.id || "record-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  state.learningRecords.unshift({...record, id});
}
function recordNow() {
  const now = new Date();
  return {date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 5)};
}
function recordQuestions(type, poem, questions, rate) {
  const now = recordNow();
  appendLearningRecord({
    ...now, category: "poem", type, poemId: poem.id,
    title: type === "random" ? "随机抽查 " + questions.length + "题" : poem.title.replace(/[《》]/g, "") + " " + ({direct:"直接默写",comprehension:"理解性默写"}[type]) + " " + questions.length + "题",
    questions, status: "completed", rate
  });
}
```

- [ ] **Step 4: Run syntax check**

Run: `node --check demo/yuwen/accumulation/index.html` is not valid for HTML, so extract the script before checking:

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('demo/yuwen/accumulation/index.html','utf8');const js=s.match(/<script>([\\s\\S]*)<\\/script>/)[1];new Function(js);console.log('syntax ok')"
```

Expected: `syntax ok`.

## Task 2: 增加学习记录页面样式、路由和时间线渲染

**Files:**
- Modify: `/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html`，CSS、`render` 和新渲染函数区域

- [ ] **Step 1: 增加记录页 CSS**

增加 `.records-shell`、`.records-toolbar`、`.record-day`、`.record-row`、`.record-icon`、`.record-detail`、`.record-question` 和空状态样式，沿用现有 CSS 变量、卡片圆角和按钮体系。单行记录必须保持图例、标题、学习时间、一个操作按钮四段布局，窄屏改为两行。

- [ ] **Step 2: 增加筛选与分组函数**

```js
function filteredLearningRecords() {
  return state.learningRecords
    .filter(record => state.recordFilter === "all" || record.category === state.recordFilter)
    .slice()
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}
function groupLearningRecords(records) {
  return records.reduce((groups, record) => {
    (groups[record.date] ||= []).push(record);
    return groups;
  }, {});
}
```

- [ ] **Step 3: 实现记录行和详情渲染**

新增 `recordIcon(record)`、`recordAction(record)`、`renderRecordDetail(record)`、`renderLearningRecords()`。`renderRecordDetail` 对题目类记录逐题输出题干、学生作答、正确答案和 `✓ / ✕`，不输出“需要订正”和解析；空答案显示“未作答”。背诵记录不展开题目，词卡记录不展开题目。

记录行按钮数据属性固定为：

```html
<button data-action="record-action" data-record-id="...">查看详情</button>
```

背诵使用“查看篇目”，词卡使用“查看词卡”。

- [ ] **Step 4: 接入 render 路由和首页入口**

把 `state.screen === "learningRecords" ? renderLearningRecords() : ...` 加入 `render()`；将现有：

```js
if(a==="my-learning"||a==="view-my-record")return toast("学习进度 Demo 将在后续版本展开");
```

替换为：

```js
if (a === "my-learning" || a === "view-my-record") {
  clearReciteCountdown();
  clearDirectPerfectCountdown();
  return setState({screen: "learningRecords", module: null, expandedRecordId: null});
}
```

- [ ] **Step 5: 增加记录页事件**

在 `bindEvents()` 绑定 `[data-record-filter]`，切换时更新 `recordFilter` 并清空 `expandedRecordId`；在 `handleAction()` 增加：

```js
if (a === "record-action") return handleRecordAction(el.dataset.recordId);
if (a === "records-home") return goHome();
```

`handleRecordAction(id)` 行为：

```js
const record = state.learningRecords.find(item => item.id === id);
if (!record) return toast("学习记录不存在");
if (record.type === "recite") return openPoemDetail(record.poemId);
if (record.type === "wordCard") {
  const index = wordPool().findIndex(word => wordKey(word) === record.wordKey);
  if (index < 0) return toast("词卡内容暂不可用");
  return setState({screen:"wordHome", module:"words", wordIndex:index, wordView:"cards", wordFace:"front"});
}
return setState({expandedRecordId: state.expandedRecordId === id ? null : id});
```

- [ ] **Step 6: 验证记录页静态交互**

在浏览器打开 `demo/yuwen/accumulation/index.html`，点击首页“我的学习记录”，验证：页面能进入、日期倒序、全部/古诗文/实虚词筛选、单条详情展开收起、背诵“查看篇目”、词卡“查看词卡”均可用。

## Task 3: 接入古诗文实际学习日志

**Files:**
- Modify: `/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html`，`submitDirect`、`submitComp`、随机抽查启动逻辑

- [ ] **Step 1: 在直接默写提交时保存一条合并记录**

`submitDirect()` 在计算 `rate` 后，将每个句子的目标空、用户答案和正确值组装成 `questions`，调用：

```js
recordQuestions("direct", p, questions, rate);
```

`questions.length` 为本次全部题目数；保留原有 `directStats` 更新。重复点击提交在 `state.directResult` 已为真时直接返回，确保同一批次不重复写入。

- [ ] **Step 2: 在理解性默写最后一题提交时保存整组记录**

`submitComp()` 每题继续更新现有 `compStats` 和 `compResults`。当本次 `state.compResults` 在写入当前结果后已包含 `state.compRound.length` 条结果时，收集 `state.compRound` 的全部题目和结果，调用：

```js
recordQuestions("comprehension", p, questions, Math.round(questions.filter(q => q.correct).length / questions.length * 100));
```

题目对象中的 `userAnswer` 来自 `state.compAnswers[position]`，`correctAnswer` 来自题目答案，`correct` 来自当前结果。若题目未提交，不提前生成练习记录。

- [ ] **Step 3: 为随机抽查保留类型标记**

随机抽查进入理解练习时设置 `compSessionType: "random"`，普通理解练习设置 `compSessionType: "comprehension"`。`submitComp()` 读取该字段决定 `recordQuestions` 的类型；随机记录的每个 question 附加 `poemTitle: p.title`。

- [ ] **Step 4: 验证古诗文日志**

分别完成一次上下句直接默写、5 题理解性默写和随机抽查；确认时间线各出现一条合并记录，记录标题分别为“篇名 直接默写 N题”“篇名 理解性默写 N题”“随机抽查 N题”，详情中有全部题目及学生答案/正确答案/对错。

## Task 4: 接入背诵完成和实虚词学习日志

**Files:**
- Modify: `/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html`，`recordReciteCompletion`、`renderUnderstand`、背诵 action、词卡 action、词汇练习完成逻辑

- [ ] **Step 1: 调整背诵完成页文案和按钮**

完成全文后渲染当前页面内两个按钮：

```html
<button data-action="restart-recite">重新背</button>
<button data-action="go-direct-after-recite">去默写 3s</button>
```

`go-direct-after-recite` 按钮文案由 `state.reciteCountdown` 渲染为 `去默写 3s`、`去默写 2s`、`去默写 1s`；默认启动 3 秒倒计时。重新背不写新日志，且把句子进度归零。

- [ ] **Step 2: 只在全文完成时写入背诵日志**

在 `recordReciteCompletion(p)` 完成现有累计统计后调用 `appendLearningRecord({...recordNow(), category:"poem", type:"recite", title:p.title, poemId:p.id, status:"completed"})`。退出背诵路径不调用该函数；再次进入从头开始，符合现有状态重置规则。

- [ ] **Step 3: 记录词卡学会动作**

在 `mark-learned` 中仅当该词之前未学会时追加：

```js
appendLearningRecord({...recordNow(), category:"word", type:"wordCard", title:"“" + currentWord().word + "”", wordKey:wordKey(currentWord()), status:"learned"});
```

重复点击“已学会”只提示，不新增重复记录。

- [ ] **Step 4: 记录词汇练习完成批次**

在 `finishWordPractice()` 中先保存本轮词目列表，再将词目标记为学会；每个词追加一条 `wordCard` 记录，避免只展示预置数据。练习中途退出不调用 `finishWordPractice()`。

- [ ] **Step 5: 回归背诵和词卡流程**

验证最后一句完成后当前页按钮仍在原位置、3 秒倒计时自动进入直接默写；点击重新背从头开始；中途退出再次进入从头开始；词卡标记学会后学习记录出现对应词语，重复点击不重复。

## Task 5: 统一导航清理、验证和提交

**Files:**
- Modify: `/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html`

- [ ] **Step 1: 清理离开页面时的定时器和状态**

从学习记录页回到首页、篇目详情或词卡时调用 `clearReciteCountdown()`、`clearDirectPerfectCountdown()`，防止倒计时在后台改变路由；`goHome()` 保留 `learningRecords` 数据。

- [ ] **Step 2: 运行静态检查**

Run:

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('demo/yuwen/accumulation/index.html','utf8');const js=s.match(/<script>([\\s\\S]*)<\\/script>/)[1];new Function(js);console.log('syntax ok')"
```

Expected: `syntax ok`.

- [ ] **Step 3: 运行关键字回归检查**

Run:

```bash
rg -n "learningRecords|renderLearningRecords|recordQuestions|查看详情|随机抽查|重新背|去默写" demo/yuwen/accumulation/index.html
```

Expected: 能找到状态、渲染、日志写入和最新背诵文案；不能再找到“学习进度 Demo 将在后续版本展开”。

- [ ] **Step 4: 浏览器手工验收**

覆盖以下流程：

1. 首页入口 → 学习记录页 → 筛选 → 查看详情展开/收起 → 返回首页。
2. 背诵全文 → 当前页显示“重新背 / 去默写 3s” → 自动进入直接默写。
3. 直接默写提交 → 记录合并为一条，详情题目完整。
4. 理解性默写完成 5 题 → 只产生一条 5 题记录。
5. 随机抽查完成 → 只产生一条“随机抽查 5题”记录，详情保留实际篇目。
6. 词卡标记学会/词汇练习完成 → 按天出现词语记录，并能进入词卡。

- [ ] **Step 5: 提交实现**

```bash
git add demo/yuwen/accumulation/index.html
git commit -m "feat: add yuwen learning records demo"
```

## 计划自检

- 设计文档中的页面结构、筛选、时间分组、三类做题合并、详情回看、背诵/词卡跳转、预置数据和异常规则均在 Task 1-5 覆盖。
- 直接默写、理解默写、随机抽查均通过同一 `recordQuestions` 接口写入，避免三套日志格式。
- 未完成流程不会调用完成日志接口；同批次题目只在提交完成后写入一次。
- 未使用 TODO、TBD 或未定义的文件名；所有实现均限定在现有 Demo 文件。
