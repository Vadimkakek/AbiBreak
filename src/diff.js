import { normalizeAbi } from "./abi.js";

function key(item) {
  return `${item.type}:${item.signature}`;
}

function mapByKey(items) {
  return new Map(items.map((item) => [key(item), item]));
}

function sameArray(left, right) {
  if (left === right) return true;
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function describeItem(item) {
  return `${item.type} ${item.signature}`;
}

function changedMetadata(oldItem, newItem) {
  const reasons = [];

  if (oldItem.type === "function" && oldItem.outputs !== newItem.outputs) {
    reasons.push(`outputs changed from ${oldItem.outputs} to ${newItem.outputs}`);
  }

  if (
    oldItem.type === "function" &&
    oldItem.stateMutability !== newItem.stateMutability
  ) {
    reasons.push(
      `state mutability changed from ${oldItem.stateMutability ?? "unspecified"} to ${newItem.stateMutability ?? "unspecified"}`,
    );
  }

  if (oldItem.type === "event" && oldItem.anonymous !== newItem.anonymous) {
    reasons.push(
      `anonymous changed from ${String(oldItem.anonymous)} to ${String(newItem.anonymous)}`,
    );
  }

  if (oldItem.type === "event" && !sameArray(oldItem.indexed, newItem.indexed)) {
    reasons.push("indexed event parameters changed");
  }

  return reasons;
}

function change({ severity, action, item, message }) {
  return {
    severity,
    action,
    itemType: item.type,
    signature: item.signature,
    selector: item.selector,
    message,
  };
}

export function diffAbi(oldAbi, newAbi) {
  const oldItems = normalizeAbi(oldAbi);
  const newItems = normalizeAbi(newAbi);
  const oldMap = mapByKey(oldItems);
  const newMap = mapByKey(newItems);
  const changes = [];

  for (const oldItem of oldItems) {
    const matching = newMap.get(key(oldItem));

    if (!matching) {
      changes.push(
        change({
          severity: "breaking",
          action: "removed",
          item: oldItem,
          message: `${describeItem(oldItem)} was removed`,
        }),
      );
      continue;
    }

    const reasons = changedMetadata(oldItem, matching);
    if (reasons.length > 0) {
      changes.push(
        change({
          severity: "breaking",
          action: "changed",
          item: matching,
          message: `${describeItem(matching)} changed: ${reasons.join("; ")}`,
        }),
      );
    }
  }

  for (const newItem of newItems) {
    if (!oldMap.has(key(newItem))) {
      changes.push(
        change({
          severity: "safe",
          action: "added",
          item: newItem,
          message: `${describeItem(newItem)} was added`,
        }),
      );
    }
  }

  const breaking = changes.filter((entry) => entry.severity === "breaking");
  const safe = changes.filter((entry) => entry.severity === "safe");

  return {
    compatible: breaking.length === 0,
    summary: {
      breaking: breaking.length,
      safe: safe.length,
      total: changes.length,
    },
    changes,
  };
}
