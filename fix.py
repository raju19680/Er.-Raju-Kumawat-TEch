import re

with open('src/components/cms/test-portal/question-library.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'(      \{/\* Floating Action Bar \*/\}.*?</Dialog>\n)'
match = re.search(pattern, content, re.DOTALL)

if match:
    cut_content = match.group(1)
    
    # Remove from original
    content = content.replace(cut_content, '')
    
    # Insert at bottom before the last </div>
    insert_str = "    </div>\n  )\n}"
    if insert_str in content:
        content = content.replace(insert_str, cut_content + insert_str)
        with open('src/components/cms/test-portal/question-library.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed successfully!")
    else:
        print("Could not find insert pos")
else:
    print("Could not find match")

