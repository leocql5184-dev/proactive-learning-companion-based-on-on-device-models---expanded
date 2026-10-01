---
name: deveco-cli
description: 在本 HarmonyOS 主动学伴工程中开发和调试 ArkTS/ArkUI，或进行构建、代码检查、运行应用、设备和模拟器操作、日志诊断、鸿蒙 API 文档查询时使用。通过 DevEco CLI 和项目的 deveco MCP 完成相关工作，无需用户点名工具。
---

# HarmonyOS 主动学伴开发

## 本机环境

- 工程根目录：`D:\hcl`。
- DevEco Studio：`D:\DevEco Studio`。
- CLI：安装后通过 PATH 中的 `devecocli` 命令调用。
- 模块：`entry`；product：`default`；包名：`com.example.harmonylearningcompanion`。
- 页面入口：`entry/src/main/ets/pages/Index.ets`。

日常 CLI 操作优先使用项目包装命令，它自动设置本机工具链环境并进入工程根目录：

```powershell
& 'D:\hcl\.tools\deveco.cmd' --help
```

下文 `devecocli` 均可替换为这个包装命令，例如 `& 'D:\hcl\.tools\deveco.cmd' build`。直接调用全局 CLI 时，在工程根目录执行并设置 `DEVECO_CLI_STUDIO_PATH=D:\DevEco Studio`。MCP 的环境变量不会自动传给普通终端。优先使用实际版本的 `<子命令> --help` 核实选项。

## 按任务选择工具

- 开发页面或修复错误：读取相关代码，按需查鸿蒙文档，完成修改后调用 `deveco` MCP 的 `check` 检查受影响的 `.ets` 文件；需要产物验证时执行 `devecocli build`。
- 构建：`devecocli build`。指定模块用 `--modules entry`，debug 为默认模式。
- 查询 API 和组件用法：`devecocli docs search <关键词> --limit 5`，根据返回的真实文档 ID 执行 `devecocli docs read <文档ID>`。
- 类型、定义、引用和调用关系分析：优先使用 `deveco` MCP 实际暴露的工具及其入参定义，不能假定所有 Studio 版本都有相同工具。
- 代码规范检查：`devecocli check lint`；只有修复任务需要时才使用 `--fix`。
- 用户要求运行或验证应用时：`devecocli device list`，按目标执行 `devecocli run --module entry`。多设备时明确 `--device`。
- 模拟器查询：`devecocli emulator list`；在任务需要运行且目标明确时启动对应实例。
- 日志诊断：`devecocli log --level E --bundle-name com.example.harmonylearningcompanion --tail 100`。按需要使用 `--crash`，避免默认启动无限日志跟随。
- UI 验证：根据真实设备状态使用 `devecocli ui layout`、`ui screenshot` 和相应点击/输入命令；先读取子命令帮助。

## MCP 启动与恢复

项目的 `.codex/config.toml` 将 `deveco` 配置为本地 STDIO 服务。正常任务通过已连接的工具调用，不要每次另起一个 `serve mcp` 进程。

首次启动会安装项目依赖、执行 Hvigor 同步并初始化语言服务，因此协议握手成功不等于代码检查已经就绪。若工具返回明确的重试时间，按提示等待后重试；持续失败时读取具体错误并处理，避免重复启动服务。

若当前任务没有 `deveco` MCP 工具，说明可能尚未加载此工程的项目级配置。CLI 的构建、文档和 lint 仍可使用；明确说明实际验证方式，不把编译或 lint 结果称为 MCP 检查。

## 工作范围

根据用户当前任务自动选择上述工具，不要求用户重复点名 CLI。解释或只读诊断任务保持只读；修改、构建和设备操作需符合用户请求范围及当前运行权限。此 Skill 不改变 Codex 的权限设置。

Hvigor 拒绝含中文的真实工程路径，本工程已经使用英文实体目录。日常开发保持当前工程根目录，不要为构建另行创建或移动工程。MCP 的文件参数优先使用工程相对路径。

签名配置为空时，运行设备可能需要华为账号和调试签名；不要在普通代码检查中自动登录、重生成密钥或使用 `run --uninstall`。
