# 第三方材料

- **llama.cpp / ggml**：MIT，官方仓库 <https://github.com/ggml-org/llama.cpp>；保留 `entry/src/main/resources/rawfile/licenses/llama.cpp-LICENSE.txt`。固定 CPU 运行包 b11146 从官方 Release 获取，分发时同时保留包内许可文件。
- **Qwen3-0.6B GGUF**：官方模型 <https://huggingface.co/Qwen/Qwen3-0.6B-GGUF>，Apache-2.0；保留 `entry/src/main/resources/rawfile/licenses/Qwen3-LICENSE.txt`。权重不属于本项目 MIT 代码，下载地址和校验值见运行清单。
- **Node.js**：用户自行安装。若制作包含 Node 的完整包，必须额外附 Node LICENSE 及其第三方声明；当前源码/运行资源 ZIP 不包含 Node。
- **MindSpore Lite**：保留转换和适配源码；运行库、权重与模型差分不进入公开源码包。需要分发运行库时单独核对上游 Apache-2.0 和第三方 notices。
- **ASSISTments 学习日志与情绪候选**：来源和引用见本地 `data/emotion_behavior/README.md`。公开导出排除原始/派生学习日志及 `behavior_graph_v1.json`，不将这些数据改为 MIT。
- **数学题目**：网页内保留现有审核题库。现有来源记录不足以证明所有题目的再分发许可，公开发布前维护者须确认授权或替换成自编题；MIT 不授予第三方题目权利。这是当前发布的材料授权待确认项。

项目 LICENSE 仅覆盖维护者有权授权的自有代码，不替代上述许可。
