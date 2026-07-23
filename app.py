from flask import Flask, render_template
from datetime import datetime
import pytz

app = Flask(__name__)

# World clocks to display — (City Name, Timezone, Country Flag emoji)
WORLD_CLOCKS = [
    ("New York",    "America/New_York",      "🇺🇸"),
    ("London",      "Europe/London",          "🇬🇧"),
    ("Paris",       "Europe/Paris",           "🇫🇷"),
    ("Dubai",       "Asia/Dubai",             "🇦🇪"),
    ("Mumbai",      "Asia/Kolkata",           "🇮🇳"),
    ("Tokyo",       "Asia/Tokyo",             "🇯🇵"),
    ("Sydney",      "Australia/Sydney",       "🇦🇺"),
    ("Los Angeles", "America/Los_Angeles",    "🇺🇸"),
    ("São Paulo",   "America/Sao_Paulo",      "🇧🇷"),
    ("Singapore",   "Asia/Singapore",         "🇸🇬"),
    ("Cairo",       "Africa/Cairo",           "🇪🇬"),
    ("Moscow",      "Europe/Moscow",          "🇷🇺"),
]

@app.route("/")
def index():
    clocks = []
    for city, tz_name, flag in WORLD_CLOCKS:
        tz = pytz.timezone(tz_name)
        now = datetime.now(tz)
        clocks.append({
            "city": city,
            "flag": flag,
            "timezone": tz_name,
            # Pass timezone string; JS will keep it live
        })
    return render_template("index.html", clocks=clocks)

if __name__ == "__main__":
    app.run(debug=True)
