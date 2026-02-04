# 500 Error on Resume Upload / Login – Fix Guide

## PORT=5000 cause nahi hai

Vercel serverless apna port use karta hai. **PORT=5000** env variable 500 error ka reason **nahi** hai. Rakho ya hatao dono theek hai.

---

## Sabse common cause: Database (Aiven) connection

500 aane ka sabse zyada chance ye hai ke **backend Vercel se Aiven MySQL tak connect nahi ho pa raha**.

### 1. Vercel backend logs check karein

1. **Vercel** → **Backend project** (career-intelligence-platform-backen)
2. **Deployments** → latest deployment click karein
3. **Runtime Logs** / **Functions** tab kholen (ya **Logs**)
4. Resume upload karte waqt jo error aata hai (red line) woh dekhen

Agar wahan **ECONNREFUSED**, **ETIMEDOUT**, **ENOTFOUND** ya **MySQL connection** / **access denied** dikhe to issue **database connection** hai.

---

### 2. Aiven par “allow from anywhere” check karein

Aiven MySQL ko **internet se** allow karna padta hai, warna Vercel ke servers connect nahi kar paate.

1. **Aiven Console** → apna MySQL service
2. **Settings** / **Networking** / **Public access** jaisa option
3. **“Allow access from anywhere”** ya **“Public access”** ON karein  
   (ya jo option Aiven pe “public / 0.0.0.0” dikhaye)
4. Save karein aur thodi der wait karein

Phir backend **Redeploy** karein (Vercel → Backend project → Deployments → … → Redeploy).

---

### 3. Backend environment variables double-check

Vercel → Backend project → **Settings** → **Environment Variables**:

| Variable     | Check |
|-------------|--------|
| `DB_HOST`   | Bilkul wahi jo Aiven pe dikh raha hai (e.g. `xxx.aivencloud.com`) |
| `DB_PORT`   | Aiven ka port (number, e.g. `22617`) |
| `DB_USER`   | Aiven user |
| `DB_PASSWORD` | Aiven password (copy-paste, extra space nahi) |
| `DB_NAME`   | `Resume_Analyzer` (ya jo name use kiya hai) |

**PORT** – rakho ya hatao dono chalega; 500 ka cause nahi.

---

### 4. Login / auth 500

Agar **login** bhi 500 de raha hai to bhi same: backend DB tak pahunch nahi pa raha.  
Pehle **database connection** fix karein (steps 2 + 3), phir login aur upload dono theek ho sakte hain.

---

## Short checklist

1. **Vercel backend** → Runtime/Function **logs** dekhein (exact error)
2. **Aiven** → Public access / allow from anywhere **ON** karein
3. **Backend env** → `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` sahi hain confirm karein
4. Backend **Redeploy** karein
5. Phir **login** aur **resume upload** dubara test karein

---

## Agar ab bhi 500 aaye

Runtime logs mein jo **exact error message** (red text) hai, woh copy karke bhejein – us hisaab se next step bata sakte hain.
