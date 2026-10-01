# GitHub 发布流程

## 文件拆分

源码仓库包含 README、LICENSE、SECURITY、CONTRIBUTING、第三方声明、环境示例、桌面源码/Skill、测试、CI、HarmonyOS/MindSpore 源码。官方大模型与运行库用下载脚本准备。签名、比赛包、学习原始记录、本机配置、缓存和历史调试输出只留本地。

```powershell
npm test
powershell -NoProfile -ExecutionPolicy Bypass -File tools/release/Package-Public.ps1
```

输出 `outputs/public-release/zhiban-source.zip` 和同目录 SHA-256 / 清单 / 扫描报告。这是白名单导出的新源码树，不含 `.git`。现有仓库已有大量 tracked 的 outputs 和本机配置，**不要在原目录直接 `git add .` 后 push**；ignore 规则不影响旧索引和历史。

在 GitHub 创建空仓库，解压源码 ZIP 到新的英文目录，再在新目录执行：

```powershell
git init
git add .
git commit -m "Initial desktop GGUF release"
git branch -M main
# 用实际仓库 URL 替换以下占位项
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

本指南的命令不代表已创建或推送仓库。启用 GitHub secret scanning / push protection、私密漏洞报告；确认 Actions 检查通过。

## 运行资源包

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/local-llm/Prepare-Desktop.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tools/release/Package-Public.ps1 -IncludeRuntime
```

输出源码 ZIP 以及 `zhiban-windows-gguf.zip`。后者包含官方 GGUF 和完整 CPU DLL，但 **仍需另装 Node.js 22+**；不要宣传为无需环境安装。上传至 GitHub Releases，附 ZIP 的 SHA-256、版本和本次验证结果；不要将 ZIP 或模型提交进 Git。

CI 默认只跑无需大模型的桌面回归；手动选择 `verify_model=true` 会下载真实 GGUF、启动桌面服务并跑推理和安全验收。生成的 Actions artifact 可下载复核，不会自动发布或推送。当前保留的 .ms 不参与默认 CI。

## 发布门槛

- 真实 GGUF smoke 和 HTTP 安全测试通过，解压后的源码能在无 DevEco/Python 环境下运行回归。
- 确认网页题目的公开分发权；来源记录不足时须补授权或换自编题。数据处理说明不能代替许可。
- 不上传原 Git 历史、私钥、原始数据、比赛提交包。公开离线运行包需同时保留第三方许可。
- 首版明确标注 Windows 桌面研究原型，避免声称任意设备、零风险或真实教学效果已验收。
