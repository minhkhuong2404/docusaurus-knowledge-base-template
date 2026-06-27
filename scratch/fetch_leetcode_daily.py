import requests
import json
import os

def fetch_leetcode_daily():
    url = "https://leetcode.com/graphql"
    payload = {
        "query": """
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
        """
    }
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            challenge = data.get('data', {}).get('activeDailyCodingChallengeQuestion', {})
            if challenge:
                question = challenge.get('question', {})
                link = challenge.get('link', '')
                full_url = f"https://leetcode.com{link}"
                
                # Combine tags into a string
                tags = [t.get('name') for t in question.get('topicTags', []) if t.get('name')]
                topic_str = ", ".join(tags) if tags else "General"
                
                daily_data = {
                    "id": question.get('questionFrontendId', '0'),
                    "title": question.get('title', 'Unknown Title'),
                    "url": full_url,
                    "difficulty": question.get('difficulty', 'Medium').lower(),
                    "topic": topic_str,
                    "keyIdea": f"Official LeetCode Daily Challenge for {challenge.get('date')}."
                }
                
                output_dir = "src/data"
                os.makedirs(output_dir, exist_ok=True)
                output_path = os.path.join(output_dir, "leetcode-daily-problem.json")
                
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(daily_data, f, indent=2)
                
                print(f"Successfully fetched LeetCode Daily: {daily_data['title']} (ID: {daily_data['id']})")
                return
    except Exception as e:
        print(f"Error fetching daily problem: {e}")
        
    # Fallback default if API fails
    print("API fetch failed or returned invalid data. Writing fallback.")
    fallback = {
        "id": "1",
        "title": "Two Sum",
        "url": "https://leetcode.com/problems/two-sum/",
        "difficulty": "easy",
        "topic": "Array, Hash Table",
        "keyIdea": "Find two numbers in an array that add up to a specific target."
    }
    output_path = "src/data/leetcode-daily-problem.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(fallback, f, indent=2)

if __name__ == "__main__":
    fetch_leetcode_daily()
