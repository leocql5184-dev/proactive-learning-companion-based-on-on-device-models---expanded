# Windows 桌面安装

支持入口：Windows x64、Node.js 22+、现代 Edge/Chrome。建议 8 GB RAM、2 GB 磁盘、AVX2 CPU；这是建议配置，最低硬件和其他操作系统尚未完整验证。桌面 GGUF 不依赖 HarmonyOS SDK、Python 或 MindSpore。

安装顺序：安装 Node → 解压源码到可写目录 → `准备模型.cmd` → `打开学伴.cmd` → 等待页面就绪。首次准备下载固定的 llama.cpp CPU 包和 Qwen3-0.6B-Q8_0，SHA-256 不符会停止。Windows 安全软件可能阻止未签名脚本/引擎；不需要关闭防护，请核对官方来源与文件校验。

断网电脑：在联网电脑运行准备脚本，再复制 `tools/local-llm/windows-cpu/`（含 DLL 与 `verified-files.json`）和 `models/qwen3/Qwen3-0.6B-Q8_0.gguf` 到同样相对路径；安装 Node 后启动。无需重复下载。启动不改变任何 MindSpore 权重。

| 现象 | 处理 |
| --- | --- |
| 缺少 Node/版本过低 | 安装 22+，重开终端，用 `node --version` 确认 |
| 下载失败 | 检查 GitHub/Hugging Face 连接与系统代理；不要替换未知镜像或绕过校验 |
| 校验失败 | 将损坏文件移到别处，重新运行准备脚本；不要修改预期 SHA |
| 缺少 DLL/引擎启动失败 | 重新准备完整 CPU ZIP，查看 `outputs/local-chat/engine-error-8876.log` |
| 端口占用 | 关闭旧学伴；其他程序占用时停止冲突程序，双击入口固定使用 8875/8876 |
| 一直未就绪 | 查看桌面/引擎错误日志；运行包缺失、CPU 不支持或加载失败都不能当成成功推理 |
| 模型回复失败 | 界面可回退本地审核策略；用真实模型 smoke 确认是否真正调用 GGUF |

端口和浏览器来源决定 localStorage 的数据空间；修改端口或浏览器后旧记录不会自动迁移。日志不作为可公开的诊断附件。

可选 MindSpore：`打开学伴MindSpore.cmd` 保留；原 Python、NumPy、MindSpore Lite、tokenizer 和两份 `.ms` 需单独准备，不包含于公开源码 ZIP。历史竞赛入口说明见 `docs/SUBMISSION_MS.md`，与当前 GGUF 默认入口不同。
