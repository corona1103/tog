# AI Tutor Agent Prompt 与 MCP 规格整理设计

## 目标

为 toG 项目的学生平板 AI Tutor“小思”建立可独立评审、可持续迭代的模型规格文档：将一期可用 MCP 分别描述，并基于这些能力形成独立的对话 Agent 系统 Prompt。

## 范围

本次纳入：

- `studentHomeworkStat`
- `getLastPlanReportDetail`
- `queryStudentProfileSummary`
- `queryStudentKnowledgeMastery`
- 对话 Agent 系统 Prompt

本次暂不纳入：

- `queryStudentKnowledgeAccuracy`：当前无法调用并返回结果。
- `queryStudentExamReport`：按当前一期范围排除。
- 具体任务列表查询：当前没有可用 MCP，Agent 不得假装支持。

## 文档边界

- MCP 文档负责描述调用场景、参数约束、返回结构、数据解读和失败处理。
- 系统 Prompt 负责身份、行为优先级、安全边界、意图路由、工具使用总则、教学方式和表达风格。
- 原有 `aitutor/agent-spec/prompts/system.md` 不覆盖，新的对话 Prompt 以独立文件形式保留，待评审后再决定是否替换。

## 关键决策

1. 学生身份由会话或请求头注入，Agent 不接受学生输入的身份替换。
2. 依赖个人学情的问题必须先调用对应 MCP；不为个性化而无意义调用工具。
3. 所有工具失败、空数据和字段缺失都必须显式兜底，禁止模型补写事实。
4. 规划、学情摘要和掌握度数据需要先说明统计周期或更新时间，再给解释和行动建议。
5. 没有任务列表 MCP 时，只能说明无法读取具体待办任务，并引导学生使用任务页面。
6. `queryStudentKnowledgeMastery` 仅支持数学、物理、化学、生物；没有分档规则时不自行定义掌握度阈值。

## 产出文件

- `aitutor/agent-spec/tools/studentHomeworkStat.yaml`
- `aitutor/agent-spec/tools/getLastPlanReportDetail.yaml`
- `aitutor/agent-spec/tools/queryStudentProfileSummary.yaml`
- `aitutor/agent-spec/tools/queryStudentKnowledgeMastery.yaml`
- `aitutor/agent-spec/prompts/dialogue-agent-system-v1.md`
- `aitutor/agent-spec/prompts/dialogue-agent-system-v2-compact.md`
- `aitutor/agent-spec/prompts/dialogue-agent-system-v3-single.md`

## 验收标准

- 每个 MCP 文档可以独立说明“什么时候调用、需要什么参数、如何理解返回结果、失败时怎么说”。
- 对话 Prompt 不调用当前不可用的正确率 MCP 和考试报告 MCP。
- 对话 Prompt 不把作业统计当成任务列表，不把掌握度当成正确率。
- 对话 Prompt 不要求学生提供 studentId、userId 或 orgId。
- 不向学生展示原始 JSON、工具名、参数、内部 ID 或错误堆栈。
- 单文件平台可以只加载 `dialogue-agent-system-v3-single.md` 完成系统 Prompt 配置，不依赖其他规格文件。
