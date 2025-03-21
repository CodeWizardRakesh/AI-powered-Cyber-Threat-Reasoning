import os
import pandas as pd
import google.generativeai as genai
from flask import Flask, render_template, request, redirect, url_for, jsonify, Response
import time
import json

# Configure Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "uploads"
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# **Step 1: Load and Preprocess Data**
def load_and_preprocess_data(file_path):
    """Loads the CSV file and preprocesses it."""
    try:
        df = pd.read_csv(file_path)
        df["Timestamp"] = pd.to_datetime(df["Timestamp"], errors="coerce")
        df.drop_duplicates(inplace=True)
        df.dropna(inplace=True)
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

# **Step 2: Perform Threat Analysis**
def analyze_threats(df):
    """Analyzes the threat logs for high-risk events."""
    if df is None or isinstance(df, str):
        return None, None
    event_counts = df["Source IP"].value_counts().head(5).to_dict()
    high_risk_events = df[df["Severity"].isin(["High", "Critical"])]
    return event_counts, high_risk_events.to_dict(orient="records")

# **Step 3: Generate LLM-Based Cybersecurity Report**
def generate_threat_report(df):
    """Sends structured logs to Gemini LLM for reasoning and decision-making."""
    if df is None or isinstance(df, str):
        return "Error: No valid data to analyze."
    log_text = df.head(5).to_string(index=False)
    prompt = f"""
    Given the following cybersecurity logs, analyze potential threats and suggest security actions.

    Logs:
    {log_text}

    Instructions:
    1. Summarize key threats in simple terms.
    2. Identify patterns (brute-force attacks, malware, port scans, etc.).
    3. Recommend security actions (e.g., block IP, notify security team, increase firewall rules).

    Respond in JSON format with fields: "Summary", "Threat Patterns", "Recommended Actions".
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating report: {e}")
        return "Error: Failed to generate report."

# Stream the report in a structured format
def stream_threat_report(df):
    """Streams the threat report in structured form word-by-word."""
    report = generate_threat_report(df)
    if not report or "Error" in report:
        yield "data: Error generating report.\n\n"
        return

    try:
        # Parse JSON response
        report_data = json.loads(report)
        summary = report_data.get("Summary", "No summary provided.")
        patterns = report_data.get("Threat Patterns", "No patterns identified.")
        actions = report_data.get("Recommended Actions", "No actions recommended.")

        # Structure the report
        structured_report = (
            "Summary:\n" + summary + "\n\n" +
            "Threat Patterns:\n" + patterns + "\n\n" +
            "Recommended Actions:\n" + actions
        )
    except json.JSONDecodeError:
        # Fallback if JSON parsing fails
        structured_report = "Raw Report:\n" + report

    # Stream word-by-word
    words = structured_report.split()
    for word in words:
        yield f"data: {word} \n\n"
        time.sleep(0.1)  # Simulate word-by-word generation

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        file = request.files["file"]
        if file:
            file_path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
            file.save(file_path)
            df = load_and_preprocess_data(file_path)
            event_counts, high_risk_events = analyze_threats(df)
            return render_template("index.html", 
                                   event_counts=event_counts,
                                   high_risk_events=high_risk_events,
                                   filename=file.filename)
    return render_template("index.html")

@app.route("/stream-report")
def stream_report():
    filename = request.args.get("filename")
    if not filename:
        return Response("data: No filename provided.\n\n", mimetype="text/event-stream")
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    df = load_and_preprocess_data(file_path)
    return Response(stream_threat_report(df), mimetype="text/event-stream")

if __name__ == "__main__":
    app.run(debug=True)