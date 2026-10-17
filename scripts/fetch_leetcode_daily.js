/**
 * scripts/fetch_leetcode_daily.js
 * Native Node.js fetcher for LeetCode daily challenge.
 * Zero external dependencies (uses native fetch in Node 18+).
 * Falls back gracefully to the existing problem or default if offline/network error.
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'leetcode-daily-problem.json');

const FALLBACK_PROBLEM = {
  id: '1',
  title: 'Two Sum',
  url: 'https://leetcode.com/problems/two-sum/',
  difficulty: 'easy',
  topic: 'Array, Hash Table',
  keyIdea: 'Find two numbers in an array that add up to a specific target.',
};

async function fetchLeetCodeDaily() {
  const url = 'https://leetcode.com/graphql';
  const query = `
    query questionOfToday {
      activeDailyCodingChallengeQuestion {
        date
        link
        question {
          questionFrontendId
          title
          difficulty
          topicTags {
            name
          }
        }
      }
    }
  `;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (response.ok) {
      const data = await response.json();
      const challenge = data?.data?.activeDailyCodingChallengeQuestion;
      if (challenge && challenge.question) {
        const q = challenge.question;
        const tags = (q.topicTags || []).map((t) => t.name).filter(Boolean);
        const dailyData = {
          id: String(q.questionFrontendId || '0'),
          title: String(q.title || 'Unknown Title'),
          url: `https://leetcode.com${challenge.link || ''}`,
          difficulty: String(q.difficulty || 'medium').toLowerCase(),
          topic: tags.length > 0 ? tags.join(', ') : 'General',
          keyIdea: `Official LeetCode Daily Challenge for ${challenge.date || 'today'}.`,
        };

        if (!fs.existsSync(OUTPUT_DIR)) {
          fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dailyData, null, 2), 'utf8');
        console.log(`✔ Successfully fetched LeetCode Daily: ${dailyData.title} (ID: ${dailyData.id})`);
        return;
      }
    }
  } catch (err) {
    // Network offline, sandbox, or DNS error
  }

  // Preserve existing file if available, otherwise write fallback
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (fs.existsSync(OUTPUT_PATH)) {
    console.log(`ℹ Network fetch unavailable. Preserving existing LeetCode Daily at ${OUTPUT_PATH}`);
  } else {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(FALLBACK_PROBLEM, null, 2), 'utf8');
    console.log(`ℹ Network fetch unavailable. Initialized fallback LeetCode Daily at ${OUTPUT_PATH}`);
  }
}

fetchLeetCodeDaily().catch((err) => {
  console.warn('Non-fatal error in fetchLeetCodeDaily:', err.message);
});
