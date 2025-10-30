# Instructions to add the BS Engineering logo to your project

## Step 1: Save the logo image
Save the BS Engineering logo image file (the one you attached) to:
`backend/static/bs-engineering-logo.png`

## Step 2: Verify the file exists
Make sure the file path is:
C:\Users\HP\Desktop\Finvo\backend\static\bs-engineering-logo.png

## Alternative methods:

### Option A: Manual Copy
1. Save the attached logo image to your computer
2. Copy it to: backend/static/bs-engineering-logo.png

### Option B: Using PowerShell
If you have the logo saved somewhere, use PowerShell:
```powershell
Copy-Item "path\to\your\logo.png" "backend\static\bs-engineering-logo.png"
```

## Logo specifications:
- Format: PNG (recommended) or JPG
- The code will automatically scale it to 140px width
- Maintains aspect ratio for professional appearance
- Will appear on all quotations and invoices

## After saving the logo:
1. The logo will automatically appear on all PDF documents
2. No need to redeploy - the logo is loaded dynamically
3. For deployed version, you'll need to:
   - Add the logo to your repository
   - Commit and push the changes
   - Run: fly deploy
