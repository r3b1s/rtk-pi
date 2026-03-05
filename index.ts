import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { rewrite, initSupportedCommands } from "./rewrite";
import { readFileSync } from "fs";
import { join } from "path";

const RTK_PROMPT = readFileSync(join(__dirname, "rtk.md"), "utf-8");

export default async function (pi: ExtensionAPI) {
  const available = await initSupportedCommands();
  if (!available) {
    console.warn("[pi-rtk-hook] rtk binary not found in PATH — extension disabled");
    return;
  }

  // Inject RTK meta-command docs into system prompt
  pi.on("before_agent_start", async (event) => ({
    systemPrompt: event.systemPrompt + "\n\n" + RTK_PROMPT,
  }));

  // Rewrite bash commands through rtk
  pi.on("tool_call", async (event) => {
    if (event.toolName !== "bash") return;
    const cmd = event.input.command;
    if (typeof cmd !== "string") return;
    const rewritten = rewrite(cmd);
    if (rewritten) {
      event.input.command = rewritten;
    }
  });
}
