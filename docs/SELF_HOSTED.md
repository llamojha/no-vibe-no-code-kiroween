# Self-Hosted Guide: Open Source Mode

This guide provides detailed instructions for running No Vibe No Code in Open Source Mode - a fully functional local-only configuration that requires no database setup.

## Overview

Open Source Mode enables you to run the complete application using:

- **Browser localStorage** for data persistence
- **Simple username/password authentication** (no external auth providers)
- **Only a Gemini API key** as the external dependency

This mode is ideal for:

- Local development and testing
- Hackathon demos and presentations
- Self-hosted personal deployments
- Contributing to the open source project

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Gemini API Key** - [Get one free](https://aistudio.google.com/app/apikey)
- **Git** - For cloning the repository

## Quick Setup (2 minutes)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/no-vibe-no-code.git
cd no-vibe-no-code
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with these minimal settings:

```bash
# Enable Open Source Mode
FF_LOCAL_STORAGE_MODE=true
NEXT_PUBLIC_FF_LOCAL_STORAGE_MODE=true

# Your Gemini API key (required)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 4: Start the Application

```bash
npm run dev
```

### Step 5: Login

Open [http://localhost:3000](http://localhost:3000) and login with:

- **Username:** kiro
- **Password:** kiro

You're ready to go! 🎉

## Configuration Options

### Custom Authentication Credentials

Change the default login credentials by setting these environment variables:

```bash
LOCAL_AUTH_USERNAME=your_username
LOCAL_AUTH_PASSWORD=your_password
```

### AI Model Configuration

Customize the Gemini model used for analysis:

```bash
GEMINI_MODEL=gemini-2.5-flash-lite  # Default, fast and cost-effective
# Or use other models:
# GEMINI_MODEL=gemini-1.5-pro       # More capable, higher cost
```

### Feature Flags

Enable or disable specific features:

```bash
# Analyzer visibility
NEXT_PUBLIC_FF_ENABLE_CLASSIC_ANALYZER=true
NEXT_PUBLIC_FF_ENABLE_KIROWEEN_ANALYZER=true

# Document generation
NEXT_PUBLIC_FF_ENABLE_DOCUMENT_GENERATION=true
FF_ENABLE_DOCUMENT_GENERATION=true
```

### Mock Mode (No API Costs)

For development without consuming Gemini API credits:

```bash
FF_USE_MOCK_API=true
NEXT_PUBLIC_FF_USE_MOCK_API=true
FF_MOCK_SCENARIO=success
```

## How Open Source Mode Works

### Authentication

- Uses simple username/password validation against environment variables
- Generates a deterministic user ID from the username (consistent across sessions)
- All authenticated users receive "admin" tier access
- Auth state is stored in localStorage under `nvnc-local-auth`

### Data Storage

All data is stored in browser localStorage with the prefix `nvnc-local-`:

| Key                    | Description                       |
| ---------------------- | --------------------------------- |
| `nvnc-local-auth`      | Authentication state              |
| `nvnc-local-user`      | User profile                      |
| `nvnc-local-analyses`  | Startup idea analyses             |
| `nvnc-local-hackathon` | Hackathon project analyses        |
| `nvnc-local-ideas`     | Saved ideas                       |
| `nvnc-local-documents` | Generated documents               |
| `nvnc-local-credits`   | Credit transactions (audit trail) |

### Credit System

In Open Source Mode:

- Credit balance always shows **9999** credits
- All operations succeed regardless of credit cost
- Transactions are recorded locally for audit purposes
- No actual credit enforcement

## Limitations

Open Source Mode has some limitations compared to Full Mode (Supabase):

| Feature            | Open Source Mode        | Full Mode           |
| ------------------ | ----------------------- | ------------------- |
| Data persistence   | Browser localStorage    | PostgreSQL database |
| Multi-user support | Single user per browser | Multiple users      |
| Data sync          | No sync between devices | Cloud sync          |
| Data backup        | Manual export only      | Automatic backups   |
| Storage limit      | ~5-10MB (browser limit) | Unlimited           |
| Authentication     | Simple credentials      | Magic link, OAuth   |
| Credit system      | Unlimited (bypassed)    | Enforced limits     |

### Important Notes

1. **Data is browser-specific**: Your data only exists in the browser where you created it
2. **Clearing browser data deletes everything**: Be careful with "Clear browsing data"
3. **No cross-device sync**: Data doesn't sync between different browsers or devices
4. **Development use recommended**: For production multi-user scenarios, use Full Mode with Supabase

## Troubleshooting

### "Invalid credentials" error

**Cause:** Username or password doesn't match configured values.

**Solution:**

1. Check your `.env.local` file for `LOCAL_AUTH_USERNAME` and `LOCAL_AUTH_PASSWORD`
2. If not set, use default credentials: `kiro` / `kiro`
3. Restart the development server after changing environment variables

### "GEMINI_API_KEY is required" error

**Cause:** Missing or invalid Gemini API key.

**Solution:**

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add it to `.env.local`: `GEMINI_API_KEY=your_key_here`
3. Restart the development server

### Data not persisting after refresh

**Cause:** localStorage might be disabled or full.

**Solution:**

1. Check browser settings - ensure localStorage is enabled
2. Check browser console for quota errors
3. Clear old data: Open DevTools → Application → Local Storage → Clear

### "Storage quota exceeded" error

**Cause:** Browser localStorage limit reached (~5-10MB).

**Solution:**

1. Export important analyses before clearing
2. Clear old analyses from the dashboard
3. Or clear localStorage: DevTools → Application → Local Storage → Clear `nvnc-local-*` keys

### Application not starting

**Cause:** Missing dependencies or configuration.

**Solution:**

```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Verify environment file exists
ls -la .env.local

# Check for syntax errors in .env.local
cat .env.local
```

### Login page shows Supabase form instead of local login

**Cause:** `LOCAL_STORAGE_MODE` flag not properly set.

**Solution:**

1. Ensure both flags are set in `.env.local`:
   ```bash
   FF_LOCAL_STORAGE_MODE=true
   NEXT_PUBLIC_FF_LOCAL_STORAGE_MODE=true
   ```
2. Restart the development server
3. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)

## Exporting Your Data

To backup your data before clearing localStorage:

1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Find keys starting with `nvnc-local-`
4. Right-click and copy the values
5. Save to a JSON file

Or use the export features in the application:

- Export individual analyses as PDF, Markdown, or JSON
- Export generated documents in various formats

## Upgrading to Full Mode

When you're ready for production deployment with multi-user support:

1. Set up a [Supabase](https://supabase.com) project
2. Run the database migrations from `supabase/migrations/`
3. Update `.env.local`:
   ```bash
   FF_LOCAL_STORAGE_MODE=false
   NEXT_PUBLIC_FF_LOCAL_STORAGE_MODE=false
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Restart the application

Note: Data from Open Source Mode cannot be automatically migrated to Full Mode.

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check the [docs/](../docs/) folder for more guides
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md) for technical details

---

_Last updated: December 2, 2025_
