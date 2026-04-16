import re

with open("src/pages/index.tsx", "r") as f:
    text = f.read()

def repl(m):
    val = float(m.group(1))
    new_val = val * 1.25
    # formatting nicely: drop .0 if not needed, round to 2 decimals
    new_str = f"{new_val:.2f}".rstrip("0").rstrip(".")
    # for inline
    if m.group(0).startswith('fontSize: "'):
        return f'fontSize: "{new_str}rem"'
    elif m.group(0).startswith('font-size: '):
        return f'font-size: {new_str}rem'
    else:
        # clamp
        return f"{new_str}rem"

# handle fontSize: "1.2rem"
text = re.sub(r'fontSize: "([0-9.]+)rem"', repl, text)

# handle font-size: 1.2rem;
text = re.sub(r'font-size: ([0-9.]+)rem', repl, text)

# clamp rem values specifically because they don't have "font-size" exactly before them always
text = re.sub(r'clamp\(([0-9.]+)rem, ([0-9.]+)vw, ([0-9.]+)rem\)', 
              lambda m: f"clamp({float(m.group(1))*1.25:.2f}rem, {float(m.group(2))*1.25:.2f}vw, {float(m.group(3))*1.25:.2f}rem)".replace(".00", ""), 
              text)

with open("src/pages/index.tsx", "w") as f:
    f.write(text)

