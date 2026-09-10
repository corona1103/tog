# 家长端学习反馈小程序 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 制作一个可交互的家长端微信小程序 MVP 原型，验证家长绑定孩子、查看学习数据、理解周报和感知自学/AI 能力价值的完整体验。

**Architecture:** 保持教师端与家长端两个小程序的产品边界，Demo 使用独立静态 HTML 模拟家长端。页面通过单文件内的状态模型切换首页、学习详情、周报和绑定流程；数据使用与现有 toG 学情口径一致的本地固定样例，不连接真实后台。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、内联 SVG/Emoji 图标；使用现有 `demo/` 静态 Demo 目录，不引入第三方依赖。

---

### Task 1: 固化 MVP PRD 与 Demo 范围

**Files:**
- Create: `docs/superpowers/specs/2026-09-10-parent-learning-mini-program-mvp-prd.md`
- Create: `docs/superpowers/plans/2026-09-10-parent-learning-mini-program-mvp.md`

- [x] **Step 1: 记录产品定位和边界**

  将家长端定位为学习反馈层；明确教师通知、支付、Token 计费、排名、家长回复不进入 MVP。

- [x] **Step 2: 记录数据口径**

  明确老师任务、自学、AI 学习、趋势和周报的数据来源、呈现深度、个人环比规则及 20 分钟同步约束。

- [x] **Step 3: 记录验收指标和 Demo 验证范围**

  将绑定、首页概览、学习详情、周报和自学/AI 外化列为本次交互原型的主链路。

### Task 2: 创建家长端 Demo 页面骨架与视觉系统

**Files:**
- Create: `demo/parent/index.html`

- [x] **Step 1: 创建移动端容器和基础页面结构**

  创建 390px 宽度优先的家长端模拟器，包含状态栏、页面标题、内容滚动区和底部四项导航：`首页`、`学习`、`周报`、`我的`。

- [x] **Step 2: 添加视觉变量和响应式规则**

  使用温和的蓝绿色作为品牌色，采用白色卡片、浅灰背景、圆角和中性状态标签；窄屏宽度下保持内容可滚动，桌面宽度下居中显示手机容器。

- [x] **Step 3: 添加无障碍和可点击状态**

  为按钮提供文字标签、可见焦点和 `aria-label`；所有页面跳转通过原生按钮和 JavaScript 状态完成，避免依赖不可用的外链。

### Task 3: 实现登录绑定与首页学习概览

**Files:**
- Modify: `demo/parent/index.html`

- [x] **Step 1: 添加绑定引导状态**

  默认展示已绑定的“林知夏 / 高一（2）班”样例；从“我的”点击“重新绑定”打开绑定抽屉，输入绑定码 `AIX-2026` 后显示成功 Toast，输入其他内容显示错误提示。

- [x] **Step 2: 添加首页概览卡片**

  展示“学习概览”，支持本周、本月、本学期快捷切换；展示老师任务完成数、提交率、正确率、自学题目、视频时长、背词数量和 AI 任务完成量，并展示个人周期变化，不展示班级数据。

- [x] **Step 3: 添加首页入口交互**

  将“上周学习周报已生成”置于首页顶部；首页提供学习趋势和学习成果入口，点击可进入学习页或打开方法详情；点击提醒授权按钮显示“已开启周报提醒”的模拟状态。

### Task 4: 实现学习数据查询和详情

**Files:**
- Modify: `demo/parent/index.html`

- [x] **Step 1: 实现本学期默认视图**

  学习页默认展示本学期详细学习数据，不提供页面级时间切换；数据仍使用本地样例，保持口径一致。

- [x] **Step 2: 实现老师任务学科汇总**

  按学科展示作业和靶向任务的任务数量、已提交数量、提交率和正确率，不在学习页展示单任务详细列表。

- [x] **Step 3: 收敛任务详情范围**

  移除学习页单任务详情抽屉，保留 PRD 中按学科汇总的数据口径，避免家长端重复教师端任务明细。

- [x] **Step 4: 实现自学与 AI 摘要**

  展示课程、视频、背词、AI 任务、知识点覆盖和练习题量；点击 AI Tutor 卡片打开“本周规划摘要”抽屉，只展示可靠的任务完成和知识点信息，不展示完整对话。

- [x] **Step 5: 实现趋势图与学科筛选**

  使用 CSS 柱形图展示近 4 周个人答题趋势；答题数包含老师任务和自学练习，支持全科/单学科筛选，不出现班级平均或排名。

- [x] **Step 6: 实现学习成果与知识图谱**

  展示“错题周周清”“薄弱点打透”“单词周周升”三个学习成果模块，并展示数理化生四个学科的知识点点亮数量；点击方法或学科打开详情抽屉。

### Task 5: 实现周报和个人设置页

**Files:**
- Modify: `demo/parent/index.html`

- [x] **Step 1: 实现周报页**

  展示统计周期、生成时间、数据更新时间、一句话概览、老师任务、自学、AI 学习、亮点和可关注项。

- [x] **Step 2: 添加周报数据说明**

  在周报底部展示“数据来自学生平板和老师任务记录，最多延迟约 20 分钟”的说明，体现统一数据快照和数据边界。

- [x] **Step 3: 实现我的页**

  展示家长绑定信息、孩子信息、周报提醒授权状态、数据说明和隐私说明入口；隐私说明以轻量弹窗展示。

### Task 6: 接入现有 Demo 入口并验证

**Files:**
- Modify: `demo/index.html`

- [x] **Step 1: 增加家长端入口**

  在现有首页新增“家长端”模块，链接到 `parent/index.html`，描述为“学习反馈、周报与自学/AI 内容外化”。

- [x] **Step 2: 做静态语法检查**

  读取 HTML 中的内嵌 JavaScript 并用 `new Function` 编译检查；同时扫描 PRD、计划和 Demo，确认没有未完成标记或空白需求。检查结果：通过。

- [x] **Step 3: 做浏览器交互检查**

  浏览器自动化服务未能启动，因此使用脚本级内容覆盖、交互处理函数和 HTML HTTP 预览配置检查替代；首页入口、底部导航、周/学期切换、任务详情抽屉、AI 摘要抽屉、绑定成功/失败、周报提醒状态和隐私弹窗均已实现。

- [x] **Step 4: 提交本次独立变更**

  运行 `git add docs/superpowers/specs/2026-09-10-parent-learning-mini-program-mvp-prd.md docs/superpowers/plans/2026-09-10-parent-learning-mini-program-mvp.md demo/parent/index.html demo/index.html && git commit -m "feat: add parent learning feedback mvp demo"`。
