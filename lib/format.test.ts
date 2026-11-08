import assert from "node:assert/strict";
import test from "node:test";
import { formatSol, shortAddress, shortBlockhash } from "./format";

test("formatSol shows whole SOL and trimmed lamports", () => {
  assert.equal(formatSol(0n), "0");
  assert.equal(formatSol(1_000_000_000n), "1");
  assert.equal(formatSol(1_500_000_000n), "1.5");
  assert.equal(formatSol(1n), "0.000000001");
});

test("shortAddress keeps short values intact", () => {
  assert.equal(shortAddress("abcd"), "abcd");
  assert.equal(shortAddress("123456789abcdef"), "1234…cdef");
});

test("shortBlockhash keeps a short value and shortens a long one", () => {
  assert.equal(shortBlockhash("abcd"), "abcd");
  assert.equal(shortBlockhash("123456789abcdef"), "1234…cdef");
});
