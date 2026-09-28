#!/usr/bin/env python3
import json
from build_60_days_scenarios import DAYS as DAYS_P1
from build_60_days_scenarios_p2 import DAYS_P2

ALL_DAYS = DAYS_P1 + DAYS_P2

data_file = "/Users/lukhuong/Desktop/docusaurus-knowledge-base-template/src/data/systemDesign60DaysData.ts"

ts_content = []
ts_content.append("""// Complete 60 Days of System Design Structured Dataset

export interface ScenarioOption {
  key: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface DayScenarioData {
  day: number;
  moduleId: number;
  title: string;
  focus: string;
  scenario: string;
  question: string;
  correctOption: string;
  options: ScenarioOption[];
  summary: string;
  docLink: string;
}

export const SYSTEM_DESIGN_60_DAYS: DayScenarioData[] = [
""")

for d in ALL_DAYS:
    day = d['day']
    module_id = d.get('module', 1)
    if day <= 8:
        module_id = 1
    elif day <= 16:
        module_id = 2
    elif day <= 24:
        module_id = 3
    elif day <= 32:
        module_id = 4
    elif day <= 40:
        module_id = 5
    elif day <= 50:
        module_id = 6
    else:
        module_id = 7

    title = d['title'].replace("'", "\\'")
    # Extract focus from title if available or default
    focus = "Architecture & Scalability"
    if "(" in d['title'] and ")" in d['title']:
        focus = d['title'].split("(")[1].split(")")[0].replace("'", "\\'")
    
    scenario_text = d['scenario'].replace("'", "\\'").replace("\n", " ")
    question_text = d['question'].replace("'", "\\'").replace("\n", " ")
    correct_opt = d['correct']
    
    # Extract first sentence of deep dive as summary
    deep_lines = [l.strip() for l in d['deep_dive'].split("\n") if l.strip().startswith("- **Why") or l.strip().startswith("- **")]
    summary = "Enforce verified architectural patterns and avoid single-point failure modes."
    if deep_lines:
        summary = deep_lines[0].replace("- **", "").replace("**", "").replace("'", "\\'")
    
    # Options array
    opts_json = []
    for opt_k, opt_t, is_c, expl in d['options']:
        opt_t_clean = opt_t.replace("'", "\\'")
        expl_clean = expl.replace("'", "\\'")
        opts_json.append(f"      {{ key: '{opt_k}', text: '{opt_t_clean}', isCorrect: {str(is_c).lower()}, explanation: '{expl_clean}' }}")
    
    opts_str = ",\n".join(opts_json)
    
    doc_link = d['links'].split("](")[1].split(")")[0] if "](" in d['links'] else "/technical-knowledge/system-design/intro"

    ts_content.append(f"""  {{
    day: {day},
    moduleId: {module_id},
    title: '{title}',
    focus: '{focus}',
    scenario: '{scenario_text}',
    question: '{question_text}',
    correctOption: '{correct_opt}',
    options: [
{opts_str}
    ],
    summary: '{summary}',
    docLink: '{doc_link}'
  }},""")

ts_content.append("];\n")

with open(data_file, "w", encoding="utf-8") as f:
    f.write("\n".join(ts_content))

print(f"Successfully generated {data_file} with {len(ALL_DAYS)} scenarios.")
