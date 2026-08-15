# dsh-voice-input

[English](./README.md) | [简体中文](./README.zh-CN.md)

An open-source voice input plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It transcribes speech, makes a narrowly constrained cleanup pass with the model already selected in the current Harness Session, and inserts the result into the composer.

It does two things:

1. voice dictation;
2. removal of meaningless filler, speech-error repetition, and explicit self-corrections, plus reliable punctuation and sentence breaks.

It does not translate or answer dictated content. It has no API-key setting because model routing and credentials remain entirely within Harness.

> Current version: `0.3.0`, built against the DeepSeek Harness `0.1.0-rc.6` Host, Client Modules, Slot, and Typert interfaces.

## Features

- Adds microphone and settings controls to the official `conversation.input.left` slot.
- Uses `SpeechRecognition` / `webkitSpeechRecognition` where available.
- Falls back to OS dictation when browser recognition is unavailable: `Fn×2` on macOS or `Win+H` on Windows.
- Uses `Ctrl+Alt+V` by default and supports custom modified shortcuts or `F1–F24`.
- Supports automatic language detection plus Mandarin, Traditional Chinese, Cantonese, English, Japanese, and Korean recognition modes.
- Reads the selected model immediately before every cleanup call and uses Harness routing and credentials.
- Keeps raw text if cleanup fails and avoids overwriting edits made during cleanup.
- Provides Chinese or English UI automatically from the browser language.
- Provides a confirmed, one-click uninstall from the current profile.

Browser plugins cannot register OS-wide global shortcuts. The custom shortcut works while the Harness page has focus.

## Install

Remove any older or broken build first if it is still present:

```bash
dsh plugin --profile <profile> remove dsh-voice-input
```

Install the latest GitHub version:

```bash
dsh plugin --profile <profile> add github:lhenlihai-hub/dsh-voice-input
```

Then fully quit and restart that Harness profile. Replace `<profile>` with the profile you use, commonly `web`.

For local development:

```bash
git clone https://github.com/lhenlihai-hub/dsh-voice-input.git
cd dsh-voice-input
npm install
npm test
cd ..
dsh plugin --profile <profile> add ./dsh-voice-input
```

To install a tarball:

```bash
npm run pack:plugin
dsh plugin --profile <profile> add ./dsh-voice-input-0.3.0.tgz
```

## Use

1. Click the microphone or press `Ctrl+Alt+V`.
2. Speak, then click or press the shortcut again to stop.
3. The current Session model cleans the transcript and the plugin inserts it into the composer.
4. Open the adjacent settings button to change the shortcut or recognition language.

In OS-dictation fallback mode, the composer is focused automatically. Start the OS dictation shortcut and speak; cleanup begins after about 1.2 seconds without a draft change.

## Cleanup contract

Version `0.3.0` replaces the previous prompt instead of layering exceptions onto it. The model receives one exhaustive set of allowed edits:

- preserve information, subject, person, word order, wording, tone, tense, language, and mixed-language text;
- remove meaningless filler, speech-error repetition, and content explicitly replaced by a self-correction;
- correct only recognition errors that are unambiguous from context;
- add sentence punctuation and break separate ideas into sentences or paragraphs;
- use Markdown only when the speaker clearly dictates a list, steps, or a heading.

For example:

```text
Input:  我们现在对软件进行重新的review
Output: 我们现在对软件进行重新的review。
```

The Host requests a strict `{"text":"..."}` JSON envelope. Only its validated `text` field reaches the composer. Empty, malformed, excessively expanded, failed, or tool-call output falls back to the recognized source text.

This behavior is independently implemented. It follows public dictation-product principles such as removing filler, repetition, and explicit self-corrections; it is not affiliated with Typeless.

## Privacy and model use

- Audio is processed by the browser recognition implementation or OS dictation, not by the Harness model.
- Only recognized text is sent to the current Session model for cleanup.
- Provider, model ID, reasoning effort, routing, and credentials remain managed by Harness.
- Plugin settings are stored only in browser `localStorage`.

Whether browser recognition sends audio to its vendor depends on that browser's implementation and privacy policy. Use OS dictation fallback if that matters for your environment.

## Safe uninstall

Choose **Uninstall plugin** in settings and confirm. The Host calls the official fixed command for the current profile, clears this plugin's browser settings, returns success to the page, and then requests a graceful Harness exit. Restart Harness afterward; the plugin is no longer part of that profile.

The button removes the installed profile dependency and bundle registration. It does not delete a separate source checkout you cloned for development or purge pnpm's shared content-addressed cache.

Manual fallback:

```bash
dsh plugin --profile <profile> remove dsh-voice-input
```

## Official plugin structure

- Host: `VoiceInputService` injects the official `llm` and `appExit` services.
- RPC: strict Host/Client descriptors are generated by `@deepseek-ai/dsh-typert-generator`.
- Client: the browser bundle uses the official `window.__ModuleLoader__.load(...)` wrapper.
- UI: controls are registered through the official `conversation.input.left` Slot.
- Installation: `dsh.bundle.patch` adds the Host row to the selected profile.

The source package lives in `packages/dsh-voice-input`; the root package is the GitHub installation and build entry point.

## Development

Node.js 22 or newer is required.

```bash
npm install
npm test
npm pack --dry-run
```

The test command builds both plugin halves, generates the Typert protocol, checks strict schemas and fixed uninstall arguments, loads the Client factory, and verifies distributable artifacts.

## License

[MIT](./LICENSE)
