#!/usr/bin/env python3
"""
Script to fix all API endpoints to include the /api/ prefix
"""

import os
import re
from pathlib import Path

def fix_api_endpoints(file_path):
    """Fix API endpoints in a single file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern to match axios calls without /api/ prefix
    # This matches axios.get('/path'), axios.post('/path'), etc.
    patterns = [
        (r"axios\.(get|post|put|patch|delete)\(['\"]/((?!api/)[^'\"]+)", r"axios.\1('/api/\2"),
        (r"api\.(get|post|put|patch|delete)\(['\"]/((?!api/)[^'\"]+)", r"api.\1('/api/\2"),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    src_dir = Path('src')
    
    if not src_dir.exists():
        print("Error: src directory not found!")
        return
    
    fixed_files = []
    
    # Find all JavaScript/TypeScript files
    for ext in ['*.js', '*.jsx', '*.ts', '*.tsx']:
        for file_path in src_dir.rglob(ext):
            if fix_api_endpoints(file_path):
                fixed_files.append(file_path)
    
    if fixed_files:
        print(f"Fixed {len(fixed_files)} files:")
        for file_path in fixed_files:
            print(f"  - {file_path}")
    else:
        print("No files needed fixing.")

if __name__ == "__main__":
    main()