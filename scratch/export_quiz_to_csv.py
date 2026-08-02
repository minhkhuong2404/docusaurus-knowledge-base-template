#!/usr/bin/env python3
import os
import json
import csv
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH_DIR = os.path.join(BASE_DIR, 'scratch')

FILES = [
    {
        "name": "Java",
        "inputPath": os.path.join(BASE_DIR, "src", "data", "java-quiz-questions.ts"),
        "outputPath": os.path.join(SCRATCH_DIR, "export_java_questions.csv")
    },
    {
        "name": "Spring Boot",
        "inputPath": os.path.join(BASE_DIR, "src", "data", "spring-boot-quiz-questions.ts"),
        "outputPath": os.path.join(SCRATCH_DIR, "export_spring_boot_questions.csv")
    },
    {
        "name": "System Design",
        "inputPath": os.path.join(BASE_DIR, "src", "data", "system-design-quiz-questions.ts"),
        "outputPath": os.path.join(SCRATCH_DIR, "export_system_design_questions.csv")
    }
]

ALL_OUTPUT_PATH = os.path.join(SCRATCH_DIR, "export_all_quiz_questions.csv")

INDEX_TO_LETTER = {0: 'A', 1: 'B', 2: 'C', 3: 'D'}

def extract_questions_from_ts(file_path):
    if not os.path.exists(file_path):
        print(f"[Export Warning] File not found: {file_path}")
        return []
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r"=\s*(\[.*\]);", content, re.DOTALL)
    if not match:
        print(f"[Export Error] Could not find JSON array in {file_path}")
        return []
    
    try:
        return json.loads(match.group(1))
    except Exception as e:
        print(f"[Export Error] Failed to parse JSON in {file_path}: {e}")
        return []

def write_questions_to_csv(questions, csv_path):
    headers = [
        'id', 'topic', 'difficulty', 'questionText', 'codeSnippet',
        'optionA', 'optionB', 'optionC', 'optionD', 'correctOption', 'explanation'
    ]
    
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        for q in questions:
            q_id = q.get('id', '')
            q_topic = q.get('topic', '')
            q_diff = q.get('difficulty', 'medium')
            q_text = q.get('questionText', '')
            q_code = q.get('codeSnippet', '')
            
            options = q.get('options', [])
            opt_a = options[0] if len(options) > 0 else ''
            opt_b = options[1] if len(options) > 1 else ''
            opt_c = options[2] if len(options) > 2 else ''
            opt_d = options[3] if len(options) > 3 else ''
            
            correct_idx = q.get('correctOptionIndex', 0)
            correct_letter = INDEX_TO_LETTER.get(correct_idx, 'A')
            
            explanation = q.get('explanation', '')
            
            writer.writerow([
                q_id, q_topic, q_diff, q_text, q_code,
                opt_a, opt_b, opt_c, opt_d, correct_letter, explanation
            ])

def main():
    all_questions = []
    total_count = 0

    print("=" * 60)
    print("Exporting Current Website Quiz Questions to CSV files...")
    print("=" * 60)

    for item in FILES:
        name = item['name']
        input_path = item['inputPath']
        output_path = item['outputPath']
        
        questions = extract_questions_from_ts(input_path)
        if questions:
            write_questions_to_csv(questions, output_path)
            print(f"✓ [{name}] Exported {len(questions)} questions -> {os.path.basename(output_path)}")
            all_questions.extend(questions)
            total_count += len(questions)

    if all_questions:
        write_questions_to_csv(all_questions, ALL_OUTPUT_PATH)
        print(f"✓ [ALL TOPICS COMBINED] Exported {total_count} total questions -> {os.path.basename(ALL_OUTPUT_PATH)}")

    print("=" * 60)
    print("Done! CSV files generated in scratch/ directory.")
    print("You can now open these CSV files and import/paste them into Google Sheets.")
    print("=" * 60)

if __name__ == '__main__':
    main()
