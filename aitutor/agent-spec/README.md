# agent-spec — AI 学伴模型规格契约仓库

> 给模型看的、可执行的、可回归的产品规格。
> 不是 PRD（PRD 在 `../design-doc-v3-AI学伴.md`），本仓库是 PRD 落到模型层的那一半。

## 这是什么

Agent 产品的规格分两层：
- **PRD 层**（`design-doc-v3-AI学伴.md`）：人读，讲产品意图、场景、业务指标
- **模型规格层**（本仓库）：模型读 + 研发执行，讲工具 schema、prompt、边界规则、本体、评估集

两层必须**双向引用、同步变更**。PRD 改 → 本仓库改 → 触发评估回归。

## 为什么单独建仓库

本体论评审的核心结论：v3 的后台能力层"是意向书不是设计规格"。把工具 schema、prompt、边界规则散在 PRD 叙述里，研发实现时各自为战、PM 无法验收、回归无基线。集中到一个可版本化、可 CI 回归的仓库，是"规格共写"能落地的前提。

## 目录结构

```
agent-spec/
├── README.md                    # 本文件
├── ontology/                    # 教育本体（共享数据层，最高优先级）
│   ├── knowledge-point.schema.json   # 知识点对象定义
│   └── student-kp-state.schema.json  # 学生知识点状态
├── tools/                       # 工具/技能 schema（给模型看的接口）
│   ├── knowledge_search.yaml
│   ├── problem_generator.yaml
│   ├── answer_checker.yaml
│   ├── progress_query.yaml
│   ├── recommend_resource.yaml
│   ├── handoff_human.yaml
│   ├── diagnose_brain.yaml      # v3 诊断大脑（封装为工具）
│   ├── strategy_brain.yaml      # v3 策略大脑（ROI + 三档）
│   └── track_brain.yaml         # v3 追踪大脑（进度 + 预警）
├── prompts/                     # 系统提示 + 场景 prompt
│   ├── system.md
│   ├── scene-s1-post-exam.md
│   ├── scene-s2-homework.md
│   ├── scene-s3-evening-study.md
│   └── heuristics-layered-hint.md   # 启发式 5 轮降级
├── boundaries/                  # 边界规则
│   ├── safety-governance.md       # 三层安全治理
│   ├── topic-whitelist.yaml       # 锚定 kp_id 的白名单
│   ├── termination-rules.yaml     # 终止/收敛/防沉迷
│   └── fallback-rules.md          # 异常兜底 + 黄橙红预警
├── memory/                      # 记忆规格
│   ├── short-term-window.md       # 短期滑窗
│   └── student-profile.schema.json # 学生画像（理性字段，本体属性级）
├── eval/                        # 评估集
│   ├── cases/
│   │   ├── success/              # 成功路径 case
│   │   ├── reject/               # 该拒绝 case
│   │   └── edge/                 # 边缘 case
│   ├── metrics.yaml              # 指标定义（业务 + 技术双层）
│   ├── run.sh                    # 评测脚本（研发维护）
│   └── bad-cases.md              # bad case 库 + 归层标注
├── CHANGELOG.md                 # 规格变更日志
└── .github/workflows/
    └── eval-regression.yml      # 改动触发全量回归
```

## 谁维护什么（2 PM + 3 研发）

| 模块 | 主笔 | 评审 | 说明 |
|---|---|---|---|
| `ontology/` | PM-A + 教研 | 研发 + 教研 | 本体是地基，PM 定字段语义、教研定内容、研发定可行性 |
| `tools/*.yaml` 描述/何时用 | PM-A | 研发 | "描述"字段直接进模型上下文，PM 主笔 |
| `tools/*.yaml` 参数 schema | 研发 | PM-A | 参数类型/约束研发定，语义 PM 定 |
| `prompts/` | PM-A + 研发 | PM-B | 共写，PM-B 守体验 |
| `boundaries/safety-governance` | PM-A | 研发 + 合规 | 三层安全是产品 + 合规决策 |
| `boundaries/topic-whitelist` | PM-A + 教研 | 研发 | 白名单锚定 kp_id，内容教研定 |
| `boundaries/termination-rules` | PM-A | 研发 | 阈值是成本×体验决策，PM 拍板 |
| `memory/` | PM-A + 研发 | — | 短期窗 PM 定留存轮数，长期记忆研发定检索 |
| `eval/cases/*` | PM-B | PM-A + 研发 | 评估集 PM-B 主建，研发不可单方改预期 |
| `eval/metrics.yaml` | PM-B | 研发 | 业务指标 PM-B，技术指标研发 |
| `eval/run.sh` + CI | 研发 | PM-B | 自动化研发实现，PM-B 验收 |
| `CHANGELOG.md` | 改动人自己写 | 对方 | 谁改谁记，强制 |

## 变更流程（强制）

1. **提 PR**：任何规格改动走 PR，PR 描述"改了什么规格 + 预期影响哪些 case"
2. **CI 触发回归**：`.github/workflows/eval-regression.yml` 自动跑全量 `eval/cases/`，对比指标变化
3. **指标对比**：PR 必须附评估对比（改动前 vs 改动后），指标退化需 PM-B 签字
4. **bad case 归层**：回归失败的 case 进 `eval/bad-cases.md`，标注归属层（规格/实现），由对应负责人认领
5. **合并即生效**：合并后 CHANGELOG 自动追加，PRD 侧同步引用更新

## 反模式（禁止）

- 研发为修某个 case 私自改 `prompts/` 或 `tools/*.yaml` 描述 → 必须走 PR + 回归
- PM 改了 PRD 但不同步本仓库 → 规格与意图脱节
- 评估集被研发单方"修预期"让 case 通过 → 自欺欺人，破坏基线
- 本体字段由研发拍定 → 字段语义是产品决策，必须 PM + 教研定

## 与 PRD 的引用关系

- PRD 章节 → 本仓库路径：在 PRD 每节末尾标注 `规格见 agent-spec/<path>`
- 本仓库文件 → PRD 依据：每个文件头标注 `依据：design-doc-v3-AI学伴.md §X`
- 双向引用保证改一边能找到另一边
