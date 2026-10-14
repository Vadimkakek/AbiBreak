import test from "node:test";
import assert from "node:assert/strict";

import { itemSelector } from "../src/abi.js";
import { keccak256Hex } from "../src/keccak.js";

test("keccak256 matches the Ethereum empty-string vector", () => {
  assert.equal(
    keccak256Hex(""),
    "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
  );
});

test("function selector matches ERC-20 transfer", () => {
  assert.equal(
    itemSelector({
      type: "function",
      name: "transfer",
      inputs: [{ type: "address" }, { type: "uint256" }],
    }),
    "0xa9059cbb",
  );
});

test("event selector uses the full topic hash", () => {
  assert.equal(
    itemSelector({
      type: "event",
      name: "Transfer",
      inputs: [
        { type: "address", indexed: true },
        { type: "address", indexed: true },
        { type: "uint256", indexed: false },
      ],
    }),
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
  );
});
