# 语文自学“积累本”交互 Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.
>
> **Goal:** Build a fixed-landscape tablet demo that lets reviewers enter the Accumulation Book homepage and experience both the ancient-poetry memorization flow and the classical-Chinese real/virtual-word flow.
>
> **Architecture:** Use one self-contained HTML page with local mock data and a small client-side state machine. The page keeps a shared tablet shell and switches between home, module, detail, practice, and result states without a backend or route dependency. Add one navigation entry to the existing demo index.
>
> **Tech Stack:** HTML, CSS, vanilla JavaScript, local mock data; browser-based verification through the local demo server.

---

### Task 1: Create the fixed-landscape demo shell and homepage

**Files:**
- Create: \`/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html\`
- Modify: \`/Users/tal/Desktop/tog/demo/index.html\`

- [ ] **Step 1: Define the page state and shared navigation contract**

Use a single \`state\` object with these fields:

\`\`\`js
const state = {
  screen: "home",
  module: null,
  textbook: "部编版",
  volume: "八年级上册",
  chapter: "第三单元",
  selectedPoemId: null,
  poemTab: "understand",
  reciteSegment: 0,
  directMode: "pair",
  directQuestion: 0,
  directAnswer: "",
  comprehensionQuestion: 0,
  comprehensionAnswers: {},
  wordType: "实词",
  wordIndex: 0,
  wordFace: "front",
  wordPracticeIndex: 0,
  wordPracticeAnswers: {},
  wordDone: false
};
\`\`\`

Implement \`goHome()\`, \`openPoetry()\`, \`openWords()\`, and \`render()\` so every screen can return to the homepage without a full reload.

- [ ] **Step 2: Add the landscape shell CSS**

Build a centered tablet canvas with a 16:10 aspect ratio, dark outer background, light app surface, top status bar, left navigation rail, and scrollable content region. Use a minimum width suitable for a tablet landscape demo. Add a narrow-viewport overlay saying “请横屏使用”，without providing a portrait layout.

- [ ] **Step 3: Render the homepage**

The homepage must show:

- “积累本” title and student context;
- weekly learning summary;
- “古诗文背默” entry;
- “文言文实虚词” entry;
- light “我的学习” entry;
- recent learning card;
- a primary continue-learning action.

Each major module card must call \`openPoetry()\` or \`openWords()\` and visibly change the state.

- [ ] **Step 4: Add the homepage link to the existing demo index**

Insert a “语文自学·积累本” item under a new “学生平板” section in \`demo/index.html\`, linking to \`yuwen/accumulation/\`.

- [ ] **Step 5: Verify the homepage manually**

Run:

\`\`\`bash
python3 -m http.server 8000 --directory /Users/tal/Desktop/tog
\`\`\`

Open \`http://localhost:8000/demo/yuwen/accumulation/\` and verify the homepage loads, the two module cards respond, and a narrow viewport shows the landscape warning rather than a reflowed portrait page.

---

### Task 2: Implement the ancient-poetry module and understanding/recitation flow

**Files:**
- Modify: \`/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html\`

- [ ] **Step 1: Add local poetry mock data**

Define at least two poems with textbook metadata, author, dynasty, chapter, original text, translation, segments, direct-recall questions, and comprehension questions. Use recognizable but short samples so the interactions fit the tablet canvas.

- [ ] **Step 2: Render textbook and chapter selection**

Implement the poetry module screen with:

- textbook and volume selectors;
- chapter chips;
- poem cards;
- three completion-state indicators for understanding/recitation, direct dictation, and comprehension dictation;
- a back-to-home action.

Selecting a poem calls \`openPoemDetail(id)\` and defaults to the “理解与背诵” tab.

- [ ] **Step 3: Implement the understanding/recitation tab**

Implement:

\`\`\`js
function renderUnderstandingTab(poem) { /* original text, translation toggle, recitation state */ }
function startRecite() { /* hide current segment and show first-character prompt */ }
function revealSegment() { /* show current segment and switch action to continue */ }
function completeSegment() { /* mark segment complete and advance */ }
\`\`\`

The tab must support showing/hiding translation, starting recitation, revealing the current segment, continuing, marking a segment complete, and entering direct dictation after the final segment.

- [ ] **Step 4: Verify the recitation flow**

Confirm the following sequence works without reload:

\`\`\`
诗文卡片
→ 理解与背诵
→ 显示/隐藏译文
→ 开始背诵
→ 提示看看
→ 继续背
→ 我背完了
→ 下一段 / 进入直接默写
\`\`\`

---

### Task 3: Implement direct dictation modes and machine-result presentation

**Files:**
- Modify: \`/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html\`

- [ ] **Step 1: Render the direct-dictation mode selector**

Implement the three modes required by the source document:

- 上下句默写（默认）;
- 全篇默写;
- 抽查默写.

Use a mode selector that updates \`state.directMode\` and re-renders only the poetry detail content.

- [ ] **Step 2: Implement pair-dictation**

Render one question at a time with a prompt sentence and a single-line input. On submit, compare the normalized answer to the local standard answer, show an immediate correct/error result, then provide the next-question action. After the final question, render a summary.

- [ ] **Step 3: Implement full-text and random-check dictation**

Full-text mode must provide a multi-line input, character count, clear action, reveal-original action, and submit action. Random-check mode must select a configured segment and use the same submission/result pattern.

- [ ] **Step 4: Implement the result state**

Show total score, elapsed-time placeholder, submitted answer vs standard answer, and visual differences for correct, wrong, missing, and extra characters. Provide “重新默写” and “去理解检测” actions.

- [ ] **Step 5: Verify direct-dictation interactions**

Verify:

- empty submission is blocked or clearly prompted;
- correct and incorrect answers produce different result states;
- full-text result can be scrolled horizontally/vertically inside the landscape shell;
- restart resets only the active practice state;
- “去理解检测” switches to the comprehension tab.

---

### Task 4: Implement comprehension dictation and results

**Files:**
- Modify: \`/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html\`

- [ ] **Step 1: Render the comprehension list and filters**

Support filters for “全部、情境提示、主题归类、手法识别”. Each question card shows type, summary, difficulty, and answer status.

- [ ] **Step 2: Implement comprehension answering**

Render the current question with a multi-line input, hint action, skip action, submit action, and question progress. Store answers in \`state.comprehensionAnswers\`.

- [ ] **Step 3: Implement feedback and summary**

After submission show correctness, the student answer, standard answer, explanation, and next-question action. After the final question show score, elapsed-time placeholder, correct/wrong list, retry-wrong action, and return-to-directory action.

- [ ] **Step 4: Verify comprehension flow**

Verify the path:

\`\`\`
理解性默写列表
→ 筛选题型
→ 进入题目
→ 输入答案
→ 提交
→ 查看解析
→ 下一题
→ 总结
\`\`\`

---

### Task 5: Implement classical-Chinese real/virtual-word cards and practice

**Files:**
- Modify: \`/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html\`

- [ ] **Step 1: Add word mock data**

Define separate real-word and virtual-word records with target word, pinyin, textbook example, meaning, part of speech/use, source, original sentence, translation, and practice questions.

- [ ] **Step 2: Render the word module entry and type switch**

Support the “实词 / 虚词” switch, content-range label, word progress, and two actions: “词卡学习” and “词汇练习”.

- [ ] **Step 3: Implement flip cards**

Render front and back faces. Support previous/next card, flip, and “标记学会”. The state should update the visible progress and badge after marking.

- [ ] **Step 4: Implement word practice**

Support practice-count selection, definition-choice questions, distinction-choice questions, immediate answer feedback, and next-question progression. On a wrong answer, show the detailed card with the current meaning and example highlighted before allowing the student to continue.

- [ ] **Step 5: Implement practice summary**

Show correct count, wrong count, completed words, and “继续巩固”/“返回词卡” actions. Keep all data local and resettable.

- [ ] **Step 6: Verify word flow**

Verify:

\`\`\`
积累本首页
→ 文言文实虚词
→ 实词/虚词切换
→ 词卡正反面
→ 标记学会
→ 词汇练习
→ 错误巩固
→ 练习结果
\`\`\`

---

### Task 6: Polish, accessibility, and final browser verification

**Files:**
- Modify: \`/Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html\`
- Modify: \`/Users/tal/Desktop/tog/demo/index.html\`

- [ ] **Step 1: Add interaction affordances**

Ensure all buttons have visible hover/active/disabled states, every state-changing action has a concise feedback label, and back actions preserve the expected parent screen.

- [ ] **Step 2: Add keyboard-friendly behavior**

Use native buttons and inputs, keep logical tab order, support Enter to submit the focused answer where safe, and ensure the fixed landscape shell never clips primary actions.

- [ ] **Step 3: Check content consistency**

Confirm labels match the source document: “理解与背诵、直接默写、理解性默写、实词、虚词、词卡学习、词汇练习”.

- [ ] **Step 4: Run final checks**

Run:

\`\`\`bash
rg -n "古诗文背默|文言文实虚词|理解与背诵|直接默写|理解性默写|请横屏使用" /Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html
\`\`\`

Then open the demo in the browser and verify the homepage, both module entries, all poetry tabs, direct-dictation submission, comprehension summary, word-card flip, wrong-answer consolidation, and landscape-only behavior.

- [ ] **Step 5: Review the final diff**

Run:

\`\`\`bash
git diff -- /Users/tal/Desktop/tog/demo/index.html /Users/tal/Desktop/tog/demo/yuwen/accumulation/index.html
git status --short
\`\`\`

Ensure no unrelated files are changed.

