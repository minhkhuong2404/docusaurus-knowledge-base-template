import re

with open("docs/technical-knowledge/system-design/60-days-of-system-design.md", "r", encoding="utf-8") as f:
    content = f.read()

# Pattern for question block:
# #### The Architectural Design Question\n(.*?)\n\n
# - **A)...
# ...
# **Correct Answer: ([A-D])**

pattern = r"#### The Architectural Design Question\n+(.*?)\n\n((?:- \*\*[A-D]\).*?\n)+)\n\*\*Correct Answer: ([A-D])\*\*"

matches = list(re.finditer(pattern, content))
print(f"Total question/answer blocks matched: {len(matches)}")

if len(matches) > 0:
    m = matches[0]
    print("Sample match:")
    print("Question:", m.group(1))
    print("Options:\n", m.group(2))
    print("Answer:", m.group(3))
