#!/usr/bin/env python3
"""Recover the short fictional password used by the local classroom lab."""

from __future__ import annotations

import argparse
import hashlib
import itertools
import string
from collections.abc import Iterator


ALPHABET = string.ascii_lowercase + string.ascii_uppercase + string.digits
MAX_LENGTH = 4


def candidates() -> Iterator[str]:
    for length in range(1, MAX_LENGTH + 1):
        for characters in itertools.product(ALPHABET, repeat=length):
            yield "".join(characters)


def recover_password(target_digest: str) -> tuple[str | None, int]:
    checked = 0
    for candidate in candidates():
        checked += 1
        digest = hashlib.sha256(candidate.encode("utf-8")).hexdigest()
        if digest == target_digest:
            return candidate, checked
    return None, checked


def sha256_digest(value: str) -> str:
    if len(value) != 64:
        raise argparse.ArgumentTypeError("l’empreinte SHA-256 doit contenir 64 caractères")
    if any(character not in string.hexdigits for character in value):
        raise argparse.ArgumentTypeError(
            "l’empreinte SHA-256 doit être écrite en hexadécimal",
        )
    return value.lower()


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Teste localement les candidats a-z A-Z 0-9 de longueurs 1 à 4 "
            "pour l’exercice fictif S4."
        ),
    )
    parser.add_argument("sha256", type=sha256_digest, help="empreinte SHA-256 cible")
    return parser.parse_args()


def main() -> None:
    arguments = parse_arguments()
    password, checked = recover_password(arguments.sha256)
    if password is None:
        raise SystemExit(
            f"Aucune correspondance trouvée après {checked} candidats "
            f"(longueur maximale : {MAX_LENGTH}).",
        )
    print(f"Correspondance trouvée après {checked} candidats : {password}")


if __name__ == "__main__":
    main()
