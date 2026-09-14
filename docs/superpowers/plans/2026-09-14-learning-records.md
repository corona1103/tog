# 学习记录模块化与随机抽查 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有单页 Demo 中实现按模块查看、按日期和篇目聚合的学习记录，并将随机抽查改为跨篇目独立的 5 题练习流程。

**Architecture:** 保留 `state.learningRecords` 中的原始行为记录，在渲染学习记录页时根据当前模块生成展示聚合项。古诗文普通行为按日期、篇目和类型聚合，随机抽查保持每轮独立；新增独立 `randomPractice` 屏幕和状态，不复用单篇目理解性默写状态。

**Tech Stack:** 单文件 HTML、原生 JavaScript、现有 CSS 和事件绑定机制。

---

### Task 1: 更新学习记录聚合与模块页签

**Files:**
- Modify: `/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html`

- [ ] 将默认 `recordFilter` 改为 `poem`，进入学习记录时也明确设置为 `poem`。
- [ ] 增加 `recordTimestamp`、`aggregatePoemLearningRecords` 和 `visibleLearningRecords`，按日期 + 篇目 + 类型聚合背诵、直接默写、理解性默写；随机抽查保持单轮独立。
- [ ] 聚合项保留 `sourceRecords` 和 `rounds`，以支持默写每轮结果和练习全部题目详情。
- [ ] 将记录页筛选替换为“古诗文 / 实虚词”两个页签，删除“全部”，记录行删除具体时分展示。
- [ ] 更新标题、图例和按钮：背诵显示“背n次”并使用“查看原文”，直接默写显示“直接默写n次”，理解性默写显示总题数，练习和随机抽查使用“查看详情”。
- [ ] 更新详情渲染：默写按轮次展示所有题目结果，练习和随机抽查展示所有题目、来源篇目、作答、正误和正确答案。

### Task 2: 增加跨篇目随机抽查流程

**Files:**
- Modify: `/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html`

- [ ] 增加 `randomPractice` 独立状态字段和 `startRandomRound`，从多个篇目的理解性默写题库中随机抽取 5 题。
- [ ] 增加 `renderRandomPractice`，逐题展示来源篇目和作者，不依赖当前选中的篇目详情页。
- [ ] 增加随机抽查独立的题目导航、作答、提交、下一题、再抽一轮事件处理。
- [ ] 提交完成时生成 `random` 原始记录，记录本轮全部题目和来源；不写入单篇目 `comprehension` 记录。

### Task 3: 验证

**Files:**
- Test: `/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html` in browser

- [ ] 检查“我的学习记录”默认进入古诗文页签且无“全部”。
- [ ] 检查同一天同篇目背诵合并为“背n次”，同篇目直接默写合并为“直接默写n次”，理解性默写合并题数。
- [ ] 检查记录行不显示具体时分，日期分组仍能正确排序。
- [ ] 检查默写详情按轮次保留正误和正确答案，练习详情保留重复题目。
- [ ] 检查点击随机抽查进入独立 5 题页，每道题显示来源篇目，完成后记录为单独一轮。
