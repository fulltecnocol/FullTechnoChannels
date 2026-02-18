# 🚀 TeleGate Setup Guide

This guide will help you set up the TeleGate project from scratch.

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Google Cloud SDK** (for deployment)
- **Firebase CLI** (for deployment)
- **Supabase Account** (or PostgreSQL database)
- **Telegram Bot Token** (from @BotFather)
- **Google OAuth Client ID** (from Google Cloud Console)

---

## 📋 Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd GestorMiembros

# Install backend dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Install dashboard dependencies
cd dashboard
npm install
cd ..
```

---

## 🔐 Step 2: Environment Variables

### Backend (.env)

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```bash
# Database (Supabase or PostgreSQL)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/YOUR_DATABASE

# Telegram Bot (get from @BotFather)
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# Authentication (generate a random 64-character string)
JWT_SECRET_KEY=YOUR_SECRET_KEY_HERE

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com

# URLs (update after deployment)
DASHBOARD_URL=http://localhost:3000
ENV=development
SERVICE_TYPE=unified
```

### Dashboard (.env.production)

```bash
cd dashboard
cp .env.example .env.production
```

Edit `dashboard/.env.production`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
NEXT_PUBLIC_BOT_USERNAME=YourBotUsername
```

---

## 🗄️ Step 3: Database Setup

1. **Create a Supabase project** (or set up PostgreSQL locally)
2. **Run migrations** (if you have migration files):
   ```bash
   # Your migration command here
   ```
3. **Verify connection**:
   ```bash
   python scripts/list_users.py
   ```

---

## 🔑 Step 4: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. **Authorized JavaScript origins**:
   - `http://localhost:3000` (development)
   - `https://your-dashboard.web.app` (production)
7. **Authorized redirect URIs**:
   - `http://localhost:3000` (development)
   - `https://your-dashboard.web.app` (production)
8. Copy the **Client ID** and add it to your `.env` files

---

## 🤖 Step 5: Telegram Bot Setup

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the instructions
3. Copy the **Bot Token** and add it to your `.env` file
4. Set bot commands (optional):
   ```
   /start - Start the bot
   /help - Get help
   ```

---

## 🏃 Step 6: Local Development

### Start Backend

```bash
# Activate virtual environment
source venv/bin/activate

# Start API server
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### Start Dashboard

```bash
cd dashboard
npm run dev
```

### Start Bot (if separate)

```bash
python bot/main.py
```

Visit:
- **Dashboard**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

---

## 🚀 Step 7: Deployment

### Deploy to Google Cloud Run

1. **Set up Google Cloud SDK**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Create secrets in Secret Manager**:
   ```bash
   echo -n "YOUR_DATABASE_URL" | gcloud secrets create DATABASE_URL --data-file=-
   echo -n "YOUR_JWT_SECRET" | gcloud secrets create JWT_SECRET_KEY --data-file=-
   echo -n "YOUR_BOT_TOKEN" | gcloud secrets create BOT_TOKEN --data-file=-
   ```

3. **Deploy using the safe script**:
   ```bash
   # Copy and customize the example
   cp deploy-safe.sh.example deploy-safe.sh
   # Edit deploy-safe.sh with your values
   chmod +x deploy-safe.sh
   ./deploy-safe.sh
   ```

### Deploy Dashboard to Firebase

1. **Set up Firebase**:
   ```bash
   firebase login
   firebase init hosting
   ```

2. **Update `.env.production`** with your backend URL

3. **Deploy**:
   ```bash
   cd dashboard
   npm run build
   firebase deploy --only hosting
   ```

---

## 🔗 Step 8: Post-Deployment Configuration

### Update Google OAuth

Add your production URLs to Google Cloud Console:
- `https://your-backend.run.app`
- `https://your-dashboard.web.app`

### Set Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -d "url=https://your-backend.run.app/bot/webhook/YOUR_BOT_TOKEN"
```

---

## 📝 Utility Scripts

All utility scripts now use environment variables. Make sure your `.env` file is configured before running them:

```bash
# List users
python scripts/list_users.py

# Reset password
python scripts/reset_password_manual.py

# Link Telegram account
python scripts/link_telegram_manual.py

# Run integrity checks
python scripts/run_integrity_checks.py
```

---

## 🆘 Troubleshooting

### "DATABASE_URL not found"
- Make sure you have a `.env` file in the project root
- Verify the `.env` file contains `DATABASE_URL=...`

### "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured"
- Check `dashboard/.env.production` exists
- Verify it contains `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...`

### Telegram bot not responding
- Verify webhook is set correctly
- Check backend logs for errors
- Ensure `TELEGRAM_BOT_TOKEN` is correct in `.env`

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

## 🔒 Security Notes

- **Never commit `.env` files** to Git
- **Use Secret Manager** for production secrets
- **Rotate credentials** regularly
- **Review `.gitignore`** before pushing to ensure no secrets are exposed
