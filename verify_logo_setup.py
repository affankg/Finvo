"""
Script to verify and set up the BS Engineering logo for PDF generation
"""
import os
import sys
from pathlib import Path

# Get the base directory
BASE_DIR = Path(__file__).resolve().parent / 'backend'
STATIC_DIR = BASE_DIR / 'static'

def main():
    print("=" * 60)
    print("BS Engineering Logo Setup Verification")
    print("=" * 60)
    
    # Check if static directory exists
    if not STATIC_DIR.exists():
        print(f"✗ Static directory does not exist: {STATIC_DIR}")
        print("  Creating directory...")
        STATIC_DIR.mkdir(parents=True, exist_ok=True)
        print(f"✓ Created directory: {STATIC_DIR}")
    else:
        print(f"✓ Static directory exists: {STATIC_DIR}")
    
    # Check for logo files
    logo_files = [
        'bs-engineering-logo.png',
        'logo.png',
        'logo.jpg',
    ]
    
    print("\nLooking for logo files:")
    found_logo = False
    for logo_file in logo_files:
        logo_path = STATIC_DIR / logo_file
        if logo_path.exists():
            size = logo_path.stat().st_size
            print(f"  ✓ Found: {logo_file} ({size:,} bytes)")
            found_logo = True
        else:
            print(f"  ✗ Missing: {logo_file}")
    
    print("\n" + "=" * 60)
    if found_logo:
        print("✓ Logo setup complete! PDFs will use the logo.")
    else:
        print("✗ No logo found. Please add a logo file to:")
        print(f"  {STATIC_DIR}")
        print("\nRecommended filename: bs-engineering-logo.png")
        print("\nSteps to add logo:")
        print("1. Save your logo image as 'bs-engineering-logo.png'")
        print(f"2. Copy it to: {STATIC_DIR}")
        print("3. Run this script again to verify")
    print("=" * 60)

if __name__ == '__main__':
    main()
