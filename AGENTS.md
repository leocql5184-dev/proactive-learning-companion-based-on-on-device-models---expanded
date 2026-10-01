# HarmonyOS 主动学伴

本目录是 HarmonyOS / ArkTS / ArkUI 应用工程，主模块为 `entry`。

理解产品、规划功能或实现业务之前，先阅读 `PROJECT_BRIEF.md`。它依据“智伴同行”作品说明整理，区分原文要求、工程建议和待确认事项；工程建议尚未自动成为用户确认的范围。核心是授权感知、动态成长画像、主动介入决策与反馈更新闭环。用户当前的明确要求优先于该草案。

处理本项目的开发、构建、代码检查、运行、日志和鸿蒙文档任务时，主动读取并使用 `.agents/skills/deveco-cli/SKILL.md`，按需调用 DevEco CLI 和 `deveco` MCP，不需要用户每次提醒。用户指定其他工具或只要求解释时，以当前请求为准。

工程根目录为 `D:\hcl`。Hvigor 不支持中文真实工程路径，请从该英文目录执行项目命令。

DevEco Studio 位于 `D:\DevEco Studio`。普通终端优先调用 `.tools/deveco.cmd`，它会设置工具链环境并进入工程根目录；MCP 已在 `.codex/config.toml` 单独配置环境。不要假定 MCP 的环境变量会影响普通终端。

默认入口页面为 `entry/src/main/ets/pages/Index.ets`。修改 ArkTS 后做与改动相称的验证，并报告使用的是 MCP 检查、lint 还是实际构建。
