import json
import re
import sys
import os

sys.path.append('scratch')
from scenarios_junior import JUNIOR_SCENARIOS
from scenarios_mid import MID_SCENARIOS
from scenarios_senior import SENIOR_SCENARIOS
from scenarios_staff import STAFF_SCENARIOS

all_new = JUNIOR_SCENARIOS + MID_SCENARIOS + SENIOR_SCENARIOS + STAFF_SCENARIOS
print(f"Total new scenarios to add: {len(all_new)}")

target_file = "src/data/sqlOptimizerScenariosData.ts"
with open(target_file, "r") as f:
    content = f.read()

# Verify existing file has original scenarios
assert "orders_composite_index" in content
assert "audit_log_antipattern_partitioning" in content

# Find the end of SQL_OPTIMIZER_SCENARIOS array: the last "];"
last_bracket_idx = content.rfind("];")
if last_bracket_idx == -1:
    raise ValueError("Could not find closing ]; in file")

prefix = content[:last_bracket_idx].rstrip()
# If prefix ends with "}", add a comma
if not prefix.endswith(","):
    prefix += ","

# Now format the 100 new scenarios
new_scenarios_code = []
for idx, sc in enumerate(all_new, start=14):
    sc_json = json.dumps(sc, indent=2)
    # indent sc_json with 2 spaces for each line
    indented = "\n".join("  " + line for line in sc_json.split("\n"))
    comment = f"  // ── Scenario {idx}: {sc['title']} ({sc['difficulty']}) ──\n"
    new_scenarios_code.append(comment + indented)

combined_new_code = ",\n\n".join(new_scenarios_code)

output_content = prefix + "\n\n" + combined_new_code + ",\n];\n"

with open(target_file, "w") as f:
    f.write(output_content)

print(f"Successfully wrote {target_file} with 113 total scenarios!")
