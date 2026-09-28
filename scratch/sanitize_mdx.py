#!/usr/bin/env python3
import re

file_path = "/Users/lukhuong/Desktop/docusaurus-knowledge-base-template/docs/technical-knowledge/system-design/60-days-of-system-design.md"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace patterns like "<50ms" with "< 50ms" or "`<50ms`"
# Specifically in math or text:
# \le, \ge, or `< 50ms`
text = re.sub(r'<(\d+)', r'< \1', text)
text = re.sub(r'\$(\s*)[<](\s*)', r'\\le ', text)
text = re.sub(r'\$(\s*)[>](\s*)', r'\\ge ', text)

# Also check for any <word that is not SystemDesign60DaysDiagram
# E.g. <50ms -> &lt;50ms or < 50ms
text = text.replace("<50ms", "< 50ms")
text = text.replace("<2ms", "< 2ms")
text = text.replace("<1ms", "< 1ms")
text = text.replace("<5ms", "< 5ms")
text = text.replace("<10ms", "< 10ms")
text = text.replace("<15ms", "< 15ms")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Sanitized MDX tags in 60-days-of-system-design.md")
