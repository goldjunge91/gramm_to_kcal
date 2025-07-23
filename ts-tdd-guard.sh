: '
TDD Guard - Strict file type matching

This script enforces Test-Driven Development (TDD) principles by ensuring that every JavaScript/TypeScript source file (.js, .ts, .jsx, .tsx) being edited, written, or multi-edited has a corresponding test file in the same directory. It is intended to be used as a pre-commit or file operation hook.

Functionality:
- Reads hook data from stdin, expecting JSON with "tool_name" and "tool_input.file_path".
- Only processes file operations for JS/TS files, excluding test/spec files themselves.
- Determines expected test file names based on the source file extension:
    - .js → .test.js, .spec.js
    - .ts → .test.ts, .spec.ts
    - .jsx → .test.jsx, .spec.jsx, .test.js, .spec.js
    - .tsx → .test.tsx, .spec.tsx, .test.ts, .spec.ts
- Checks if any of the expected test files exist.
- If no test file is found, prints a TDD violation message with expected test file names and a reminder of TDD phases, then exits with code 2.
- If a test file exists, allows the operation to proceed.

Usage:
- Integrate as a hook in your development workflow to enforce TDD discipline for JS/TS projects.
'
#!/bin/bash

# TDD Guard - Strict file type matching

hook_data=$(cat)
tool_name=$(echo "$hook_data" | jq -r '.tool_name // empty' 2>/dev/null)
file_path=$(echo "$hook_data" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Only check JS/TS files for file operations
if [[ ! "$tool_name" =~ ^(Edit|MultiEdit|Write)$ ]] || [[ ! "$file_path" =~ \.(js|ts|jsx|tsx)$ ]] || [[ "$file_path" =~ \.(test|spec)\. ]]; then
    exit 0
fi

# Extract base name and extension
base_name=$(basename "$file_path")
dir_name=$(dirname "$file_path")
extension="${base_name##*.}"
name_without_ext="${base_name%.*}"

# Build test file patterns based on source file type
test_patterns=()
case "$extension" in
    "js")
        test_patterns+=("${dir_name}/${name_without_ext}.test.js")
        test_patterns+=("${dir_name}/${name_without_ext}.spec.js")
        ;;
    "ts")
        test_patterns+=("${dir_name}/${name_without_ext}.test.ts")
        test_patterns+=("${dir_name}/${name_without_ext}.spec.ts")
        ;;
    "jsx")
        test_patterns+=("${dir_name}/${name_without_ext}.test.jsx")
        test_patterns+=("${dir_name}/${name_without_ext}.spec.jsx")
        test_patterns+=("${dir_name}/${name_without_ext}.test.js")
        test_patterns+=("${dir_name}/${name_without_ext}.spec.js")
        ;;
    "tsx")
        test_patterns+=("${dir_name}/${name_without_ext}.test.tsx")
        test_patterns+=("${dir_name}/${name_without_ext}.spec.tsx")
        test_patterns+=("${dir_name}/${name_without_ext}.test.ts")
        test_patterns+=("${dir_name}/${name_without_ext}.spec.ts")
        ;;
esac

# Look for matching test files
found_test=""
for pattern in "${test_patterns[@]}"; do
    if [[ -f "$pattern" ]]; then
        found_test="$pattern"
        break
    fi
done

if [[ -z "$found_test" ]]; then
    echo "TDD Violation: No test file found for $file_path" >&2
    echo "" >&2
    echo "Expected test files:" >&2
    for pattern in "${test_patterns[@]}"; do
        echo "  - $(basename "$pattern")" >&2
    done
    echo "" >&2
    echo "Following TDD principles:" >&2
    echo "1. Write a failing test first (Red phase)" >&2
    echo "2. Write minimal code to pass the test (Green phase)" >&2
    echo "3. Refactor while keeping tests green (Refactor phase)" >&2

    exit 2
fi

# Test file exists, allow operation
exit 0