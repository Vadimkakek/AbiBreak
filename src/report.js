function selectorText(change) {
  return change.selector ? ` ${change.selector}` : "";
}

export function formatHuman(result) {
  const lines = [
    result.compatible
      ? "ABI compatibility: compatible"
      : "ABI compatibility: BREAKING CHANGES FOUND",
    `Breaking: ${result.summary.breaking}`,
    `Safe:     ${result.summary.safe}`,
  ];

  if (result.changes.length === 0) {
    lines.push("", "No ABI changes detected.");
    return lines.join("\n");
  }

  const breaking = result.changes.filter((change) => change.severity === "breaking");
  const safe = result.changes.filter((change) => change.severity === "safe");

  if (breaking.length > 0) {
    lines.push("", "BREAKING");
    for (const change of breaking) {
      lines.push(`- ${change.message}${selectorText(change)}`);
    }
  }

  if (safe.length > 0) {
    lines.push("", "SAFE / ADDED");
    for (const change of safe) {
      lines.push(`- ${change.message}${selectorText(change)}`);
    }
  }

  return lines.join("\n");
}

export function formatMarkdown(result) {
  const icon = result.compatible ? "✅" : "❌";
  const lines = [
    `## ${icon} ABI compatibility report`,
    "",
    `- Breaking changes: **${result.summary.breaking}**`,
    `- Safe/additive changes: **${result.summary.safe}**`,
  ];

  if (result.changes.length === 0) {
    lines.push("", "No ABI changes detected.");
    return lines.join("\n");
  }

  const sections = [
    ["Breaking changes", "breaking"],
    ["Safe / additive changes", "safe"],
  ];

  for (const [title, severity] of sections) {
    const entries = result.changes.filter((change) => change.severity === severity);
    if (entries.length === 0) continue;

    lines.push("", `### ${title}`, "");
    for (const change of entries) {
      const selector = change.selector ? ` — \`${change.selector}\`` : "";
      lines.push(`- ${change.message}${selector}`);
    }
  }

  return lines.join("\n");
}
