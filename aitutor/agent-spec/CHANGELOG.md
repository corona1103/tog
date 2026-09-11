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
