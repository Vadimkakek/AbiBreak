import test from "node:test";
import assert from "node:assert/strict";

import { parseArgs } from "../src/cli.js";
import { formatMarkdown } from "../src/report.js";

test("parseArgs reads two files and output flags", () => {
  assert.deepEqual(parseArgs(["old.json", "new.json", "--markdown", "--no-fail"]), {
    files: ["old.json", "new.json"],
    json: false,
    markdown: true,
    noFail: true,
    help: false,
  });
});

test("parseArgs rejects conflicting output modes", () => {
  assert.throws(
    () => parseArgs(["old.json", "new.json", "--json", "--markdown"]),
    /either --json or --markdown/,
  );
});

test("Markdown report is suitable for pull request comments", () => {
  const report = formatMarkdown({
    compatible: false,
    summary: { breaking: 1, safe: 0, total: 1 },
    changes: [
      {
        severity: "breaking",
        action: "removed",
        itemType: "function",
        signature: "transfer(address,uint256)",
        selector: "0xa9059cbb",
        message: "function transfer(address,uint256) was removed",
      },
    ],
  });

  assert.match(report, /ABI compatibility report/);
  assert.match(report, /0xa9059cbb/);
});
