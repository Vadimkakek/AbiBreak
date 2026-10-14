#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { unwrapAbi } from "./abi.js";
import { diffAbi } from "./diff.js";
import { formatHuman, formatMarkdown } from "./report.js";

const HELP = `
AbiBreak — EVM ABI compatibility checker

Usage:
  abibreak <old-abi.json> <new-abi.json> [options]

Options:
  --json       Print machine-readable JSON
  --markdown   Print a Markdown report
  --no-fail    Exit 0 even when breaking changes are found
  -h, --help   Show this help

Exit codes:
  0  Compatible, or --no-fail was used
  1  Invalid input or file/JSON error
  2  Breaking ABI changes found
`.trim();

export function parseArgs(argv) {
  const options = {
    files: [],
    json: false,
    markdown: false,
    noFail: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--markdown") {
      options.markdown = true;
    } else if (arg === "--no-fail") {
      options.noFail = true;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      options.files.push(arg);
    }
  }

  if (options.json && options.markdown) {
    throw new Error("Choose either --json or --markdown, not both");
  }

  return options;
}

async function loadAbi(path) {
  const fullPath = resolve(path);
  let content;

  try {
    content = await readFile(fullPath, "utf8");
  } catch (error) {
    throw new Error(`Could not read ${path}: ${error.message}`);
  }

  let document;
  try {
    document = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in ${path}: ${error.message}`);
  }

  return unwrapAbi(document);
}

export async function main(argv = process.argv.slice(2)) {
  let options;

  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(`AbiBreak failed: ${error.message}`);
    return 1;
  }

  if (options.help) {
    console.log(HELP);
    return 0;
  }

  if (options.files.length !== 2) {
    console.error(HELP);
    return 1;
  }

  try {
    const [oldAbi, newAbi] = await Promise.all(options.files.map(loadAbi));
    const result = diffAbi(oldAbi, newAbi);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (options.markdown) {
      console.log(formatMarkdown(result));
    } else {
      console.log(formatHuman(result));
    }

    if (!result.compatible && !options.noFail) return 2;
    return 0;
  } catch (error) {
    console.error(`AbiBreak failed: ${error.message}`);
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await main();
}
