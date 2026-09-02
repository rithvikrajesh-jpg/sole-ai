import json
import os

from flask import Flask, jsonify, request
from dotenv import load_dotenv
from hcaptcha import verify_hcaptcha

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "sneaker-studio-dev-key")

DESIGN_PROMPT = """You are a sneaker design expert. Create a concept based on the user preferences.
Return valid JSON with keys: name, tagline, description, retail_price, target_audience, style_tags, materials, features, sole_type.
Use pricing in USD as a string.
"""


def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        from groq import Groq
        return Groq(api_key=api_key)
    except Exception:
        return None


@app.route("/")
def index():
    return {"status": "ok", "message": "Sole AI is running."}


@app.route("/studio")
def studio():
    return {"status": "ok", "message": "Studio ready."}


@app.route("/history")
def history():
    return jsonify({"designs": []})


@app.route("/generate", methods=["POST"])
def generate_concept():
    # TODO 2: Verify hCAPTCHA token first
    token = request.json.get("h-captcha-response", "")
    if not token:
        return jsonify({"error": "Please complete the CAPTCHA."}), 400
    if not verify_hcaptcha(token):
        return jsonify({"error": "CAPTCHA verification failed."}), 400
    
    prefs = request.get_json(silent=True) or {}
    client = get_groq_client()
    if not client:
        return jsonify({"error": "GROQ_API_KEY not set."}), 500

    try:
        chat = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a sneaker design expert. Return pure JSON only."},
                {"role": "user", "content": DESIGN_PROMPT + "\n\nPreferences:\n" + json.dumps(prefs, indent=2)},
            ],
            temperature=0.85,
            max_tokens=1200,
        )
        raw = chat.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.strip("`")
            if raw.lower().startswith("json"):
                raw = raw[4:]
        raw = raw.strip()
        concept = json.loads(raw)
        return jsonify({"concept": concept})
    except Exception as exc:
        return jsonify({"error": f"AI generation failed: {exc}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
