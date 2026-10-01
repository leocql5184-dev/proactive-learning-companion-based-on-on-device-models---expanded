# 2026-09-30 .ms 比赛交付验收

默认桌面入口、聊天、语义路由、理解核验、主动证据提取和拍摄演示均接入 MindSpore Lite Qwen3 prefill/decode `.ms`。
GGUF 模型、llama.cpp CPU 运行包及原生依赖已移除。小型 guidance 动作模型仍采用已有 JSON 权重，未冒充生成模型。

电脑端回归 128 项通过（包含 ArkTS/Python 分词器一致性验证）；覆盖授权、草稿、暂停、清除、48 道题目录、聊天、主动介入、认知状态、符号核查、因果估计原型和反馈。
真实 `.ms` 测试包括语义路由、正确/错误解释、注入拒绝、取消与恢复；主动证据接口验证真实模型摘录与训练动作头。
拍摄示范 start/waiting/hint/complete 四步均真实生成并通过阶段校验，完整回复通过检查后才展示。
原始报告随工程保留在 outputs/local-chat 和 outputs/qwen-ms。

ArkTS/C++ MCP 检查无错误；分词器旧 TextDecoder API 有弃用提示。DevEco CLI 实际 Debug 构建成功。
已生成主体为“智伴同行”的本地 Debug 证书和 Profile，Hvigor 使用可搬移的相对路径与加密签名配置。
已签名 HAP 位于 submission/智伴同行-debug.hap。官方 hap-sign-tool verify-app 验证通过，包括摘要、权限签名和证书链提取。
签名为本地测试身份，非华为开发者平台签发身份，未绑定设备、未做真机安装验证。指定华为设备安装需另取官方 Debug 证书/Profile。

ZIP 中 qwen-prefill.ms + decode-delta.json/bin 无损代表完整双模型。首次启动或准备模型.cmd 自动还原 decode，校验文件大小与原始 SHA-256；无需网络。
这只减少交付冗余，运行时权重和原始 `.ms` 完全一致。还原所需的临时文件失败后会清理。
工程原目录仍保留完整双模型，便于继续开发；ZIP 不含另一份完整 decode、GGUF、构建缓存、Git 历史、重复转换权重或视频剪辑中间产物。

已完成独立解压验证：ZIP CRC、所有清单文件 SHA-256、decode 无损还原后的 SHA-256 均通过。
使用解压包自带 Node/Python 运行真实 `.ms` 语义路由、理解检查、注入拒绝、取消恢复测试通过，未依赖原目录的模型或推理运行库。

电脑验证不等于鸿蒙真机实测。认知、因果模块保留既有不确定性与合成评估边界，不宣称已验证真实教学提升或所有学科效果。
