import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { initSupportedCommands, rewrite } from "./rewrite.ts";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RTK_PROMPT = readFileSync(join(__dirname, "rtk.md"), "utf-8");

export default async function (pi: ExtensionAPI) {
  initSupportedCommands();

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
