# CaptionBeast - Deployment Guide

## What's Been Added

### Credit System (Backend)
- **SQLite Database** - Stores user credits, transactions, and promo codes
- **Credit API Endpoints**:
  - `GET /credits/{user_id}` - Get user credits
  - `POST /credits/{user_id}/add` - Add credits manually
  - `POST /credits/redeem` - Redeem promo codes
- **Credit Deduction** - 1 credit deducted per video upload
- **Default Promo Codes**:
  - `FREE10` - 10 credits (100 uses)
  - `WELCOME` - 5 credits (unlimited)

### Frontend Pages
- **Buy Credits Page** (`/buy-credits`) - Purchase credits via Contra.com
- **Credit Display** - Shows current credits in navbar
- **User ID System** - Auto-generated user IDs stored in localStorage

### Payment Integration
- Links to your Contra.com payment page: https://contra.com/payment-link/ArcQFsbC-caption-beast
- Pricing: $5/10 credits, $20/50 credits, $35/100 credits

---

## Deployment Options (Free 24*7)

### Option 1: Railway (Recommended)
1. Push code to GitHub
2. Go to https://railway.app
3. "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Python/FastAPI
6. Add environment variables if needed
7. Deploy!

**Railway Pricing**: $5 free credits/month (enough for small usage)

### Option 2: Render.com
1. Go to https://render.com
2. "New Web Service"
3. Connect GitHub repo
4. Build command: `pip install -r requirements.txt`
5. Start command: `python backend/main.py`
6. Deploy!

**Render Pricing**: Free tier available (sleeps after 15 min inactivity)

### Option 3: Fly.io
1. Install Fly CLI: `brew install flyctl`
2. `fly auth login`
3. `fly launch` in project root
4. Follow prompts
5. `fly deploy`

**Fly.io Pricing**: Free tier with 3 shared VMs

---

## How to Manually Add Credits (Admin)

Since payments go through Contra, you'll need to manually add credits:

### Option 1: API Call
```bash
curl -X POST "https://your-domain.com/credits/USER_ID/add" \
  -F "amount=10"
```

### Option 2: Direct Database Access
Access the SQLite database and update user credits directly.

---

## Monitoring Earnings

Check transactions in the database:
```bash
sqlite3 credits.db "SELECT * FROM transactions;"
```

---

## Default Promo Codes
- `FREE10` - 10 credits (good for testing)
- `WELCOME` - 5 credits (unlimited, for new users)

---

## Next Steps
1. Deploy to Railway/Render/Fly.io
2. Set up your domain
3. Test the credit system
4. Share your payment link!
