import crypto from "crypto";

export interface RNG {
  nextInt(min: number, max: number): number; // inclusive min, inclusive max
  nextFloat(): number; // [0, 1)
}

/**
 * Cryptographically secure RNG using Node.js crypto (production runtime)
 */
export class CryptoRNG implements RNG {
  nextInt(min: number, max: number): number {
    if (min > max) {
      throw new Error(`Invalid range: min (${min}) must be <= max (${max})`);
    }
    return crypto.randomInt(min, max + 1);
  }

  nextFloat(): number {
    const buf = crypto.randomBytes(4);
    return buf.readUInt32BE(0) / 0xffffffff;
  }
}

/**
 * Mulberry32 32-bit deterministic Seeded PRNG for reproducible test suites
 */
export class SeededRNG implements RNG {
  private state: number;

  constructor(seed: number | string) {
    if (typeof seed === "string") {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
      }
      this.state = hash >>> 0;
    } else {
      this.state = (seed >>> 0) || 1;
    }
  }

  nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    if (min > max) {
      throw new Error(`Invalid range: min (${min}) must be <= max (${max})`);
    }
    const range = max - min + 1;
    return min + Math.floor(this.nextFloat() * range);
  }
}
