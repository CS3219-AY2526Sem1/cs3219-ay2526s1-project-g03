-- Generated Question Seed Data
BEGIN;

-- --- Normalized Topic Insertion ---
INSERT INTO "topics" (topic_name) VALUES ('Arrays') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Backtracking') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Binary Indexed Tree') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Binary Search') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Binary Search Tree') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Bit Manipulation') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Brainteaser') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Breadth-first Search') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Depth-first Search') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Dequeue') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Design') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Divide and Conquer') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Dynamic Programming') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Geometry') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Graph') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Greedy') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Hash Tables') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Heap') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Line Sweep') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Linked Lists') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Maths') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Meet in the Middle') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Memoization') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Minimax') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('OOP') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Ordered Map') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Queue') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Random') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Recursion') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Rejection Sampling') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Reservoir Sampling') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Rolling Hash') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Segment Tree') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Sliding Window') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Sort') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Stack') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Strings') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Suffix Array') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Topological Sort') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Tree') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Trie') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Two Pointers') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Union Find') ON CONFLICT (topic_name) DO NOTHING;

-- --- Question and Link Table Insertion ---
-- ========= QUESTION: Two Sum =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('73fbe00a-9fdd-4975-8cbb-b71eecd22de6', 'Two Sum', 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.', 'Easy', '["Example 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nOutput: Because nums[0] + nums[1] == 9, we return [0, 1].", "Example 2:\nInput: nums = [3,2,4], target = 6\nOutput: [1,2]", "Example 3:\nInput: nums = [3,3], target = 6\nOutput: [0,1]"]'::jsonb, '["`2 <= nums.length <= 103`", "`-109 <= nums[i] <= 109`", "`-109 <= target <= 109`", "Only one valid answer exists."]'::jsonb, '["Example 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nOutput: Because nums[0] + nums[1] == 9, we return [0, 1].", "Example 2:\nInput: nums = [3,2,4], target = 6\nOutput: [1,2]", "Example 3:\nInput: nums = [3,3], target = 6\nOutput: [0,1]"]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "topics" (topic_name) VALUES ('Arrays') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Hash Tables') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('73fbe00a-9fdd-4975-8cbb-b71eecd22de6', 'Arrays'),
    ('73fbe00a-9fdd-4975-8cbb-b71eecd22de6', 'Hash Tables');

-- ========= QUESTION: Add Two Numbers =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('58fcb071-bc68-4b7a-a6c8-f9d81614a88e', 'Add Two Numbers', 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.', 'Medium', '["Example 1:\nInput: l1 = [2,4,3], l2 = [5,6,4]\nOutput: [7,0,8]\nExplanation: 342 + 465 = 807.", "Example 2:\nInput: l1 = [0], l2 = [0]\nOutput: [0]", "Example 3:\nInput: l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]\nOutput: [8,9,9,9,0,0,0,1]"]'::jsonb, '["The number of nodes in each linked list is in the range `[1, 100]`.", "`0 <= Node.val <= 9`", "It is guaranteed that the list represents a number that does not have leading zeros."]'::jsonb, '["Example 1:\nInput: l1 = [2,4,3], l2 = [5,6,4]\nOutput: [7,0,8]\nExplanation: 342 + 465 = 807.", "Example 2:\nInput: l1 = [0], l2 = [0]\nOutput: [0]", "Example 3:\nInput: l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]\nOutput: [8,9,9,9,0,0,0,1]"]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "topics" (topic_name) VALUES ('Linked Lists') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Maths') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Recursion') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('58fcb071-bc68-4b7a-a6c8-f9d81614a88e', 'Linked Lists'),
    ('58fcb071-bc68-4b7a-a6c8-f9d81614a88e', 'Maths'),
    ('58fcb071-bc68-4b7a-a6c8-f9d81614a88e', 'Recursion');

-- ========= QUESTION: Longest Substring Without Repeating Characters =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('d19857ac-c17d-4974-a85f-6b7ecbc7ac68', 'Longest Substring Without Repeating Characters', 'Given a string `s`, find the length of the longest substring without repeating characters.', 'Medium', '["Example 1:\nInput: s = \"abcabcbb\"\nOutput: 3\nExplanation: The answer is \"abc\", with the length of 3.", "Example 2:\nInput: s = \"bbbbb\"\nOutput: 1\nExplanation: The answer is \"b\", with the length of 1.", "Example 3:\nInput: s = \"pwwkew\"\nOutput: 3\nExplanation: The answer is \"wke\", with the length of 3.\n\nNotice that the answer must be a substring, \"pwke\" is a subsequence and not a substring.", "Example 4:\nInput: s = \"\"\nOutput: 0"]'::jsonb, '["`0 <= s.length <= 5 * 104`", "`s` consists of English letters, digits, symbols and spaces."]'::jsonb, '["Example 1:\nInput: s = \"abcabcbb\"\nOutput: 3\nExplanation: The answer is \"abc\", with the length of 3.", "Example 2:\nInput: s = \"bbbbb\"\nOutput: 1\nExplanation: The answer is \"b\", with the length of 1.", "Example 3:\nInput: s = \"pwwkew\"\nOutput: 3\nExplanation: The answer is \"wke\", with the length of 3.\n\nNotice that the answer must be a substring, \"pwke\" is a subsequence and not a substring.", "Example 4:\nInput: s = \"\"\nOutput: 0"]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "topics" (topic_name) VALUES ('Sliding Window') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Strings') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Two Pointers') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('d19857ac-c17d-4974-a85f-6b7ecbc7ac68', 'Hash Tables'),
    ('d19857ac-c17d-4974-a85f-6b7ecbc7ac68', 'Sliding Window'),
    ('d19857ac-c17d-4974-a85f-6b7ecbc7ac68', 'Strings'),
    ('d19857ac-c17d-4974-a85f-6b7ecbc7ac68', 'Two Pointers');

-- ========= QUESTION: Median of Two Sorted Arrays =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('5dd3e9b8-cf63-416f-bf0e-62fc04a2e7f9', 'Median of Two Sorted Arrays', 'Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays.', 'Hard', '["Example 1:\nInput: nums1 = [1,3], nums2 = [2]\nOutput: 2.00000\nExplanation: merged array = [1,2,3] and median is 2.", "Example 2:\nInput: nums1 = [1,2], nums2 = [3,4]\nOutput: 2.50000\nExplanation: merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.", "Example 3:\nInput: nums1 = [0,0], nums2 = [0,0]\nOutput: 0.00000", "Example 4:\nInput: nums1 = [], nums2 = [1]\nOutput: 1.00000", "Example 5:\nInput: nums1 = [2], nums2 = []\nOutput: 2.00000"]'::jsonb, '["`nums1.length == m`", "`nums2.length == n`", "`0 <= m <= 1000`", "`0 <= n <= 1000`", "`1 <= m + n <= 2000`", "`-106 <= nums1[i], nums2[i] <= 106`", "Follow up: The overall run time complexity should be `O(log (m+n))`."]'::jsonb, '["Example 1:\nInput: nums1 = [1,3], nums2 = [2]\nOutput: 2.00000\nExplanation: merged array = [1,2,3] and median is 2.", "Example 2:\nInput: nums1 = [1,2], nums2 = [3,4]\nOutput: 2.50000\nExplanation: merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.", "Example 3:\nInput: nums1 = [0,0], nums2 = [0,0]\nOutput: 0.00000", "Example 4:\nInput: nums1 = [], nums2 = [1]\nOutput: 1.00000", "Example 5:\nInput: nums1 = [2], nums2 = []\nOutput: 2.00000"]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "topics" (topic_name) VALUES ('Binary Search') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "topics" (topic_name) VALUES ('Divide and Conquer') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('5dd3e9b8-cf63-416f-bf0e-62fc04a2e7f9', 'Arrays'),
    ('5dd3e9b8-cf63-416f-bf0e-62fc04a2e7f9', 'Binary Search'),
    ('5dd3e9b8-cf63-416f-bf0e-62fc04a2e7f9', 'Divide and Conquer');

-- ========= QUESTION: Longest Palindromic Substring =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('7e2e37b0-3a79-480d-8aa9-bdf0311eef64', 'Longest Palindromic Substring', 'Given a string `s`, return the longest palindromic substring in `s`.', 'Medium', '["Example 1:\nInput: s = \"babad\"\nOutput: \"bab\"\nNote: \"aba\" is also a valid answer.", "Example 2:\nInput: s = \"cbbd\"\nOutput: \"bb\"", "Example 3:\nInput: s = \"a\"\nOutput: \"a\"", "Example 4:\nInput: s = \"ac\"\nOutput: \"a\""]'::jsonb, '["`1 <= s.length <= 1000`", "`s` consist of only digits and English letters (lower-case and/or upper-case),"]'::jsonb, '["Example 1:\nInput: s = \"babad\"\nOutput: \"bab\"\nNote: \"aba\" is also a valid answer.", "Example 2:\nInput: s = \"cbbd\"\nOutput: \"bb\"", "Example 3:\nInput: s = \"a\"\nOutput: \"a\"", "Example 4:\nInput: s = \"ac\"\nOutput: \"a\""]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "topics" (topic_name) VALUES ('Dynamic Programming') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('7e2e37b0-3a79-480d-8aa9-bdf0311eef64', 'Dynamic Programming'),
    ('7e2e37b0-3a79-480d-8aa9-bdf0311eef64', 'Strings');

-- ========= QUESTION: ZigZag Conversion =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('ab4ba3ea-b033-44ef-8c80-c96f350ec543', 'ZigZag Conversion', 'The string `"PAYPALISHIRING"` is written in a zigzag pattern on a given number of rows like this: (you may want to display this pattern in a fixed font for better legibility)
P   A   H   N
A P L S I I G
Y   I   R
And then read line by line: `"PAHNAPLSIIGYIR"`
Write the code that will take a string and make this conversion given a number of rows:
string convert(string s, int numRows);', 'Medium', '["Example 1:\nInput: s = \"PAYPALISHIRING\", numRows = 3\nOutput: \"PAHNAPLSIIGYIR\"", "Example 2:\nInput: s = \"PAYPALISHIRING\", numRows = 4\nOutput: \"PINALSIGYAHRPI\"\nExplanation:\nP     I    N\nA   L S  I G\nY A   H R\nP     I", "Example 3:\nInput: s = \"A\", numRows = 1\nOutput: \"A\""]'::jsonb, '["`1 <= s.length <= 1000`", "`s` consists of English letters (lower-case and upper-case), `'',''` and `''.''`.", "`1 <= numRows <= 1000`"]'::jsonb, '["Example 1:\nInput: s = \"PAYPALISHIRING\", numRows = 3\nOutput: \"PAHNAPLSIIGYIR\"", "Example 2:\nInput: s = \"PAYPALISHIRING\", numRows = 4\nOutput: \"PINALSIGYAHRPI\"\nExplanation:\nP     I    N\nA   L S  I G\nY A   H R\nP     I", "Example 3:\nInput: s = \"A\", numRows = 1\nOutput: \"A\""]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('ab4ba3ea-b033-44ef-8c80-c96f350ec543', 'Strings');

-- ========= QUESTION: Reverse Integer =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('9db8106d-6016-4c16-8fe7-58a1a1714df6', 'Reverse Integer', 'Given a signed 32-bit integer `x`, return `x` with its digits reversed. If reversing `x` causes the value to go outside the signed 32-bit integer range `[-231, 231 - 1]`, then return `0`.

Assume the environment does not allow you to store 64-bit integers (signed or unsigned).', 'Easy', '["Example 1:\nInput: x = 123\nOutput: 321", "Example 2:\nInput: x = -123\nOutput: -321", "Example 3:\nInput: x = 120\nOutput: 21", "Example 4:\nInput: x = 0\nOutput: 0"]'::jsonb, '["`-231 <= x <= 231 - 1`"]'::jsonb, '["Example 1:\nInput: x = 123\nOutput: 321", "Example 2:\nInput: x = -123\nOutput: -321", "Example 3:\nInput: x = 120\nOutput: 21", "Example 4:\nInput: x = 0\nOutput: 0"]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('9db8106d-6016-4c16-8fe7-58a1a1714df6', 'Maths');

-- ========= QUESTION: String to Integer (atoi) =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('5a4408ec-21ac-4107-903d-1c2cafc2edfa', 'String to Integer (atoi)', 'Implement the `myAtoi(string s)` function, which converts a string to a 32-bit signed integer (similar to C/C++''s `atoi` function).

The algorithm for `myAtoi(string s)` is as follows:
Read in and ignore any leading whitespace.

Check if the next character (if not already at the end of the string) is `''-''` or `''+''`. Read this character in if it is either. This determines if the final result is negative or positive respectively. Assume the result is positive if neither is present.

Read in next the characters until the next non-digit charcter or the end of the input is reached. The rest of the string is ignored.

Convert these digits into an integer (i.e. `"123" -> 123`, `"0032" -> 32`). If no digits were read, then the integer is `0`. Change the sign as necessary (from step 2).

If the integer is out of the 32-bit signed integer range `[-231, 231 - 1]`, then clamp the integer so that it remains in the range. Specifically, integers less than `-231` should be clamped to `-231`, and integers greater than `231 - 1` should be clamped to `231 - 1`.

Return the integer as the final result.

Note:
Only the space character `'' ''` is considered a whitespace character.

Do not ignore any characters other than the leading whitespace or the rest of the string after the digits.', 'Medium', '["Example 1:\nInput: s = \"42\"\nOutput: 42\nExplanation: The underlined characters are what is read in, the caret is the current reader position.\n\nStep 1: \"42\" (no characters read because there is no leading whitespace)\n         ^\nStep 2: \"42\" (no characters read because there is neither a ''-'' nor ''+'')\n         ^\nStep 3: \"42\" (\"42\" is read in)\n           ^\nThe parsed integer is 42.\n\nSince 42 is in the range [-231, 231 - 1], the final result is 42.", "Example 2:\nInput: s = \"   -42\"\nOutput: -42\nExplanation:\nStep 1: \"   -42\" (leading whitespace is read and ignored)\n            ^\nStep 2: \"   -42\" (''-'' is read, so the result should be negative)\n             ^\nStep 3: \"   -42\" (\"42\" is read in)\n               ^\nThe parsed integer is -42.\n\nSince -42 is in the range [-231, 231 - 1], the final result is -42.", "Example 3:\nInput: s = \"4193 with words\"\nOutput: 4193\nExplanation:\nStep 1: \"4193 with words\" (no characters read because there is no leading whitespace)\n         ^\nStep 2: \"4193 with words\" (no characters read because there is neither a ''-'' nor ''+'')\n         ^\nStep 3: \"4193 with words\" (\"4193\" is read in; reading stops because the next character is a non-digit)\n             ^\nThe parsed integer is 4193.\n\nSince 4193 is in the range [-231, 231 - 1], the final result is 4193.", "Example 4:\nInput: s = \"words and 987\"\nOutput: 0\nExplanation:\nStep 1: \"words and 987\" (no characters read because there is no leading whitespace)\n         ^\nStep 2: \"words and 987\" (no characters read because there is neither a ''-'' nor ''+'')\n         ^\nStep 3: \"words and 987\" (reading stops immediately because there is a non-digit ''w'')\n         ^\nThe parsed integer is 0 because no digits were read.\n\nSince 0 is in the range [-231, 231 - 1], the final result is 0.", "Example 5:\nInput: s = \"-91283472332\"\nOutput: -2147483648\nExplanation:\nStep 1: \"-91283472332\" (no characters read because there is no leading whitespace)\n         ^\nStep 2: \"-91283472332\" (''-'' is read, so the result should be negative)\n          ^\nStep 3: \"-91283472332\" (\"91283472332\" is read in)\n                     ^\nThe parsed integer is -91283472332.\n\nSince -91283472332 is less than the lower bound of the range [-231, 231 - 1], the final result is clamped to -231 = -2147483648."]'::jsonb, '["`0 <= s.length <= 200`", "`s` consists of English letters (lower-case and upper-case), digits (`0-9`), `'' ''`, `''+''`, `''-''`, and `''.''`."]'::jsonb, '["Example 1:\nInput: s = \"42\"\nOutput: 42\nExplanation: The underlined characters are what is read in, the caret is the current reader position.\n\nStep 1: \"42\" (no characters read because there is no leading whitespace)\n         ^\nStep 2: \"42\" (no characters read because there is neither a ''-'' nor ''+'')\n         ^\nStep 3: \"42\" (\"42\" is read in)\n           ^\nThe parsed integer is 42.\n\nSince 42 is in the range [-231, 231 - 1], the final result is 42.", "Example 2:\nInput: s = \"   -42\"\nOutput: -42\nExplanation:\nStep 1: \"   -42\" (leading whitespace is read and ignored)\n            ^\nStep 2: \"   -42\" (''-'' is read, so the result should be negative)\n             ^\nStep 3: \"   -42\" (\"42\" is read in)\n               ^\nThe parsed integer is -42.\n\nSince -42 is in the range [-231, 231 - 1], the final result is -42.", "Example 3:\nInput: s = \"4193 with words\"\nOutput: 4193\nExplanation:\nStep 1: \"4193 with words\" (no characters read because there is no leading whitespace)\n         ^\nStep 2: \"4193 with words\" (no characters read because there is neither a ''-'' nor ''+'')\n         ^\nStep 3: \"4193 with words\" (\"4193\" is read in; reading stops because the next character is a non-digit)\n             ^\nThe parsed integer is 4193.\n\nSince 4193 is in the range [-231, 231 - 1], the final result is 4193.", "Example 4:\nInput: s = \"words and 987\"\nOutput: 0\nExplanation:\nStep 1: \"words and 987\" (no characters read because there is no leading whitespace)\n         ^\nStep 2: \"words and 987\" (no characters read because there is neither a ''-'' nor ''+'')\n         ^\nStep 3: \"words and 987\" (reading stops immediately because there is a non-digit ''w'')\n         ^\nThe parsed integer is 0 because no digits were read.\n\nSince 0 is in the range [-231, 231 - 1], the final result is 0.", "Example 5:\nInput: s = \"-91283472332\"\nOutput: -2147483648\nExplanation:\nStep 1: \"-91283472332\" (no characters read because there is no leading whitespace)\n         ^\nStep 2: \"-91283472332\" (''-'' is read, so the result should be negative)\n          ^\nStep 3: \"-91283472332\" (\"91283472332\" is read in)\n                     ^\nThe parsed integer is -91283472332.\n\nSince -91283472332 is less than the lower bound of the range [-231, 231 - 1], the final result is clamped to -231 = -2147483648."]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('5a4408ec-21ac-4107-903d-1c2cafc2edfa', 'Maths'),
    ('5a4408ec-21ac-4107-903d-1c2cafc2edfa', 'Strings');

-- ========= QUESTION: Palindrome Number =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('71be9ff0-de4c-41bc-b4dd-c0c5226d3ba9', 'Palindrome Number', 'Given an integer `x`, return `true` if `x` is palindrome integer.

An integer is a palindrome when it reads the same backward as forward. For example, `121` is palindrome while `123` is not.', 'Easy', '["Example 1:\nInput: x = 121\nOutput: true", "Example 2:\nInput: x = -121\nOutput: false\nExplanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.", "Example 3:\nInput: x = 10\nOutput: false\nExplanation: Reads 01 from right to left. Therefore it is not a palindrome.", "Example 4:\nInput: x = -101\nOutput: false"]'::jsonb, '["`-231 <= x <= 231 - 1`", "Follow up: Could you solve it without converting the integer to a string?"]'::jsonb, '["Example 1:\nInput: x = 121\nOutput: true", "Example 2:\nInput: x = -121\nOutput: false\nExplanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.", "Example 3:\nInput: x = 10\nOutput: false\nExplanation: Reads 01 from right to left. Therefore it is not a palindrome.", "Example 4:\nInput: x = -101\nOutput: false"]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('71be9ff0-de4c-41bc-b4dd-c0c5226d3ba9', 'Maths');

-- ========= QUESTION: Regular Expression Matching =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('046d0f34-0d7d-4694-b135-d2753a7dfc68', 'Regular Expression Matching', 'Given an input string (`s`) and a pattern (`p`), implement regular expression matching with support for `''.''` and `''*''` where:` `
`''.''` Matches any single character.​​​​
`''*''` Matches zero or more of the preceding element.

The matching should cover the entire input string (not partial).', 'Hard', '["Example 1:\nInput: s = \"aa\", p = \"a\"\nOutput: false\nExplanation: \"a\" does not match the entire string \"aa\".", "Example 2:\nInput: s = \"aa\", p = \"a*\"\nOutput: true\nExplanation: ''*'' means zero or more of the preceding element, ''a''. Therefore, by repeating ''a'' once, it becomes \"aa\".", "Example 3:\nInput: s = \"ab\", p = \".*\"\nOutput: true\nExplanation: \".*\" means \"zero or more (*) of any character (.)\".", "Example 4:\nInput: s = \"aab\", p = \"c*a*b\"\nOutput: true\nExplanation: c can be repeated 0 times, a can be repeated 1 time. Therefore, it matches \"aab\".", "Example 5:\nInput: s = \"mississippi\", p = \"mis*is*p*.\"\nOutput: false"]'::jsonb, '["`0 <= s.length <= 20`", "`0 <= p.length <= 30`", "`s` contains only lowercase English letters.", "`p` contains only lowercase English letters, `''.''`, and `''*''`.", "It is guaranteed for each appearance of the character `''*''`, there will be a previous valid character to match."]'::jsonb, '["Example 1:\nInput: s = \"aa\", p = \"a\"\nOutput: false\nExplanation: \"a\" does not match the entire string \"aa\".", "Example 2:\nInput: s = \"aa\", p = \"a*\"\nOutput: true\nExplanation: ''*'' means zero or more of the preceding element, ''a''. Therefore, by repeating ''a'' once, it becomes \"aa\".", "Example 3:\nInput: s = \"ab\", p = \".*\"\nOutput: true\nExplanation: \".*\" means \"zero or more (*) of any character (.)\".", "Example 4:\nInput: s = \"aab\", p = \"c*a*b\"\nOutput: true\nExplanation: c can be repeated 0 times, a can be repeated 1 time. Therefore, it matches \"aab\".", "Example 5:\nInput: s = \"mississippi\", p = \"mis*is*p*.\"\nOutput: false"]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "topics" (topic_name) VALUES ('Backtracking') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('046d0f34-0d7d-4694-b135-d2753a7dfc68', 'Backtracking'),
    ('046d0f34-0d7d-4694-b135-d2753a7dfc68', 'Dynamic Programming'),
    ('046d0f34-0d7d-4694-b135-d2753a7dfc68', 'Strings');

-- ========= QUESTION: Container With Most Water =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('330b146a-7fc3-4d7f-8b1c-b980ae75b5a5', 'Container With Most Water', 'Given `n` non-negative integers `a1, a2, ..., an` , where each represents a point at coordinate `(i, ai)`. `n` vertical lines are drawn such that the two endpoints of the line `i` is at `(i, ai)` and `(i, 0)`. Find two lines, which, together with the x-axis forms a container, such that the container contains the most water.

Notice that you may not slant the container.', 'Medium', '["Example 1:\nInput: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49\nExplanation: The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water (blue section) the container can contain is 49.", "Example 2:\nInput: height = [1,1]\nOutput: 1", "Example 3:\nInput: height = [4,3,2,1,4]\nOutput: 16", "Example 4:\nInput: height = [1,2,1]\nOutput: 2"]'::jsonb, '["`n == height.length`", "`2 <= n <= 105`", "`0 <= height[i] <= 104`"]'::jsonb, '["Example 1:\nInput: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49\nExplanation: The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water (blue section) the container can contain is 49.", "Example 2:\nInput: height = [1,1]\nOutput: 1", "Example 3:\nInput: height = [4,3,2,1,4]\nOutput: 16", "Example 4:\nInput: height = [1,2,1]\nOutput: 2"]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('330b146a-7fc3-4d7f-8b1c-b980ae75b5a5', 'Arrays'),
    ('330b146a-7fc3-4d7f-8b1c-b980ae75b5a5', 'Two Pointers');

-- ========= QUESTION: Integer to Roman =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('def18b0b-ee2b-4657-b6e2-c813b62185ad', 'Integer to Roman', 'Roman numerals are represented by seven different symbols: `I`, `V`, `X`, `L`, `C`, `D` and `M`.

Symbol       Value
I             1
V             5
X             10
L             50
C             100
D             500
M             1000
For example, `2` is written as `II` in Roman numeral, just two one''s added together. `12` is written as `XII`, which is simply `X + II`. The number `27` is written as `XXVII`, which is `XX + V + II`.

Roman numerals are usually written largest to smallest from left to right. However, the numeral for four is not `IIII`. Instead, the number four is written as `IV`. Because the one is before the five we subtract it making four. The same principle applies to the number nine, which is written as `IX`. There are six instances where subtraction is used:
`I` can be placed before `V` (5) and `X` (10) to make 4 and 9. 
`X` can be placed before `L` (50) and `C` (100) to make 40 and 90. 
`C` can be placed before `D` (500) and `M` (1000) to make 400 and 900.

Given an integer, convert it to a roman numeral.', 'Medium', '["Example 1:\nInput: num = 3\nOutput: \"III\"", "Example 2:\nInput: num = 4\nOutput: \"IV\"", "Example 3:\nInput: num = 9\nOutput: \"IX\"", "Example 4:\nInput: num = 58\nOutput: \"LVIII\"\nExplanation: L = 50, V = 5, III = 3.", "Example 5:\nInput: num = 1994\nOutput: \"MCMXCIV\"\nExplanation: M = 1000, CM = 900, XC = 90 and IV = 4."]'::jsonb, '["`1 <= num <= 3999`"]'::jsonb, '["Example 1:\nInput: num = 3\nOutput: \"III\"", "Example 2:\nInput: num = 4\nOutput: \"IV\"", "Example 3:\nInput: num = 9\nOutput: \"IX\"", "Example 4:\nInput: num = 58\nOutput: \"LVIII\"\nExplanation: L = 50, V = 5, III = 3.", "Example 5:\nInput: num = 1994\nOutput: \"MCMXCIV\"\nExplanation: M = 1000, CM = 900, XC = 90 and IV = 4."]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('def18b0b-ee2b-4657-b6e2-c813b62185ad', 'Maths'),
    ('def18b0b-ee2b-4657-b6e2-c813b62185ad', 'Strings');

-- ========= QUESTION: Roman to Integer =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('c93904d4-17a7-4535-a861-cae4d4483aca', 'Roman to Integer', 'Roman numerals are represented by seven different symbols: `I`, `V`, `X`, `L`, `C`, `D` and `M`.

Symbol       Value
I             1
V             5
X             10
L             50
C             100
D             500
M             1000
For example, `2` is written as `II` in Roman numeral, just two one''s added together. `12` is written as `XII`, which is simply `X + II`. The number `27` is written as `XXVII`, which is `XX + V + II`.

Roman numerals are usually written largest to smallest from left to right. However, the numeral for four is not `IIII`. Instead, the number four is written as `IV`. Because the one is before the five we subtract it making four. The same principle applies to the number nine, which is written as `IX`. There are six instances where subtraction is used:
`I` can be placed before `V` (5) and `X` (10) to make 4 and 9. 
`X` can be placed before `L` (50) and `C` (100) to make 40 and 90. 
`C` can be placed before `D` (500) and `M` (1000) to make 400 and 900.

Given a roman numeral, convert it to an integer.', 'Easy', '["Example 1:\nInput: s = \"III\"\nOutput: 3", "Example 2:\nInput: s = \"IV\"\nOutput: 4", "Example 3:\nInput: s = \"IX\"\nOutput: 9", "Example 4:\nInput: s = \"LVIII\"\nOutput: 58\nExplanation: L = 50, V= 5, III = 3.", "Example 5:\nInput: s = \"MCMXCIV\"\nOutput: 1994\nExplanation: M = 1000, CM = 900, XC = 90 and IV = 4."]'::jsonb, '["`1 <= s.length <= 15`", "`s` contains only the characters `(''I'', ''V'', ''X'', ''L'', ''C'', ''D'', ''M'')`.", "It is guaranteed that `s` is a valid roman numeral in the range `[1, 3999]`."]'::jsonb, '["Example 1:\nInput: s = \"III\"\nOutput: 3", "Example 2:\nInput: s = \"IV\"\nOutput: 4", "Example 3:\nInput: s = \"IX\"\nOutput: 9", "Example 4:\nInput: s = \"LVIII\"\nOutput: 58\nExplanation: L = 50, V= 5, III = 3.", "Example 5:\nInput: s = \"MCMXCIV\"\nOutput: 1994\nExplanation: M = 1000, CM = 900, XC = 90 and IV = 4."]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('c93904d4-17a7-4535-a861-cae4d4483aca', 'Maths'),
    ('c93904d4-17a7-4535-a861-cae4d4483aca', 'Strings');

-- ========= QUESTION: Longest Common Prefix =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('d1e9eb85-47a7-4c26-a9a6-a39b18784b5c', 'Longest Common Prefix', 'Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string `""`.', 'Easy', '["Example 1:\nInput: strs = [\"flower\",\"flow\",\"flight\"]\nOutput: \"fl\"", "Example 2:\nInput: strs = [\"dog\",\"racecar\",\"car\"]\nOutput: \"\"\nExplanation: There is no common prefix among the input strings."]'::jsonb, '["`0 <= strs.length <= 200`", "`0 <= strs[i].length <= 200`", "`strs[i]` consists of only lower-case English letters."]'::jsonb, '["Example 1:\nInput: strs = [\"flower\",\"flow\",\"flight\"]\nOutput: \"fl\"", "Example 2:\nInput: strs = [\"dog\",\"racecar\",\"car\"]\nOutput: \"\"\nExplanation: There is no common prefix among the input strings."]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('d1e9eb85-47a7-4c26-a9a6-a39b18784b5c', 'Strings');

-- ========= QUESTION: 3Sum =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('6cec16bb-f9fe-417b-87e0-ad60dc1facd3', '3Sum', 'Given an integer array nums, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.

Notice that the solution set must not contain duplicate triplets.', 'Medium', '["Example 1:\nInput: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]", "Example 2:\nInput: nums = []\nOutput: []", "Example 3:\nInput: nums = [0]\nOutput: []"]'::jsonb, '["`0 <= nums.length <= 3000`", "`-105 <= nums[i] <= 105`"]'::jsonb, '["Example 1:\nInput: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]", "Example 2:\nInput: nums = []\nOutput: []", "Example 3:\nInput: nums = [0]\nOutput: []"]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('6cec16bb-f9fe-417b-87e0-ad60dc1facd3', 'Arrays'),
    ('6cec16bb-f9fe-417b-87e0-ad60dc1facd3', 'Two Pointers');

-- ========= QUESTION: 3Sum Closest =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('40d703ae-9e87-4acc-8305-69ff3b428341', '3Sum Closest', 'Given an array `nums` of n integers and an integer `target`, find three integers in `nums` such that the sum is closest to `target`. Return the sum of the three integers. You may assume that each input would have exactly one solution.', 'Medium', '["Example 1:\nInput: nums = [-1,2,1,-4], target = 1\nOutput: 2\nExplanation: The sum that is closest to the target is 2. (-1 + 2 + 1 = 2)."]'::jsonb, '["`3 <= nums.length <= 10^3`", "`-10^3 <= nums[i] <= 10^3`", "`-10^4 <= target <= 10^4`"]'::jsonb, '["Example 1:\nInput: nums = [-1,2,1,-4], target = 1\nOutput: 2\nExplanation: The sum that is closest to the target is 2. (-1 + 2 + 1 = 2)."]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('40d703ae-9e87-4acc-8305-69ff3b428341', 'Arrays'),
    ('40d703ae-9e87-4acc-8305-69ff3b428341', 'Two Pointers');

-- ========= QUESTION: Letter Combinations of a Phone Number =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('c90c9eb9-955c-41cb-ad52-452a0f5d5a87', 'Letter Combinations of a Phone Number', 'Given a string containing digits from `2-9` inclusive, return all possible letter combinations that the number could represent. Return the answer in any order.

A mapping of digit to letters (just like on the telephone buttons) is given below. Note that 1 does not map to any letters.', 'Medium', '["Example 1:\nInput: digits = \"23\"\nOutput: [\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]", "Example 2:\nInput: digits = \"\"\nOutput: []", "Example 3:\nInput: digits = \"2\"\nOutput: [\"a\",\"b\",\"c\"]"]'::jsonb, '["`0 <= digits.length <= 4`", "`digits[i]` is a digit in the range `[''2'', ''9'']`."]'::jsonb, '["Example 1:\nInput: digits = \"23\"\nOutput: [\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]", "Example 2:\nInput: digits = \"\"\nOutput: []", "Example 3:\nInput: digits = \"2\"\nOutput: [\"a\",\"b\",\"c\"]"]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "topics" (topic_name) VALUES ('Depth-first Search') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('c90c9eb9-955c-41cb-ad52-452a0f5d5a87', 'Backtracking'),
    ('c90c9eb9-955c-41cb-ad52-452a0f5d5a87', 'Depth-first Search'),
    ('c90c9eb9-955c-41cb-ad52-452a0f5d5a87', 'Recursion'),
    ('c90c9eb9-955c-41cb-ad52-452a0f5d5a87', 'Strings');

-- ========= QUESTION: 4Sum =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('de9cded3-c0ce-46ba-b139-9ec7f7a98260', '4Sum', 'Given an array `nums` of n integers and an integer `target`, are there elements a, b, c, and d in `nums` such that a + b + c + d = `target`? Find all unique quadruplets in the array which gives the sum of `target`.

Notice that the solution set must not contain duplicate quadruplets.', 'Medium', '["Example 1:\nInput: nums = [1,0,-1,0,-2,2], target = 0\nOutput: [[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]", "Example 2:\nInput: nums = [], target = 0\nOutput: []"]'::jsonb, '["`0 <= nums.length <= 200`", "`-109 <= nums[i] <= 109`", "`-109 <= target <= 109`"]'::jsonb, '["Example 1:\nInput: nums = [1,0,-1,0,-2,2], target = 0\nOutput: [[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]", "Example 2:\nInput: nums = [], target = 0\nOutput: []"]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('de9cded3-c0ce-46ba-b139-9ec7f7a98260', 'Arrays'),
    ('de9cded3-c0ce-46ba-b139-9ec7f7a98260', 'Hash Tables'),
    ('de9cded3-c0ce-46ba-b139-9ec7f7a98260', 'Two Pointers');

-- ========= QUESTION: Remove Nth Node From End of List =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('896dee14-d3b3-47a9-bd1c-ef27a55a8e9e', 'Remove Nth Node From End of List', 'Given the `head` of a linked list, remove the `nth` node from the end of the list and return its head.

Follow up: Could you do this in one pass?', 'Medium', '["Example 1:\nInput: head = [1,2,3,4,5], n = 2\nOutput: [1,2,3,5]", "Example 2:\nInput: head = [1], n = 1\nOutput: []", "Example 3:\nInput: head = [1,2], n = 1\nOutput: [1]"]'::jsonb, '["The number of nodes in the list is `sz`.", "`1 <= sz <= 30`", "`0 <= Node.val <= 100`", "`1 <= n <= sz`"]'::jsonb, '["Example 1:\nInput: head = [1,2,3,4,5], n = 2\nOutput: [1,2,3,5]", "Example 2:\nInput: head = [1], n = 1\nOutput: []", "Example 3:\nInput: head = [1,2], n = 1\nOutput: [1]"]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('896dee14-d3b3-47a9-bd1c-ef27a55a8e9e', 'Linked Lists'),
    ('896dee14-d3b3-47a9-bd1c-ef27a55a8e9e', 'Two Pointers');

-- ========= QUESTION: Valid Parentheses =========

INSERT INTO "questions" (question_id, title, description, difficulty, examples, constraints, testcases, created_by) VALUES
('45136b03-ff39-432b-8e28-f7799323bfd5', 'Valid Parentheses', 'Given a string `s` containing just the characters `''(''`, `'')''`, `''{''`, `''}''`, `''[''` and `'']''`, determine if the input string is valid.

An input string is valid if:
Open brackets must be closed by the same type of brackets.

Open brackets must be closed in the correct order.', 'Easy', '["Example 1:\nInput: s = \"()\"\nOutput: true", "Example 2:\nInput: s = \"()[]{}\"\nOutput: true", "Example 3:\nInput: s = \"(]\"\nOutput: false", "Example 4:\nInput: s = \"([)]\"\nOutput: false", "Example 5:\nInput: s = \"{[]}\"\nOutput: true"]'::jsonb, '["`1 <= s.length <= 104`", "`s` consists of parentheses only `''()[]{}''`."]'::jsonb, '["Example 1:\nInput: s = \"()\"\nOutput: true", "Example 2:\nInput: s = \"()[]{}\"\nOutput: true", "Example 3:\nInput: s = \"(]\"\nOutput: false", "Example 4:\nInput: s = \"([)]\"\nOutput: false", "Example 5:\nInput: s = \"{[]}\"\nOutput: true"]'::jsonb, '00000000-0000-0000-0000-000000000000');
INSERT INTO "topics" (topic_name) VALUES ('Stack') ON CONFLICT (topic_name) DO NOTHING;
INSERT INTO "question_topics" (question_id, topic_name) VALUES
    ('45136b03-ff39-432b-8e28-f7799323bfd5', 'Stack'),
    ('45136b03-ff39-432b-8e28-f7799323bfd5', 'Strings');

COMMIT;
