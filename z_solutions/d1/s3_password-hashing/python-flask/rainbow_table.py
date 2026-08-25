"""Solution de la recherche SHA-256 séquentielle du Jour 1, Section 3."""

from __future__ import annotations

import hashlib
import string
from time import perf_counter


ALPHABET = string.ascii_letters + string.digits
MAX_LENGTH = 4


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def find_at_length(
    target_hash: str,
    password: str,
    target_length: int,
) -> str | None:
    if len(password) == target_length:
        if hash_password(password) == target_hash:
            return password
        return None

    for character in ALPHABET:
        found_password = find_at_length(
            target_hash,
            password + character,
            target_length,
        )
        if found_password is not None:
            return found_password

    return None


def find_password(
    target_hash: str,
    min_length: int,
    max_length: int,
) -> dict[str, str | float | None]:
    started_at = perf_counter()

    for length in range(min_length, max_length + 1):
        password = find_at_length(target_hash, "", length)
        if password is not None:
            return {
                "password": password,
                "elapsed_ms": round((perf_counter() - started_at) * 1_000, 3),
            }

    return {
        "password": None,
        "elapsed_ms": round((perf_counter() - started_at) * 1_000, 3),
    }
