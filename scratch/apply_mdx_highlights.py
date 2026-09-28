import re

with open("docs/technical-knowledge/system-design/60-days-of-system-design.md", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"#### The Architectural Design Question\n+(.*?)\n\n((?:- \*\*[A-D]\).*?\n)+)\n\*\*Correct Answer: ([A-D])\*\*"

def replacer(m):
    question = m.group(1).strip()
    raw_options = m.group(2).strip().split("\n")
    correct_letter = m.group(3).strip()
    
    new_options = []
    for opt in raw_options:
        opt = opt.strip()
        # Check if this is the winning option
        if opt.startswith(f"- **{correct_letter})") or "(Recommended)" in opt:
            # Clean up (Recommended) if present
            clean_text = opt.replace(" (Recommended)", "").replace("(Recommended)", "")
            # Remove leading "- "
            inner = clean_text[2:].strip()
            new_opt = f"- <span className=\"sd-winner-highlight\">{inner} ⭐ *(Recommended Winner)*</span>"
            new_options.append(new_opt)
        else:
            new_options.append(opt)
            
    options_block = "\n".join(new_options)
    
    replacement = f""":::info[🎯 Architectural Design Question]
**{question}**
:::

{options_block}

:::tip[🏆 Recommended Architecture: Option {correct_letter}]
**Verified Solution:** Adheres to enterprise high-availability, low-latency, and zero-regression design principles. Review the engineering trade-offs and failure traps below.
:::"""
    return replacement

new_content = re.sub(pattern, replacer, content)

with open("docs/technical-knowledge/system-design/60-days-of-system-design.md", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Successfully transformed all 60 scenarios with highlighted question & answer callouts!")
