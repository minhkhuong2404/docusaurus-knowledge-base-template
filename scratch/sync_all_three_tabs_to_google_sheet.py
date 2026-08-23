#!/usr/bin/env python3
"""
sync_all_three_tabs_to_google_sheet.py
Pushes complete combined datasets (1,024 original + 4,096 new Level 3 Bloom's = 5,120 questions per tab)
for Spring Boot and System Design directly into Google Sheets.
"""

import urllib.request
import json
import csv
import os
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.path.join(BASE_DIR, 'scratch')
WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwnvPSs-KVnC5E6g-JnXeYr1XND9oBJrz2ZMzLT8w14LwW2xDiGRxlckLk2pQq09vsG/exec"

def build_combined_rows(orig_csv, new_csv):
    rows = []
    with open(os.path.join(SCRATCH_DIR, orig_csv), 'r', encoding='utf-8') as f:
        rows.extend(list(csv.reader(f))) # includes header
    with open(os.path.join(SCRATCH_DIR, new_csv), 'r', encoding='utf-8') as f:
        new_rows = list(csv.reader(f))
        rows.extend(new_rows[1:]) # exclude header
    return rows

def push_tab(tab_name, rows):
    print(f"\nPushing {len(rows)} rows for '{tab_name}' to Google Sheets...")
    payload = {tab_name: rows}
    json_bytes = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        WEBAPP_URL,
        data=json_bytes,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=90) as res:
        print(f"✓ Response for '{tab_name}': {res.read().decode('utf-8')}")

def main():
    print("=" * 65)
    print("Syncing Spring Boot & System Design (5,120 questions each)...")
    print("=" * 65)
    
    # 1. Spring Boot
    spring_rows = build_combined_rows('export_spring_boot_questions.csv', 'export_4k_spring.csv')
    push_tab('Spring Boot', spring_rows)
    time.sleep(2)
    
    # 2. System Design
    sys_rows = build_combined_rows('export_system_design_questions.csv', 'export_4k_system_design.csv')
    push_tab('System Design', sys_rows)
    
    print("\n" + "=" * 65)
    print("✓ All tabs successfully synced to Google Sheets!")
    print("=" * 65)

if __name__ == '__main__':
    main()
