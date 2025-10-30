# BS Engineering Logo Setup Guide

## Quick Setup Steps

### 1. Save the Logo File
Save the BS Engineering logo you attached as:
```
C:\Users\HP\Desktop\Finvo\backend\static\bs-engineering-logo.png
```

### 2. Verify Logo Setup
Run this command to verify:
```powershell
python verify_logo_setup.py
```

### 3. Test Locally (Optional)
Generate a test PDF to see the logo:
- Create a quotation or invoice through your application
- The PDF will include the new logo at the top

### 4. Deploy to Production
After adding the logo:
```powershell
# Commit the changes
git add backend/static/bs-engineering-logo.png
git commit -m "Add BS Engineering logo for PDFs"
git push

# Deploy to Fly.io
fly deploy
```

## Logo Specifications

- **Recommended Format**: PNG (transparent background)
- **Alternative Format**: JPG
- **Display Size**: 140px width (height auto-scaled to maintain aspect ratio)
- **Location in PDF**: Top-left corner of every quotation and invoice
- **Position**: Next to company information

## Logo Display Details

The logo will appear on:
- ✅ All quotation PDFs
- ✅ All invoice PDFs
- ✅ Above or beside the company name and address
- ✅ Professional sizing that doesn't overpower the document

## Fallback Behavior

If the primary logo isn't found, the system will try these in order:
1. `bs-engineering-logo.png` (Primary - your new logo)
2. `logo.png`
3. `logo.jpg` (Currently exists)
4. Media folder logos

## Troubleshooting

**Logo not appearing?**
1. Check file path: `backend/static/bs-engineering-logo.png`
2. Verify file format (PNG or JPG)
3. Run: `python verify_logo_setup.py`
4. Check file size (should be reasonable, under 5MB)

**Logo too large/small?**
The code automatically scales to 140px width. If you need different sizing:
- Edit `backend/api/utils.py`
- Find the line: `logo = Image(logo_path, width=140, height=80, kind='proportional')`
- Adjust width and height values

**Need help?**
The logo setup is complete in the code. Just add the image file and it will work automatically!
