# 🔐 JWT_SECRET Generate Aur Use Karne Ka Guide

## Step 1: JWT_SECRET Generate Karein

### Method 1: PowerShell Se (Recommended)

1. **PowerShell kholo** (Windows mein)
2. Ye command run karein:
   ```powershell
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))
   ```
3. **Output mil jayega** - ye aapka JWT_SECRET hai
   - Example: `YWJjZGVmZ2hpams=`
   - Ye copy karein

### Method 2: Online Generator Se

1. Browser mein jao: **https://randomkeygen.com/**
2. **"CodeIgniter Encryption Keys"** section mein se koi bhi key copy karein
3. Ya **"Fort Knox Password"** use karein (64 characters ka)

---

## Step 2: Render Par Add Karein

### Render Dashboard Mein:

1. **Render dashboard** mein jao
2. Apna **backend service** select karein
3. **"Environment"** tab click karein
4. **"Add Environment Variable"** button click karein
5. Add karein:
   ```
   Key: JWT_SECRET
   Value: <yahan-jo-bhi-generate-kiya-wo-paste-karein>
   ```
   Example:
   ```
   Key: JWT_SECRET
   Value: YWJjZGVmZ2hpams=
   ```
6. **"Save Changes"** click karein
7. Service automatically restart ho jayega

---

## ✅ Important Notes

1. **JWT_SECRET ko kabhi bhi share mat karein** - ye secret hai
2. **GitHub par commit mat karein** - `.env` file already gitignore mein hai ✅
3. **Strong random string use karein** - security ke liye zaruri hai
4. **Same JWT_SECRET use karein** - agar change kiya to existing tokens invalid ho jayenge

---

## 🎯 Complete Example

**Generate:**
```powershell
PS> [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))
YWJjZGVmZ2hpams=
```

**Render Par Add:**
```
Key: JWT_SECRET
Value: YWJjZGVmZ2hpams=
```

**Done!** ✅

---

## 🆘 Help

Agar koi problem aaye:
- PowerShell command se error aaye to online generator use karein
- Render par add karte waqt spaces check karein (nahi hone chahiye)
- Save ke baad service restart ho jayega automatically
