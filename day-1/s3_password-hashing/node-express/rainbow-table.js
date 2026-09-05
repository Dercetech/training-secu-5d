"use strict";

const crypto = require("node:crypto");
const { performance } = require("node:perf_hooks");

const ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const MAX_LENGTH = 4;

function hashPassword(password) {
  return crypto.createHash("sha256").update(password, "utf8").digest("hex");
}

function findAtLength(targetHash, password, targetLength) {
  if (password.length === targetLength) {
    return hashPassword(password) === targetHash ? password : null;
  }

  for (const character of ALPHABET) {
    const foundPassword = findAtLength(
      targetHash,
      password + character,
      targetLength,
    );
    if (foundPassword !== null) return foundPassword;
  }

  return null;
}

function findPassword(targetHash, minLength, maxLength) {
  const startedAt = performance.now();

  for (let length = minLength; length <= maxLength; length += 1) {
    const password = findAtLength(targetHash, "", length);
    if (password !== null) {
      return {
        password,
        elapsed_ms: Number((performance.now() - startedAt).toFixed(3)),
      };
    }
  }

  return {
    password: null,
    elapsed_ms: Number((performance.now() - startedAt).toFixed(3)),
  };
}

module.exports = { findPassword, MAX_LENGTH };
