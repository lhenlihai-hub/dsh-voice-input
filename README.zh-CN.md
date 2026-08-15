# dsh-voice-input

[English](./README.md) | [简体中文](./README.zh-CN.md)

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的开源语音输入插件：把语音转成文字，再调用**当前会话已经选择的模型**做严格受限的整理，最后写回 Harness 输入框。

它只做两件事：

1. 语音输入；
2. 删除无意义语气词、口误重复和明确改口，并补充标点、断句。

它不会翻译，也不会回答听写内容。模型路由和凭据完全由 Harness 管理，因此插件没有 API Key 设置。

> 当前版本：`0.3.0`，按 DeepSeek Harness `0.1.0-rc.6` 的 Host、Client Modules、Slot 与 Typert 接口构建。

## 功能

- 在官方 `conversation.input.left` 插槽中添加麦克风和设置按钮；
- 优先使用浏览器的 `SpeechRecognition / webkitSpeechRecognition`；
- 浏览器不支持时回退到系统听写：macOS 使用 `Fn×2`，Windows 使用 `Win+H`；
- 默认快捷键为 `Ctrl+Alt+V`，支持自定义组合键或 `F1–F24`；
- 支持自动、普通话、繁体中文、粤语、英语、日语和韩语识别；
- 每次整理前读取当前 Session 的模型选择，并使用 Harness 自己的路由和凭据；
- 整理失败时保留原文，整理期间不会覆盖用户的新编辑；
- 根据浏览器语言自动提供中文或英文界面；
- 设置中提供确认后的一键完整卸载。

浏览器插件无法注册操作系统级全局快捷键，所以自定义快捷键只在 Harness 页面处于焦点时生效。

## 安装

如果旧版或错误版本仍然存在，先移除：

```bash
dsh plugin --profile <profile> remove dsh-voice-input
```

从 GitHub 安装最新版：

```bash
dsh plugin --profile <profile> add github:lhenlihai-hub/dsh-voice-input
```

随后完全退出并重新启动对应的 Harness profile。`<profile>` 替换成实际名称，常见名称是 `web`。

本地开发安装：

```bash
git clone https://github.com/lhenlihai-hub/dsh-voice-input.git
cd dsh-voice-input
npm install
npm test
cd ..
dsh plugin --profile <profile> add ./dsh-voice-input
```

也可以安装 tarball：

```bash
npm run pack:plugin
dsh plugin --profile <profile> add ./dsh-voice-input-0.3.0.tgz
```

## 使用

1. 点击麦克风或按 `Ctrl+Alt+V`；
2. 说话，再次点击或按快捷键停止；
3. 插件用当前会话模型整理转写文字并写回输入框；
4. 在旁边的设置中修改快捷键或识别语言。

进入系统听写回退时，输入框会自动聚焦。按系统听写快捷键并说话；草稿约 1.2 秒没有变化后自动整理。

## 整理规则

`0.3.0` 已完整替换旧提示词，不在旧提示词上增加例外。模型只允许做以下改动：

- 保留信息、主语、人称、语序、措辞、语气、时态、语言和中英文混写；
- 删除没有意义的语气词、口误重复和被明确改口替换的内容；
- 只修正根据上下文能够唯一确定的识别错误；
- 补充句末标点，按语义把多个意思拆成句子或自然段；
- 只有用户明确口述步骤、清单或标题时才使用 Markdown。

例如：

```text
输入：我们现在对软件进行重新的review
输出：我们现在对软件进行重新的review。
```

Host 要求模型返回严格的 `{"text":"..."}` JSON 包装，只有验证后的 `text` 会写回输入框。空内容、畸形 JSON、异常扩写、模型失败或工具调用都会回退到识别原文。

这套规则是独立实现，只参考了听写产品公开说明中的处理边界，例如删除无意义填充、重复和明确改口；项目与 Typeless 没有隶属关系。

## 隐私与模型

- 音频由浏览器语音识别实现或操作系统听写处理，不会发送给 Harness 模型；
- 只有识别后的文字会交给当前 Session 模型整理；
- 提供方、模型 ID、reasoning effort、路由和凭据都由 Harness 管理；
- 插件设置只保存在浏览器 `localStorage`。

浏览器语音识别是否会把音频发给浏览器厂商，取决于浏览器实现和隐私政策；如有顾虑，请使用系统听写回退。

## 安全卸载

在设置中选择**完整卸载插件**并确认。Host 会为当前 profile 调用参数固定的官方卸载命令，清除本插件的浏览器设置，在页面收到成功结果后请求 Harness 正常退出。重新启动 Harness 后，此 profile 已不再加载插件。

按钮会移除 profile 中安装的依赖和 bundle 注册；它不会删除你为了开发而单独克隆的源码目录，也不会清空 pnpm 多个项目共用的内容缓存。

命令行备用方式：

```bash
dsh plugin --profile <profile> remove dsh-voice-input
```

## 官方插件结构

- Host：`VoiceInputService` 注入官方 `llm` 和 `appExit` 服务；
- RPC：使用 `@deepseek-ai/dsh-typert-generator` 生成严格的 Host/Client 描述；
- Client：浏览器 bundle 使用官方 `window.__ModuleLoader__.load(...)` 包装；
- UI：通过官方 `conversation.input.left` Slot 注册；
- 安装：通过 `dsh.bundle.patch` 将 Host 行加入指定 profile。

源码包位于 `packages/dsh-voice-input`，仓库根包是 GitHub 安装和构建入口。

## 开发与验证

要求 Node.js 22 或更新版本。

```bash
npm install
npm test
npm pack --dry-run
```

测试会构建 Host 与 Client、生成 Typert 协议、检查严格 schema 和固定卸载参数、加载 Client factory，并验证发布产物。

## License

[MIT](./LICENSE)
