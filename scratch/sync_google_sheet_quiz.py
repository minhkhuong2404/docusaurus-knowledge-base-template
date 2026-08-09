#!/usr/bin/env python3
import os
import sys
import json
import csv
import io
import urllib.request
import urllib.parse

# Path constants
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(BASE_DIR, 'scratch', 'quiz_config.json')

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[Quiz Sync Warning] Could not load {CONFIG_PATH}: {e}")
    return {
        "spreadsheetId": "",
        "tabs": {
            "Java": {
                "targetFile": "src/data/java-quiz-questions.ts",
                "exportVarName": "javaQuestions",
                "sheetNameNames": ["Java", "java", "JAVA"]
            },
            "SpringBoot": {
                "targetFile": "src/data/spring-boot-quiz-questions.ts",
                "exportVarName": "springBootQuestions",
                "sheetNameNames": ["Spring Boot", "SpringBoot", "spring-boot"]
            },
            "SystemDesign": {
                "targetFile": "src/data/system-design-quiz-questions.ts",
                "exportVarName": "systemDesignQuestions",
                "sheetNameNames": ["System Design", "SystemDesign", "system-design"]
            }
        }
    }

def normalize_key(key):
    return key.strip().lower().replace(' ', '').replace('_', '').replace('-', '')

def parse_correct_option(val):
    val_str = str(val).strip().upper()
    mapping = {
        'A': 0, 'B': 1, 'C': 2, 'D': 3,
        '0': 0, '1': 1, '2': 2, '3': 3,
        'OPTIONA': 0, 'OPTIONB': 1, 'OPTIONC': 2, 'OPTIOND': 3,
        'OPTION1': 0, 'OPTION2': 1, 'OPTION3': 2, 'OPTION4': 3
    }
    if val_str in mapping:
        return mapping[val_str]
    try:
        idx = int(val_str)
        if 1 <= idx <= 4:
            return idx - 1
        if 0 <= idx <= 3:
            return idx
    except ValueError:
        pass
    return 0

def fetch_csv_from_url(url):
    if url.startswith('file://') or (not url.startswith('http://') and not url.startswith('https://') and os.path.exists(url)):
        file_path = url.replace('file://', '')
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=12) as response:
        content = response.read().decode('utf-8')
        return content

def fetch_sheet_tab_csv(spreadsheet_id, sheet_name):
    encoded_name = urllib.parse.quote(sheet_name)
    urls = [
        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/gviz/tq?tqx=out:csv&sheet={encoded_name}",
        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&sheet={encoded_name}",
        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/pub?output=csv&sheet={encoded_name}"
    ]
    for url in urls:
        try:
            content = fetch_csv_from_url(url)
            if content and len(content.strip()) > 0 and not content.strip().startswith('<!DOCTYPE html>'):
                return content
        except Exception:
            continue
    return ""

def parse_questions_from_csv(csv_text, default_topic="General"):
    if not csv_text or not csv_text.strip():
        return []
        
    reader = csv.reader(io.StringIO(csv_text))
    rows = list(reader)
    if not rows:
        return []

    header = [normalize_key(cell) for cell in rows[0]]
    
    col_map = {}
    for idx, name in enumerate(header):
        if name in ('id', 'qid', 'questionid'):
            col_map['id'] = idx
        elif name in ('topic', 'category', 'subtopic'):
            col_map['topic'] = idx
        elif name in ('difficulty', 'level'):
            col_map['difficulty'] = idx
        elif name in ('questiontext', 'question', 'prompt', 'questionprompt'):
            col_map['questionText'] = idx
        elif name in ('codesnippet', 'code', 'snippet', 'codeblock'):
            col_map['codeSnippet'] = idx
        elif name in ('optiona', 'option1', 'a', 'choicea', 'choice1'):
            col_map['optionA'] = idx
        elif name in ('optionb', 'option2', 'b', 'choiceb', 'choice2'):
            col_map['optionB'] = idx
        elif name in ('optionc', 'option3', 'c', 'choicec', 'choice3'):
            col_map['optionC'] = idx
        elif name in ('optiond', 'option4', 'd', 'choiced', 'choice4'):
            col_map['optionD'] = idx
        elif name in ('correctoption', 'correctoptionindex', 'answer', 'correct', 'correctanswer'):
            col_map['correctOption'] = idx
        elif name in ('explanation', 'explain', 'solution', 'details'):
            col_map['explanation'] = idx

    questions = []
    for r_idx, row in enumerate(rows[1:], start=1):
        if not row or not any(row):
            continue

        def get_val(key, default=""):
            if key in col_map and col_map[key] < len(row):
                return row[col_map[key]].strip()
            return default

        q_id = get_val('id', f"q-{r_idx}")
        q_topic = get_val('topic', default_topic)
        q_diff = get_val('difficulty', 'medium').lower()
        if q_diff not in ('easy', 'medium', 'hard'):
            q_diff = 'medium'
            
        q_text = get_val('questionText')
        if not q_text:
            continue

        q_code = get_val('codeSnippet')
        opt_a = get_val('optionA')
        opt_b = get_val('optionB')
        opt_c = get_val('optionC')
        opt_d = get_val('optionD')
        
        options = [opt_a, opt_b, opt_c, opt_d]
        if not any(options):
            continue

        correct_raw = get_val('correctOption', 'A')
        correct_idx = parse_correct_option(correct_raw)
        explanation = get_val('explanation', 'No detailed explanation provided.')

        item = {
            "id": q_id,
            "topic": q_topic,
            "difficulty": q_diff,
            "questionText": q_text,
            "options": options,
            "correctOptionIndex": correct_idx,
            "explanation": explanation
        }
        if q_code:
            item["codeSnippet"] = q_code

        questions.append(item)

    return questions

