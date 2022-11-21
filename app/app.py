from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

settings = {
    "speed": 10,
    "slope": 0,
    "surface": 9,
    "offset": 1.5,
    "gateway": 0.5,
}

@app.route("/api/settings", methods=["GET", "POST"])
def api_settings():
    if request.method == "POST":
        payload = request.get_json()
        for key, value in payload.items():
            if key in settings:
                print(f"updating key: {key} to value: {value}")
                settings.update({key: value})
    return jsonify(settings)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True, use_reloader=False)
