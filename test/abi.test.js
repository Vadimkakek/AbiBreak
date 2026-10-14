import test from "node:test";
import assert from "node:assert/strict";

import { canonicalType, itemSignature, unwrapAbi } from "../src/abi.js";

test("canonicalType expands tuple arrays", () => {
  assert.equal(
    canonicalType({
      type: "tuple[]",
      components: [
        { type: "address" },
        {
          type: "tuple",
          components: [{ type: "uint256" }, { type: "bytes32" }],
        },
      ],
    }),
    "(address,(uint256,bytes32))[]",
  );
});

test("itemSignature uses canonical input types", () => {
  assert.equal(
    itemSignature({
      type: "function",
      name: "quote",
      inputs: [
        {
          type: "tuple",
          components: [{ type: "address" }, { type: "uint256" }],
        },
      ],
    }),
    "quote((address,uint256))",
  );
});

test("unwrapAbi accepts artifact-style objects", () => {
  const abi = [{ type: "function", name: "ping", inputs: [] }];
  assert.equal(unwrapAbi({ abi }), abi);
});
