#!/usr/bin/env python3
"""
push_oca_questions.py
Pushes the 165 OCA questions from export_oca_java_questions.csv to the 'Java' tab in Google Sheets
via the Google Apps Script Web App.
Strictly follows the Append-Only and Deduplication policy.
"""

import os
import sys
import json
import csv
import urllib.request

SCRATCH_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(SCRATCH_DIR, "quiz_config.json")
CSV_PATH = os.path.join(SCRATCH_DIR, "export_1k_oca_questions.csv")

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning loading config: {e}")
    return {}

def read_csv_rows(csv_path):
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            rows.append(row)
    return rows

def main():
    config = load_config()
    web_app_url = config.get("webAppUrl", "").strip()

    if not web_app_url:
        print("[Error] No webAppUrl configured in scratch/quiz_config.json")
        sys.exit(1)

    rows = read_csv_rows(CSV_PATH)
    if not rows or len(rows) < 2:
        print(f"[Error] No questions found in {CSV_PATH}")
        sys.exit(1)

    # rows[0] is header, rows[1:] are questions
    q_count = len(rows) - 1
    print(f"Preparing to push {q_count} OCA questions to 'Java' tab...")
    print(f"Target Google Apps Script Web App: {web_app_url[:45]}...")

    payload = {
        "Java": rows
    }

    json_data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        web_app_url,
        data=json_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            res_text = resp.read().decode('utf-8')
            print("=" * 60)
            print("✓ Google Sheets Web App Response:")
            print(res_text)
            print("=" * 60)
            print("Push complete!")
    except Exception as e:
        print(f"[Error] Failed to push to Google Sheet: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
