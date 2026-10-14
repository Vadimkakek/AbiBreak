import { keccak256Hex } from "./keccak.js";

export function unwrapAbi(document) {
  if (Array.isArray(document)) return document;

  if (document && Array.isArray(document.abi)) {
    return document.abi;
  }

  throw new Error("ABI file must contain an ABI array or an object with an abi array");
}

export function canonicalType(parameter) {
  if (!parameter || typeof parameter.type !== "string") {
    throw new Error("ABI parameter is missing a type");
  }

  if (!parameter.type.startsWith("tuple")) {
    return parameter.type;
  }

  if (!Array.isArray(parameter.components)) {
    throw new Error("Tuple ABI parameter is missing components");
  }

  const suffix = parameter.type.slice("tuple".length);
  const inner = parameter.components.map(canonicalType).join(",");
  return `(${inner})${suffix}`;
}

function parameterTypes(parameters = []) {
  return parameters.map(canonicalType).join(",");
}

export function itemSignature(item) {
  if (!["function", "event", "error"].includes(item?.type)) return null;
  if (typeof item.name !== "string" || item.name.length === 0) {
    throw new Error(`${item.type} ABI item is missing a name`);
  }

  return `${item.name}(${parameterTypes(item.inputs)})`;
}

export function itemSelector(item) {
  const signature = itemSignature(item);
  if (!signature) return null;

  const hash = keccak256Hex(signature);
  return item.type === "event" ? `0x${hash}` : `0x${hash.slice(0, 8)}`;
}

export function outputSignature(item) {
  if (item?.type !== "function") return null;
  return `(${parameterTypes(item.outputs)})`;
}

export function normalizeItem(item) {
  const signature = itemSignature(item);
  if (!signature) return null;

  return {
    type: item.type,
    name: item.name,
    signature,
    selector: itemSelector(item),
    outputs: outputSignature(item),
    stateMutability: item.stateMutability ?? null,
    anonymous: item.type === "event" ? Boolean(item.anonymous) : null,
    indexed: item.type === "event"
      ? (item.inputs ?? []).map((input) => Boolean(input.indexed))
      : null,
  };
}

export function normalizeAbi(abi) {
  const items = [];

  for (const rawItem of abi) {
    const item = normalizeItem(rawItem);
    if (item) items.push(item);
  }

  return items;
}
