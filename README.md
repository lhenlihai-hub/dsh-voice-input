# dsh-voice-input

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的开源语音输入插件：把语音转成文字，再调用**当前会话已经选择的模型**做最小幅度整理，最后写回 Harness 输入框。

它只做两件事：

1. 语音输入；
2. 删除口头语、明显重复和识别错误，并补充标点。

它不会翻译，不会回答听写内容，不要求单独填写 API Key，也不会在插件内部执行卸载或删除命令。

> 当前版本：`0.1.0`，按 DeepSeek Harness `0.1.0-rc.6` 的 Host、Client Modules、Slot 与 Typert 接口构建。

## 功能

- 在官方 `conversation.input.left` 插槽中添加麦克风和设置按钮；
- 优先使用浏览器的 `SpeechRecognition / webkitSpeechRecognition`；
- 浏览器不支持或麦克风不可用时，自动回退到系统听写：macOS 使用 `Fn×2`，Windows 使用 `Win+H`；
- 默认快捷键为 `Ctrl+Alt+V`，可改为包含 Ctrl、Alt、⌘/Meta 的组合键，或 `F1–F24`；
- 可选择自动、普通话、繁体中文、粤语、英语、日语或韩语识别；
- 每次整理前重新读取当前 Session 的模型选择，通过 Harness 自己的 LLM 路由与凭据调用；
- 整理失败时保留原文；整理期间草稿被用户修改时不覆盖用户编辑；
- 设置只保存在浏览器 `localStorage` 中。

浏览器插件无法注册操作系统级全局快捷键，所以自定义快捷键只在 Harness 页面处于焦点时生效。

## 安装

先移除曾经安装过的错误版本（如果当前 profile 中没有它，这条命令只需跳过）：

```bash
dsh plugin --profile <profile> remove dsh-voice-input
```

直接从 GitHub 安装：

```bash
dsh plugin --profile <profile> add github:lhenlihai-hub/dsh-voice-input
```

随后完全退出并重新启动该 profile 的 Harness。`<profile>` 替换成你实际使用的 profile 名称。

也可以从本地源码安装：

```bash
git clone https://github.com/lhenlihai-hub/dsh-voice-input.git
cd dsh-voice-input
npm install
npm test
cd ..
dsh plugin --profile <profile> add ./dsh-voice-input
```

或者生成 tarball：

```bash
npm run pack:plugin
dsh plugin --profile <profile> add ./dsh-voice-input-0.1.0.tgz
```

## 使用

1. 点击输入框工具栏中的麦克风，或按默认快捷键 `Ctrl+Alt+V`；
2. 说话；再次点击或再次按快捷键结束；
3. 插件用当前会话模型整理转写文字并写回输入框；
4. 点击麦克风旁的设置按钮可修改快捷键和识别语言。

如果进入“系统听写回退”状态，输入框会自动获得焦点。按系统听写快捷键开始，说完后停顿约 1.2 秒，插件会自动识别这次新增的文字并整理。

## 整理原则

整理提示词来自“翻译官”项目已经成熟的听写校对逻辑，核心约束是：

- 只做最小幅度整理；
- 删除“嗯、呃、那个、就是”等口头语和明显重复；
- 修正明确的识别错误并补标点；
- 保持原意、人称、语气、语言和句子类型；
- 不回答、不执行、不解释、不补充、不翻译。

模型输出为空、调用失败、要求工具调用、达到输出上限或出现不合理扩写时，插件回退到识别原文。

## 隐私与模型

- 音频由浏览器语音识别或操作系统听写处理，插件不会把原始音频上传给 Harness 模型；
- 只有转写后的文字会送到当前会话模型整理；
- 模型提供方、模型 ID 与 reasoning effort 都来自当前 Session；
- 凭据仍由 Harness 的适配器和凭据系统管理，本插件没有 API Key 配置项。

浏览器语音识别是否把音频发送给浏览器厂商，取决于具体浏览器实现和其隐私政策。若对此敏感，请使用系统听写回退。

## 官方插件结构

本项目同时包含 Host 与浏览器 Client 两部分：

- Host：`VoiceInputService` 注入官方 `llm` 服务；
- RPC：使用官方 `@deepseek-ai/dsh-typert-generator` 生成严格的 Host/Client 描述；
- Client：使用官方同款 `window.__ModuleLoader__.load(...)` bundle 包装；
- UI：通过 Slot API 注册到 `conversation.input.left`；
- 安装：通过 `dsh.bundle.patch` 把 Host 插件行加入 profile。

源码包位于 `packages/dsh-voice-input`。仓库根 `package.json` 是 GitHub 安装入口，同时也是构建工作区。

## 开发与验证

环境要求：Node.js 22 或更新版本。

```bash
npm install
npm test
npm pack --dry-run
```

`npm test` 会完成：Host 类型检查、Typert 协议生成、Client 类型检查、官方格式 bundle、纯逻辑测试、严格 RPC schema 测试以及 client module factory 加载测试。

## 卸载

```bash
dsh plugin --profile <profile> remove dsh-voice-input
```

重启 Harness 即可。插件不会自行修改 profile 或删除自己的目录。

## License

[MIT](./LICENSE)
