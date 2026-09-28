#!/usr/bin/env python3
"""
generate_oca_quiz_bank.py
Aggregates all 165 official OCA Study Guide questions across:
- Assessment Test (20 questions)
- Chapter 1: Java Building Blocks (23 questions)
- Chapter 2: Operators and Statements (20 questions)
- Chapter 3: Core Java APIs (33 questions)
- Chapter 4: Methods and Encapsulation (29 questions)
- Chapter 5: Class Design (20 questions)
- Chapter 6: Exceptions (20 questions)
Outputs: scratch/export_oca_java_questions.csv
"""

import os
import csv

from oca_assessment import assessment_questions
from oca_ch1 import ch1_questions
from oca_ch2 import ch2_questions
from oca_ch3 import ch3_questions
from oca_ch4 import ch4_questions
from oca_ch5 import ch5_questions
from oca_ch6 import ch6_questions

SCRATCH_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_CSV = os.path.join(SCRATCH_DIR, "export_oca_java_questions.csv")

all_groups = [
    ("Assessment Test", assessment_questions),
    ("Chapter 1: Java Building Blocks", ch1_questions),
    ("Chapter 2: Operators and Statements", ch2_questions),
    ("Chapter 3: Core Java APIs", ch3_questions),
    ("Chapter 4: Methods and Encapsulation", ch4_questions),
    ("Chapter 5: Class Design", ch5_questions),
    ("Chapter 6: Exceptions", ch6_questions),
]

fields = [
    "id",
    "topic",
    "difficulty",
    "questionText",
    "codeSnippet",
    "optionA",
    "optionB",
    "optionC",
    "optionD",
    "correctOption",
    "explanation"
]

def main():
    q_index = 1
    rows = []

    for group_name, group_list in all_groups:
        print(f"Loading {group_name}: {len(group_list)} questions")
        for item in group_list:
            q_id = f"java-oca-{q_index:04d}"
            q_index += 1
            row = {
                "id": q_id,
                "topic": item["topic"],
                "difficulty": item["difficulty"],
                "questionText": item["questionText"],
                "codeSnippet": item.get("codeSnippet", "").strip(),
                "optionA": item["optionA"],
                "optionB": item["optionB"],
                "optionC": item["optionC"],
                "optionD": item["optionD"],
                "correctOption": item["correctOption"],
                "explanation": item["explanation"].strip()
            }
            rows.append(row)

    print(f"\nTotal questions prepared: {len(rows)}")

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Successfully wrote {len(rows)} questions to {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
