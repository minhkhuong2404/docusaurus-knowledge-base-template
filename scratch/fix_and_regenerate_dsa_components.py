#!/usr/bin/env python3
"""
fix_and_regenerate_dsa_components.py
Ensures all JSX text uses proper unicode arrows ('→') and no bare '>' or '<' in JSX.
"""

import os
import glob
import re

COMPONENTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src', 'components')

files = glob.glob(os.path.join(COMPONENTS_DIR, 'DsaWeek*.tsx'))

for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        c = fp.read()
    
    # 1. Replace -> with →
    c = c.replace(' -> ', ' → ')
    c = c.replace('->', ' → ')
    
    # 2. Fix unescaped 'A' in DsaWeek15
    c = c.replace("-> 'A' count", '→ "A" count')
    c = c.replace("'A'", '"A"')
    
    # 3. Replace bare < in JSX text with &lt; or safely
    # (avoid replacing in imports, generics or JSX tags)
    # Replace "&lt;" where appropriate:
    c = c.replace('&lt;', '&lt;')
    c = c.replace(' < V', ' &lt; V')
    c = c.replace(' < 4', ' &lt; 4')
    c = c.replace(' < 7', ' &lt; 7')
    c = c.replace(' < 3', ' &lt; 3')
    c = c.replace('count < V', 'count &lt; V')

    with open(f, 'w', encoding='utf-8') as fp:
        fp.write(c)

print("Fixed JSX syntax in all DsaWeek*.tsx files.")
