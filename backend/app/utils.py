import secrets
import string

PASSCODE_ALPHABET = string.ascii_letters + string.digits


def generate_meeting_code() -> str:
    """Random 11-digit meeting ID that never starts with 0, e.g. '84213976502'."""
    return str(secrets.randbelow(9 * 10**10) + 10**10)


def generate_passcode(length: int = 6) -> str:
    return "".join(secrets.choice(PASSCODE_ALPHABET) for _ in range(length))
