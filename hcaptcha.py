import os
import requests
from dotenv import load_dotenv

load_dotenv()

HCAPTCHA_SECRET = os.getenv("HCAPTCHA_SECRET")
HCAPTCHA_VERIFY_URL = os.getenv("HCAPTCHA_VERIFY_URL", "https://hcaptcha.com/siteverify")


def verify_hcaptcha(token):
    """Verify hCAPTCHA token with hCAPTCHA service."""
    try:
        r = requests.post(
            HCAPTCHA_VERIFY_URL,
            data={"secret": HCAPTCHA_SECRET, "response": token},
            timeout=5
        )
        return r.json().get("success", False)
    except Exception:
        return False
