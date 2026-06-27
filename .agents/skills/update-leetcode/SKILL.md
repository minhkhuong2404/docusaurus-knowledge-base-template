---
name: update-leetcode-questions
description: Automatically pull updates and regenerate company-wise LeetCode interview question markdown tables from the cloned Desktop repository
---

# Skill: Update LeetCode Questions

This skill provides step-by-step instructions on how to keep the LeetCode companywise questions in sync with the upstream repository.

## Triggering the Skill
Use this skill when:
- The user requests updating the LeetCode company-wise questions.
- Obsolete company questions need to be cleaned up.
- New company questions need to be imported.

## Execution Steps
1. Make sure the source repository is cloned to `/Users/lukhuong/Desktop/leetcode-companywise-interview-questions`.
2. Execute the python script:
   ```bash
   python scratch/update_leetcode_questions.py
   ```
   This script will automatically:
   - Perform a `git pull` on the branch of the cloned repository on the Desktop.
   - Match existing capitalization of companies from the existing workspace files.
   - Generate updated markdown tables in `docs/technical-knowledge/dsa/leetcode-companywise/`.
   - Delete company markdown files that are no longer part of the cloned repository snapshot.
3. Validate by running a local Docusaurus build:
   ```bash
   npm run build
   ```
