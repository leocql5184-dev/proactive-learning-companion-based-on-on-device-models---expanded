# 参与开发

先读 `PROJECT_BRIEF.md`，区分已实现行为与产品愿景。默认改动目标为电脑端。安装 Node.js 22+ 后运行 `npm test`；修改推理路由需准备模型并运行 `npm run test:smoke`，修改 HTTP 边界需运行 `npm run test:security`。

不要提交模型权重、签名材料、本机绝对路径配置、学习者原始记录或调试输出。新增题目和训练材料必须记录来源与可再分发依据；不要从学生行为直接推断固定人格或真实情绪。

PR 描述应说明触发条件、行为变化、验证方式与限制。HarmonyOS 变更按 `.agents/skills/deveco-cli/SKILL.md` 验证，并准确说明 lint、MCP 检查、构建和真机运行的区别。
