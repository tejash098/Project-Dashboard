import { randomInt } from "node:crypto";

/**
 * Generate a 16-digit numeric identifier as a string. The first digit is always
 * 1–9 so the value is genuinely 16 digits long, and it's returned as a string
 * because a 16-digit number can exceed JS's safe integer range (~9.0e15) and
 * would otherwise lose precision. Uses crypto's `randomInt` for unbiased digits.
 *
 * Collisions are astronomically unlikely across the 16-digit space; the
 * `unique` index on the consuming field is the safety net that rejects any dup.
 * @returns {string} A 16-character string of digits, e.g. "4821093746512083".
 */
export const generate16DigitId = () => {
  let id = String(randomInt(1, 10)); // first digit 1–9 (never leading zero)
  for (let i = 0; i < 15; i++) {
    id += String(randomInt(0, 10)); // remaining 15 digits 0–9
  }
  return id;
};
