import csv
import json
import uuid
import re
import sys
from typing import List, Tuple, Dict, Set

# --- Configuration ---
CSV_FILE_PATH = 'leetcode_dataset - lc.csv'
SQL_OUTPUT_FILE = 'seed.sql'
MAX_QUESTIONS = 20  # None = process all, or set a number for testing
CREATED_BY = '00000000-0000-0000-0000-000000000000'  # Default creator for seeded questions

# --- Helper functions (Unchanged) ---

def parse_description(full_text: str) -> Tuple[str, List[str], List[str]]:
    """Splits description into main part, examples, and constraints."""
    if not isinstance(full_text, str):
        return "", [], []
    
    # 1. Capture Constraints (start from "Constraints:" to end)
    constraints_match = re.search(r"Constraints:\s*(.*?)$", full_text, re.DOTALL)
    constraints = []
    if constraints_match:
        constraints_text = constraints_match.group(1).strip()
        # Split constraints by newline or bullet point format, ensuring clean lines
        constraints = [c.strip() for c in constraints_text.split('\n') if c.strip()]
        
        # Remove constraints text from the main body for cleaner processing
        full_text = full_text[:constraints_match.start()].strip()
    
    # 2. Capture Examples (start from "Example 1:" backward)
    examples_match = re.search(r"(Example \d+:.+)", full_text, re.DOTALL)
    examples = []
    main_desc = full_text
    
    if examples_match:
        examples_text_block = examples_match.group(0).strip()
        
        # Separate the main description from the examples block
        main_desc = full_text[:examples_match.start()].strip()

        # Split the examples block into individual examples
        # Use a lookahead to split just before the next "Example N:"
        examples_raw = re.split(r'(?=Example \d+:)', examples_text_block)
        
        # Clean up empty strings or the initial split artifact
        examples = [ex.strip() for ex in examples_raw if ex.strip()]
        
    return main_desc, examples, constraints
def escape_sql_string(text: str) -> str:
    """Escape single quotes for SQL and handle None values."""
    if text is None:
        return ''
    # Use str(text) to handle cases where text might be a numeric or other type passed unexpectedly
    return str(text).replace("'", "''")

def parse_topics_from_string(topics_str: str) -> List[str]:
    """Parses a string from the CSV into a clean list of topics."""
    if not isinstance(topics_str, str):
        return []
    if topics_str.startswith('['):
        topics_str = topics_str.strip('[]')
    # Use '\"' as well to handle quoted strings like "Hash Table"
    topics = [topic.strip().strip("'\"") for topic in topics_str.split(',') if topic.strip()]
    return [t for t in topics if t]

# --- Core Functions (Corrected for Normalization) ---

def generate_sql_for_row(
    row: Dict,
    normalization_map: Dict[str, str],
    processed_topics: Set[str]
) -> str:
    """Generates all SQL statements for a single question row, applying topic normalization."""
    title = row.get('title', '').strip()
    full_description = row.get('description', '').strip()
    difficulty = row.get('difficulty', 'Easy').strip()
    topics_str = row.get('related_topics', '')
    
    if not title or not full_description:
        return ""

    question_id = str(uuid.uuid4())
    main_desc, examples, constraints = parse_description(full_description)
    
    # 1. APPLY NORMALIZATION AND DEDUPLICATION
    topics_list_raw = parse_topics_from_string(topics_str)
    
    # Apply normalization map: use the plural mapped value if it exists (e.g., 'Array' -> 'Arrays'), 
    # otherwise use the topic itself. Use a set to ensure uniqueness for this question's topics.
    topics_set_normalized = {normalization_map.get(t, t) for t in topics_list_raw}
    topics_list_normalized = sorted(list(topics_set_normalized)) 
    
    testcases = examples # Assuming examples are used as initial test cases
    
    title_escaped = escape_sql_string(title)
    desc_escaped = escape_sql_string(main_desc)
    difficulty_escaped = escape_sql_string(difficulty)
    
    examples_json = json.dumps(examples, ensure_ascii=False).replace("'", "''")
    constraints_json = json.dumps(constraints, ensure_ascii=False).replace("'", "''")
    testcases_json = json.dumps(testcases, ensure_ascii=False).replace("'", "''")
    
    sql_parts = [f"-- ========= QUESTION: {title} =========\n"]
    sql_parts.append(
        f'INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES\n'
        f"('{question_id}', '{title_escaped}', '{desc_escaped}', '{difficulty_escaped}', "
        f"'{examples_json}'::jsonb, '{constraints_json}'::jsonb, '{testcases_json}'::jsonb, '{CREATED_BY}');"
    )
    
    # 2. INSERT NORMALIZED TOPICS
    if topics_list_normalized:
        for topic in topics_list_normalized:
            # Insert the topic into the 'topics' table once (using ON CONFLICT for safety)
            if topic not in processed_topics:
                topic_escaped = escape_sql_string(topic)
                # Note: This inserts the PLURAL/NORMALIZED form
                sql_parts.append(f'INSERT INTO "topics" (topic_name) VALUES (\'{topic_escaped}\') ON CONFLICT (topic_name) DO NOTHING;')
                processed_topics.add(topic)
        
        # 3. LINK QUESTION TO NORMALIZED TOPICS
        # Use the normalized topic names for the join table (question_topics)
        values = [f"('{question_id}', '{escape_sql_string(topic)}')" for topic in topics_list_normalized]
        values_str = ",\n    ".join(values)
        sql_parts.append(f'INSERT INTO "question_topics" (question_id, topic_name) VALUES\n    {values_str};')
        
    return "\n".join(sql_parts)

