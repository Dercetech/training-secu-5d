"""Compare two salted Argon2id hashes of one fictional password."""

from __future__ import annotations

from time import perf_counter

from argon2 import PasswordHasher

DEMO_PASSWORD = "password"


def create_argon2_hashes(password: str) -> tuple[str, str, float]:
    hasher = PasswordHasher()
    started_at = perf_counter()
    first_hash = hasher.hash(password)
    second_hash = hasher.hash(password)
    return first_hash, second_hash, perf_counter() - started_at


def main() -> None:
    hasher = PasswordHasher()
    first_hash, second_hash, elapsed_seconds = create_argon2_hashes(DEMO_PASSWORD)
    both_verify = hasher.verify(first_hash, DEMO_PASSWORD) and hasher.verify(
        second_hash, DEMO_PASSWORD
    )

    print("Même mot de passe fictif, deux résultats Argon2id :")
    print(f"1. {first_hash}")
    print(f"2. {second_hash}")
    print(f"Les deux valeurs sont différentes : {first_hash != second_hash}")
    print(f"Les deux vérifications réussissent : {both_verify}")
    print(f"Temps mesuré pour deux calculs sur cette machine : {elapsed_seconds:.3f} s")


if __name__ == "__main__":
    main()
