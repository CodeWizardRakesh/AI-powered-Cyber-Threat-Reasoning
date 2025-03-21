import pandas as pd
import google.generativeai as genai
import os

# Configure Google Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")


# **Step 1: Load and Preprocess Data**
def load_and_preprocess_data(file_path):
    """Loads the CSV file and preprocesses it."""
    try:
        df = pd.read_csv(file_path)

        # Convert timestamp to datetime format
        df["Timestamp"] = pd.to_datetime(df["Timestamp"])

        # Remove duplicates & missing values
        df.drop_duplicates(inplace=True)
        df.dropna(inplace=True)

        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None


# **Step 2: Perform Threat Analysis**
def analyze_threats(df):
    """Analyzes the threat logs for high-risk events."""
    if df is None:
        print("No data to analyze.")
        return None, None

    # Count number of events per IP
    event_counts = df["Source IP"].value_counts()
    print("\n🔹 **Top Threat Sources:**")
    print(event_counts.head())

    # Filter high-severity events
    high_risk_events = df[df["Severity"].isin(["High", "Critical"])]
    print("\n🔹 **High-Risk Events:**")
    print(high_risk_events)

    return event_counts, high_risk_events


# **Step 3: Generate LLM-Based Cybersecurity Report**
def generate_threat_report(df):
    """Sends structured logs to Gemini LLM for reasoning and decision-making."""
    if df is None:
        return None

    # Select relevant logs for analysis
    log_text = df.head(5).to_string(index=False)

    # Define LLM prompt for cyber threat analysis
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

    response = model.generate_content(prompt)

    # Print the AI-generated report in a readable format
    print("\n🔹 **AI-Generated Cyber Threat Report:**\n")
    print(response.text)

    return response.text


# **Step 4: Save Report**
def save_report(report_text, output_file="cyber_threat_report.json"):
    """Saves the generated threat analysis report to a JSON file."""
    with open(output_file, "w") as f:
        f.write(report_text)
    print(f"\n✅ Report saved as {output_file}")


# **Main Execution**
if __name__ == "__main__":
    FILE_PATH = r"D:\Sem6\Finale Project\AI-powered-Cyber-Threat-Reasoning\Cyber_logs.csv"

    # Load and preprocess logs
    df = load_and_preprocess_data(FILE_PATH)

    # Analyze threats
    analyze_threats(df)

    # Generate AI-based cybersecurity report
    threat_report = generate_threat_report(df)

    # Save report if generated
    if threat_report:
        save_report(threat_report)
