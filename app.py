
from flask import Flask, render_template
from dotenv import load_dotenv

load_dotenv()                          # loads .env file into environment
app = Flask(__name__)                  # creates the Flask app
app.secret_key = "sneaker-studio-dev-key"  # needed for sessions later

@app.route("/")                        # the / URL maps to this function
def index():
    return render_template("index.html")

@app.route("/studio")                  # the /studio URL
def studio():
    return render_template("studio.html", hcaptcha_site_key="")

@app.route("/history")                 # the /history URL
def history():
    return render_template("history.html", designs=[])

@app.route("/genrate")
def generate_concept(prefs):
    if not groq_client:
        raise RuntimeError("GROQ_API_KEY not set.")
    chat = grog_client.chat.completions.create(
        model= "llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "sneaker desgin expert. pure JSON only."}
            {"role": "system", "content": DESIGN_PROMPT.format(**prefs)},
        ],
        temperature=0.85, max_tokens=1200,
    )
    raw = chat.choices[0].message.content.strip()
    if raw.startswith("'''")
     raw = raw.splith("'''")[1]
     if raw.startswith("json"): raw = raw[4:]
     return json.loads(raw.strip().rstrip("'''").strip())


if __name__ == "__main__":
    app.run(debug=True, port=5000)