def generate_typescript_file(questions, export_var_name):
    ts_code = f"""export interface QuizQuestion {{
  id: string;
  topic: string;
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}}

export const {export_var_name}: QuizQuestion[] = {json.dumps(questions, indent=2)};
"""
    return ts_code

def main():
    config = load_config()
    
    spreadsheet_id = os.environ.get('GOOGLE_SHEET_ID', '').strip() or config.get('spreadsheetId', '').strip()
    
    if not spreadsheet_id:
        print("[Quiz Sync] No GOOGLE_SHEET_ID configured in env or quiz_config.json.")
        print("[Quiz Sync] Preserving existing local quiz data files.")
        return

    tabs_config = config.get('tabs', {})
    synced_count = 0
    permission_issue = False

    for key, tab_info in tabs_config.items():
        target_rel_path = tab_info.get('targetFile')
        export_var_name = tab_info.get('exportVarName')
        sheet_names = tab_info.get('sheetNameNames', [key])
        custom_csv_url = tab_info.get('csvUrl', '').strip()

        target_abs_path = os.path.join(BASE_DIR, target_rel_path)
        
        questions = []
        fetched_successfully = False

        if custom_csv_url:
            try:
                csv_data = fetch_csv_from_url(custom_csv_url)
                questions = parse_questions_from_csv(csv_data, default_topic=key)
                if questions:
                    fetched_successfully = True
            except Exception as e:
                print(f"[Quiz Sync Warning] Failed to fetch from custom URL for {key}: {e}")

        if not fetched_successfully:
            for s_name in sheet_names:
                try:
                    csv_data = fetch_sheet_tab_csv(spreadsheet_id, s_name)
                    if csv_data:
                        questions = parse_questions_from_csv(csv_data, default_topic=key)
                        if questions:
                            fetched_successfully = True
                            break
                    else:
                        permission_issue = True
                except Exception:
                    continue

        if fetched_successfully and questions:
            ts_content = generate_typescript_file(questions, export_var_name)
            os.makedirs(os.path.dirname(target_abs_path), exist_ok=True)
            with open(target_abs_path, 'w', encoding='utf-8') as f:
                f.write(ts_content)
            print(f"[Quiz Sync Success] Synced {len(questions)} questions for '{key}' -> {target_rel_path}")
            synced_count += 1
        else:
            print(f"[Quiz Sync Notice] Could not fetch valid questions for tab '{key}'. Preserved {target_rel_path}.")

    if permission_issue and synced_count == 0:
        print("\n" + "=" * 70)
        print("💡 [Google Sheets Access Helper]")
        print(f"Spreadsheet ID: {spreadsheet_id}")
        print("Google returned 0 bytes or access restricted. To allow syncing:")
        print("1. Open your Google Sheet in browser.")
        print("2. Click 'Share' (top-right) -> Change access to 'Anyone with the link' (Viewer).")
        print("3. Alternatively, click File -> Share -> Publish to web -> Click Publish.")
        print("=" * 70 + "\n")

    print(f"[Quiz Sync Complete] Total categories synced: {synced_count}/{len(tabs_config)}")

if __name__ == '__main__':
    main()
