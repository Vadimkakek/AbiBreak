const MASK_64 = (1n << 64n) - 1n;

const ROTATION = [
  0, 1, 62, 28, 27,
  36, 44, 6, 55, 20,
  3, 10, 43, 25, 39,
  41, 45, 15, 21, 8,
  18, 2, 61, 56, 14,
];

const ROUND_CONSTANTS = [
  0x0000000000000001n, 0x0000000000008082n,
  0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n,
  0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n,
  0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn,
  0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n,
  0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n,
  0x0000000080000001n, 0x8000000080008008n,
];

function rotl64(value, shift) {
  if (shift === 0) return value & MASK_64;
  const amount = BigInt(shift);
  return ((value << amount) | (value >> (64n - amount))) & MASK_64;
}

function keccakF(state) {
  for (const roundConstant of ROUND_CONSTANTS) {
    const columns = Array(5).fill(0n);
    const deltas = Array(5).fill(0n);

    for (let x = 0; x < 5; x += 1) {
      columns[x] =
        state[x] ^
        state[x + 5] ^
        state[x + 10] ^
        state[x + 15] ^
        state[x + 20];
    }

    for (let x = 0; x < 5; x += 1) {
      deltas[x] = columns[(x + 4) % 5] ^ rotl64(columns[(x + 1) % 5], 1);
    }

    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const index = x + 5 * y;
        state[index] = (state[index] ^ deltas[x]) & MASK_64;
      }
    }

    const permuted = Array(25).fill(0n);

    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const index = x + 5 * y;
        const destination = y + 5 * ((2 * x + 3 * y) % 5);
        permuted[destination] = rotl64(state[index], ROTATION[index]);
      }
    }

    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const index = x + 5 * y;
        state[index] =
          (permuted[index] ^
            ((~permuted[(x + 1) % 5 + 5 * y]) &
              permuted[(x + 2) % 5 + 5 * y])) &
          MASK_64;
      }
    }

    state[0] = (state[0] ^ roundConstant) & MASK_64;
  }
}

function absorbBlock(state, block) {
  for (let lane = 0; lane < 17; lane += 1) {
    let value = 0n;

    for (let byte = 0; byte < 8; byte += 1) {
      value |= BigInt(block[lane * 8 + byte] ?? 0) << BigInt(8 * byte);
    }

    state[lane] = (state[lane] ^ value) & MASK_64;
  }

  keccakF(state);
}

export function keccak256(data) {
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : Uint8Array.from(data);
  const state = Array(25).fill(0n);
  const rate = 136;
  let offset = 0;

  while (offset + rate <= bytes.length) {
    absorbBlock(state, bytes.slice(offset, offset + rate));
    offset += rate;
  }

  const finalBlock = new Uint8Array(rate);
  finalBlock.set(bytes.slice(offset));
  finalBlock[bytes.length - offset] ^= 0x01;
  finalBlock[rate - 1] ^= 0x80;
  absorbBlock(state, finalBlock);

  const output = new Uint8Array(32);

  for (let index = 0; index < output.length; index += 1) {
    const lane = Math.floor(index / 8);
    const shift = BigInt((index % 8) * 8);
    output[index] = Number((state[lane] >> shift) & 0xffn);
  }

  return output;
}

export function keccak256Hex(data) {
  return [...keccak256(data)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
