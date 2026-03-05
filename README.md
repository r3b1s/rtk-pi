# rtk-pi

[RTK (Rust Token Killer)](https://github.com/nichochar/rtk) extension for [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent). Transparently rewrites bash commands through `rtk` to reduce LLM token consumption by 60-90%.

This requires `rtk` -> https://github.com/rtk-ai

The main goal here is minimalism. It's just hooks rtk into pi. Other rtk implementations I've found on npm are not trustworthy and seem to reimplement the original rtk logic or add their own blend of secret spices.

This extension is designed to work WITH an existing rtk installation.
It does NOT add any additional logic or rewrite the functionality of the original `rtk` tool.
It just utilizes interfaces/hooks exposed by `pi` to automatically rewrite bash commands.

## Install

Add to your pi agent extensions config (e.g. `.pi/extensions/` or `settings.json`):

```
/path/to/rtk-pi
```

Requires `rtk` to be installed and on your `PATH`.

## How it works

1. On startup, parses `rtk help` to discover supported commands
2. Intercepts `bash` tool calls and rewrites commands (e.g. `git status` → `rtk git status`)
3. Skips interactive commands (`-i` flags), heredocs, and commands already using `rtk`
4. Injects RTK meta-command documentation into the system prompt

## Meta commands

```bash
rtk gain              # Show token savings analytics
rtk gain --history    # Show command usage history
rtk discover          # Find missed optimization opportunities
rtk proxy <cmd>       # Run command without rtk filtering
```
