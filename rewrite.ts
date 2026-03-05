import { execSync } from "child_process";

/** Set of base commands supported by rtk (populated from `rtk help`) */
let supportedCommands = new Set<string>();

/** Env-var prefix pattern: `FOO=bar BAZ=qux ` */
const ENV_PREFIX_RE = /^([A-Za-z_][A-Za-z0-9_]*=[^ ]* +)+/;

/** Commands/flags that should never be rewritten (interactive or dangerous) */
const EXCLUSIONS: RegExp[] = [
  /\s-i\b/,           // interactive flags (git rebase -i, git add -i)
  /\s--interactive\b/, // explicit --interactive
  /<</, // heredocs
];

/**
 * Parse `rtk help` output to extract supported subcommand names.
 * Returns true if rtk is available, false otherwise.
 */
export async function initSupportedCommands(): Promise<boolean> {
  try {
    const output = execSync("rtk help", { encoding: "utf-8", timeout: 5000 });
    // Parse command names from the Commands: section
    // Format: "  command-name   Description text"
    const lines = output.split("\n");
    let inCommands = false;
    for (const line of lines) {
      if (/^\s*Commands:/.test(line)) {
        inCommands = true;
        continue;
      }
      if (inCommands) {
        // End of commands section (empty line or non-indented line after commands)
        if (line.trim() === "" || (!line.startsWith(" ") && line.trim() !== "")) {
          if (line.trim() !== "" && !line.startsWith(" ")) break;
          continue;
        }
        const match = line.match(/^\s+(\S+)/);
        if (match) {
          supportedCommands.add(match[1]);
        }
      }
    }
    // Remove meta commands that shouldn't be used as rewrites
    supportedCommands.delete("gain");
    supportedCommands.delete("cc-economics");
    supportedCommands.delete("config");
    supportedCommands.delete("init");
    return supportedCommands.size > 0;
  } catch {
    return false;
  }
}

/**
 * Map from base command to the rtk subcommand that handles it.
 * Most are identity mappings, but some differ (e.g. cat -> read).
 */
const COMMAND_MAP: Record<string, string> = {
  cat: "read",
  rg: "grep",
};

/**
 * Attempt to rewrite a command through RTK.
 * Returns the rewritten command string, or null if no rewrite applies.
 */
export function rewrite(command: string): string | null {
  // Already using rtk
  if (/^(.*\/)?rtk\s/.test(command)) return null;

  // Check exclusions
  for (const excl of EXCLUSIONS) {
    if (excl.test(command)) return null;
  }

  // Strip leading env-var assignments for matching, preserve for output
  const envMatch = command.match(ENV_PREFIX_RE);
  const envPrefix = envMatch ? envMatch[0] : "";
  const body = envPrefix ? command.slice(envPrefix.length) : command;

  // Extract the base command (first word)
  const baseMatch = body.match(/^(\S+)/);
  if (!baseMatch) return null;
  const baseCmd = baseMatch[1];

  // Check if rtk supports this command (directly or via mapping)
  const rtkCmd = COMMAND_MAP[baseCmd] || baseCmd;
  if (!supportedCommands.has(rtkCmd)) return null;

  // Rewrite: replace the base command with `rtk <rtkCmd>`
  if (COMMAND_MAP[baseCmd]) {
    return envPrefix + "rtk " + rtkCmd + body.slice(baseCmd.length);
  }
  return envPrefix + "rtk " + body;
}
