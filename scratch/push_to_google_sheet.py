#!/usr/bin/env python3
"""
Script: scratch/push_to_google_sheet.py
Description: Automatically pushes local CSV quiz questions directly into Google Sheets
             without any manual copying or CSV uploading.

Usage:
  1. Add Google Apps Script Web App URL in scratch/quiz_config.json:
     "webAppUrl": "https://script.google.com/macros/s/.../exec"

  2. Run push script:
     python scratch/push_to_google_sheet.py
"""

import os
import sys
import json
import csv
import urllib.request
import urllib.parse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(BASE_DIR, 'scratch', 'quiz_config.json')
SCRATCH_DIR = os.path.join(BASE_DIR, 'scratch')

CSV_MAP = {
    "Java": os.path.join(SCRATCH_DIR, "export_java_questions.csv"),
    "Spring Boot": os.path.join(SCRATCH_DIR, "export_spring_boot_questions.csv"),
    "System Design": os.path.join(SCRATCH_DIR, "export_system_design_questions.csv")
}

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def read_csv_rows(csv_path):
    if not os.path.exists(csv_path):
        return []
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            rows.append(row)
    return rows

def main():
    config = load_config()
    web_app_url = os.environ.get('GOOGLE_WEBAPP_URL', '').strip() or config.get('webAppUrl', '').strip()

    print("=" * 65)
    print("Automated Push to Google Sheets Tool")
    print("=" * 65)

    if not web_app_url:
        print("[Notice] No Google Web App URL configured in quiz_config.json.")
        print("\nTo enable 1-click automated push directly to Google Sheets:")
        print("1. Open your Google Sheet -> Extensions -> Apps Script")
        print("2. Paste the 15-line Google Apps Script snippet (shown below).")
        print("3. Click Deploy -> New Deployment -> Web App (Access: Anyone).")
        print("4. Copy the Web App URL and add it to scratch/quiz_config.json under 'webAppUrl'.")
        print("=" * 65)
        return

    payload_data = {}
    total_rows = 0

    for tab_name, csv_path in CSV_MAP.items():
        rows = read_csv_rows(csv_path)
        if rows:
            payload_data[tab_name] = rows
            total_rows += len(rows) - 1  # subtract header row

    if not payload_data:
        print("[Error] No CSV files found to push. Run python scratch/export_quiz_to_csv.py first.")
        return

    print(f"Preparing to push {total_rows} total questions across {len(payload_data)} tabs...")
    json_bytes = json.dumps(payload_data).encode('utf-8')

    req = urllib.request.Request(
        web_app_url,
        data=json_bytes,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res_text = response.read().decode('utf-8')
            print("=" * 65)
            print("✓ SUCCESS! Google Sheets response:")
            print(res_text)
            print("=" * 65)
            print("All questions pushed and populated in Google Sheets automatically!")
    except Exception as e:
        print(f"[Error] Failed to push to Google Sheet Web App: {e}")

if __name__ == '__main__':
    main()
