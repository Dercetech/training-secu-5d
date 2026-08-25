"use strict";

const { performance } = require("node:perf_hooks");
const argon2 = require("argon2");

const demoPassword = "password";

async function createArgon2Hashes(password) {
  const startedAt = performance.now();
  const firstHash = await argon2.hash(password);
  const secondHash = await argon2.hash(password);
  return { firstHash, secondHash, elapsedMilliseconds: performance.now() - startedAt };
}

async function main() {
  const { firstHash, secondHash, elapsedMilliseconds } = await createArgon2Hashes(demoPassword);
  const bothVerify =
    (await argon2.verify(firstHash, demoPassword)) &&
    (await argon2.verify(secondHash, demoPassword));

  console.log("Même mot de passe fictif, deux résultats Argon2id :");
  console.log(`1. ${firstHash}`);
  console.log(`2. ${secondHash}`);
  console.log(`Les deux valeurs sont différentes : ${firstHash !== secondHash}`);
  console.log(`Les deux vérifications réussissent : ${bothVerify}`);
  console.log(`Temps mesuré pour deux calculs sur cette machine : ${elapsedMilliseconds.toFixed(0)} ms`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { createArgon2Hashes };