def main():
    """Main seeding function."""
    print(f"📖 Reading CSV file: {CSV_FILE_PATH}")

    try:
        all_topics = set()
        # Read all raw topics first
        with open(CSV_FILE_PATH, 'r', encoding='utf-8') as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                for topic in parse_topics_from_string(row.get('related_topics', '')):
                    all_topics.add(topic)
        
        # --- Build Normalization Map ---
        normalization_map = {}
        all_topics_set = all_topics
        
        for topic in sorted(list(all_topics)):
            if topic.endswith('s'):
                plural = topic
                singular = plural[:-1]
                
                # If both singular and plural exist, map singular -> plural
                if singular in all_topics_set:
                    normalization_map[singular] = plural
        
        # --- NEW STEP: Enforce manual/irregular normalization rules ---
        # Add explicit rules that the 's' logic misses or reverses.
        # This overrides any default mappings if necessary.
        normalization_map['Math'] = 'Maths'
        normalization_map['String'] = 'Strings'
        normalization_map['Array'] = 'Arrays'
        normalization_map['Linked List'] = 'Linked Lists'
        normalization_map['Hash Table'] = 'Hash Tables'

        # --- Generate Final Set of Unique, Normalized Topics for Insertion ---
        normalized_topics_to_insert = set()
        for topic in all_topics:
            # Apply the map: if a topic (like 'Array') is in the map, use the mapped value ('Arrays').
            # Otherwise, use the topic itself ('Two Pointers').
            normalized_topics_to_insert.add(normalization_map.get(topic, topic))
        
        print(f"🔍 Analysis complete. Found {len(all_topics)} unique raw topics.")
        print(f"🛠️  Created {len(normalization_map)} normalization rules.")
        print(f"📝 Final unique topics to insert: {len(normalized_topics_to_insert)}")
        
    except FileNotFoundError:
        print(f"❌ Error: CSV file '{CSV_FILE_PATH}' not found!")
        sys.exit(1)

    # --- Rest of main() function begins here ---
    processed_topics = set() # This set is now redundant but kept for structure
    question_count = 0
    skipped_count = 0

    print(f"📝 Generating SQL file: {SQL_OUTPUT_FILE}")
    if MAX_QUESTIONS:
        print(f"⚠️  Processing up to {MAX_QUESTIONS} questions")
    print("-" * 60)
    
    try:
        with open(SQL_OUTPUT_FILE, 'w', encoding='utf-8') as sql_file:
            sql_file.write("-- Generated Question Seed Data\nBEGIN;\n\n")
            
            # 1. INSERT ALL NORMALIZED TOPICS FIRST (Guarantees existence)
            sql_file.write("-- --- Normalized Topic Insertion ---\n")
            for topic in sorted(list(normalized_topics_to_insert)):
                topic_escaped = escape_sql_string(topic)
                sql_file.write(f'INSERT INTO "topics" (topic_name) VALUES (\'{topic_escaped}\') ON CONFLICT (topic_name) DO NOTHING;\n')
            sql_file.write("\n")
            
            # 2. INSERT QUESTIONS AND LINK TABLES
            sql_file.write("-- --- Question and Link Table Insertion ---\n")
            with open(CSV_FILE_PATH, 'r', encoding='utf-8') as csv_file:
                reader = csv.DictReader(csv_file)
                for row in reader:
                    if MAX_QUESTIONS and question_count >= MAX_QUESTIONS:
                        break
                    
                    # Pass the normalization map but not the processed_topics set (as it's no longer needed for topic insertion)
                    sql_output = generate_sql_for_row(row, normalization_map, processed_topics) 
                    if sql_output:
                        sql_file.write(sql_output + "\n\n")
                        question_count += 1
                    else:
                        skipped_count += 1
            
            sql_file.write("COMMIT;\n")

    except Exception as e:
        print(f"❌ Unexpected error during generation pass: {str(e)}")
        sys.exit(1)

    print("-" * 60)
    print(f"✅ Done! Generated SQL for {question_count} questions.")
    if skipped_count > 0:
        print(f"⚠️  Skipped {skipped_count} rows due to missing data.")
    print(f"📁 Output file: {SQL_OUTPUT_FILE}")

if __name__ == "__main__":
    main()