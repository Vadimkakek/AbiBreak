import test from "node:test";
import assert from "node:assert/strict";

import { diffAbi } from "../src/diff.js";

const oldAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [{ type: "address" }, { type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { type: "address", indexed: true },
      { type: "address", indexed: true },
      { type: "uint256", indexed: false },
    ],
  },
];

test("added ABI items are safe", () => {
  const result = diffAbi(oldAbi, [
    ...oldAbi,
    {
      type: "error",
      name: "Unauthorized",
      inputs: [{ type: "address" }],
    },
  ]);

  assert.equal(result.compatible, true);
  assert.equal(result.summary.breaking, 0);
  assert.equal(result.summary.safe, 1);
  assert.equal(result.changes[0].action, "added");
});

test("removed functions are breaking", () => {
  const result = diffAbi(oldAbi, oldAbi.filter((item) => item.name !== "transfer"));

  assert.equal(result.compatible, false);
  assert.equal(result.summary.breaking, 1);
  assert.match(result.changes[0].message, /transfer\(address,uint256\) was removed/);
  assert.equal(result.changes[0].selector, "0xa9059cbb");
});

test("changed function outputs are breaking even when selector is unchanged", () => {
  const newAbi = structuredClone(oldAbi);
  newAbi[0].outputs = [{ type: "bytes32" }];

  const result = diffAbi(oldAbi, newAbi);

  assert.equal(result.compatible, false);
  assert.equal(result.summary.breaking, 1);
  assert.match(result.changes[0].message, /outputs changed/);
});

test("changed indexed event fields are breaking", () => {
  const newAbi = structuredClone(oldAbi);
  newAbi[2].inputs[1].indexed = false;

  const result = diffAbi(oldAbi, newAbi);

  assert.equal(result.compatible, false);
  assert.equal(result.summary.breaking, 1);
  assert.match(result.changes[0].message, /indexed event parameters changed/);
});

test("changed function input types appear as removed plus added signatures", () => {
  const newAbi = structuredClone(oldAbi);
  newAbi[1].inputs[1].type = "uint128";

  const result = diffAbi(oldAbi, newAbi);

  assert.equal(result.compatible, false);
  assert.equal(result.summary.breaking, 1);
  assert.equal(result.summary.safe, 1);
});
