# 规格变更日志

> 格式：`[日期] [模块] [改动人] — 改动 + 预期影响 case + 评估对比`
> 谁改谁写，强制。合并即追加。

## 模板

```
## YYYY-MM-DD  <模块路径>
- 改动人：<PM-A/PM-B/研发-1/研发-2>
- 改动：<具体改了什么>
- 原因：<为什么改，关联 PRD 节或 bad case id>
- 预期影响 case：<eval/cases/ 下哪些 case 行为可能变>
- 评估对比：<改动前 vs 后，关键指标变化>
- 评审：<对方签字>
```

## 2026-08-04  初始建仓

- 改动人：PM-A（基于 Claude Code 协作产出）
- 改动：建立 agent-spec 仓库骨架，落地本体论评审 5 项修正为 `ontology/` 首批内容
- 原因：design-doc-v3 后台能力层被评审为"意向书不是设计规格"，需可执行规格
- 预期影响 case：全部（基线建立）
- 评估对比：尚无基线，灰度期 8 月底建立
- 评审：待 PM-B + 研发 review

## 待办（建仓后第一批需补）

- [ ] ontology/ 内容由教研填充真实知识点（数学/化学先行，7/15 前）
- [ ] tools/ 补全其余 8 个工具 schema（当前仅 knowledge_search 样板）
- [ ] prompts/ 补全 4 个场景 prompt（当前仅 system.md 样板）
- [ ] boundaries/safety-governance.md 与 topic-whitelist.yaml 落地（8/1 前）
- [ ] eval/cases/ 从 12 条扩到 ≥ 50 条初版（PM-B 主建）
- [ ] eval/run.sh 评测脚本（研发-2 实现）
- [ ] .github/workflows/eval-regression.yml 接通 CI

## 2026-09-15  MCP 与对话 Prompt 初版整理

- 改动人：PM + Codex 协作
- 改动：新增 4 个一期可用 MCP 规格文档和独立的 `dialogue-agent-system-v1.md`；明确暂不调用 `queryStudentKnowledgeAccuracy` 和考试报告 MCP。
- 原因：根据 `291-学生AItutor助教.md` 及接口返回示例，将可用工具能力落成可执行的模型规格。
- 预期影响 case：后续所有学生主动对话、学情查询、学习规划和作业统计 case。
- 评估对比：尚无自动化基线，需补充工具调用和对话回归 case 后评估。
- 评审：待 PM、研发和教研 review

## 2026-09-15  对话 Prompt 精简版

- 改动人：PM + Codex 协作
- 改动：新增 `prompts/dialogue-agent-system-v2-compact.md`，将字段级规则保留在 MCP 文档中，系统 Prompt 只保留核心身份、路由、边界、教学和安全规则。
- 原因：降低每轮系统上下文 token 和对话成本。
- 预期影响 case：全部学生主动对话 case；工具字段解析仍以 `tools/*.yaml` 为准。
- 评估对比：需与 v1 做工具调用准确率、安全拒答和回答质量回归。
- 评审：待 PM、研发和教研 review

## 2026-09-15  单文件 Prompt

- 改动人：PM + Codex 协作
- 改动：新增 `prompts/dialogue-agent-system-v3-single.md`，将 4 个可用 MCP 的调用规则、参数约束、返回字段和解读边界整合进同一个 Prompt 文件。
- 原因：开放 Agent 平台不支持加载外部工具规格文件，只能配置单个 Prompt。
- 预期影响 case：全部学生主动对话及 4 个学情 MCP 调用 case。
- 评估对比：需与 v2 精简版做工具调用准确率、安全拒答和回答质量回归。
- 评审：待 PM、研发和教研 review
