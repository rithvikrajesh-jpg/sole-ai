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

# TODO 1
HF_API_KEY = os.environ.get("HF_API_KEY", "")
HF_IMAGE_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"


# TODO 2
def hex_to_color_name(h):
    h = h.lstrip("#").lower()
    try: r, g, b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    except: return h
    mx, mn = max(r,g,b), min(r,g,b)
    br, sat = mx/255, (mx-mn)/mx if mx else 0
    if br < 0.15: return "black"
    if br > 0.88 and sat < 0.15: return "white"
    if sat < 0.18: return "dark gray" if br < 0.4 else "gray" if br < 0.65 else "light gray"
    if mx == r: return ("orange" if g > 120 else "dark orange") if g > b+60 else "magenta" if b > g+40 else "red"
    if mx == g: return "yellow-green" if r > b+60 else "cyan-green" if b > r+40 else "green"
    if mx == b: return "purple" if r > g+60 else "cyan" if g > r+40 else "blue"
    return "colorful"


# TODO 3
def generate_sneaker_image(prompt):
    if not HF_API_KEY:
        return None
    try:
        r = requests.post(HF_IMAGE_URL,
            headers={"Authorization": f"Bearer {HF_API_KEY}", "Content-Type": "application/json"},
            json={"inputs": prompt}, timeout=60)
        if r.status_code == 200 and r.headers.get("content-type", "").startswith("image"):
            mime = r.headers["content-type"].split(";")[0].strip()
            return f"data:{mime};base64,{base64.b64encode(r.content).decode()}"
    except Exception:
        pass
    return None


# TODO 4
def build_image_prompt(prefs):
    p = hex_to_color_name(prefs["primary_color"])
    a = hex_to_color_name(prefs["accent_color"])
    prompt = (f"Professional product photography of a {prefs['style']} sneaker, "
              f"{p} {prefs['material']} upper, {a} accent, {a} heel, white sole, "
              f"side view, white background, sharp focus, 8k, shoe only")
    if prefs.get("inspiration"):
        prompt += f", {prefs['inspiration']} theme"
    return prompt


# TODO 5
@app.route("/generate-image", methods=["POST"])
def generate_image():
    data   = request.get_json(silent=True) or {}
    prompt = data.get("image_prompt", "")
    if not prompt:
        return jsonify({"error": "No image prompt."}), 400
    if not HF_API_KEY:
        return jsonify({"error": "HF_API_KEY not configured."}), 503
    image_url = generate_sneaker_image(prompt)
    if not image_url:
        return jsonify({"error": "Image generation failed. Try again."}), 500
    return jsonify({"success": True, "image_url": image_url})

def build_image_prompt(prefs): 
    p = hex_to_color_name(prefs["primary_color"])
    a = hex_to_color_name(prefs["accent_color"])
    prompt = (f"Professional product photography of a {prefs['style']} sneaker, "
              f"{p} {prefs['material']} upper, {a} accent, {a} heel, white sole, "
              f"side view, white background, sharp focus, 8k, shoe only")
    if prefs.get("inspiration"):
        prompt += f", {prefs['inspiration']} theme"
    return prompt    
