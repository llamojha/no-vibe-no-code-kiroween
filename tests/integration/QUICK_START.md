# PostHog Analytics - Quick Start Guide

## ✅ Configuration Complete!

Your PostHog analytics integration is now fully configured and ready to use.

## Quick Test Steps

### 1. Start the Development Server

```bash
npm run dev
```

**Expected Console Output:**

- ✅ "PostHog server-side client initialized successfully" (server console)
- ✅ No PostHog configuration warnings

### 2. Quick Smoke Test (5 minutes)

Open your browser to `http://localhost:3000` and perform these actions:

#### Test 1: User Identification (30 seconds)

1. Log in to your account
2. **Expected**: User should appear in PostHog → People tab within 10 seconds

#### Test 2: Report Generation (1 minute)

1. Navigate to `/analyzer`
2. Enter a startup idea: "AI-powered coffee maker"
3. Click "Analyze"
4. **Expected**: `report_generated` event in PostHog → Events tab

#### Test 3: Export Tracking (30 seconds)

1. After analysis completes, click "Export" dropdown
2. Click "Export as Markdown"
3. **Expected**: `report_exported` event in PostHog

#### Test 4: Dr. Frankenstein (1 minute)

1. Navigate to `/doctor-frankenstein`
2. Click "Create Frankenstein" button
3. **Expected**: `frankenstein_roll` event in PostHog
4. After slots stop, click "Accept & Generate Idea"
5. **Expected**: `report_generated` event with `reportType: "frankenstein"`

#### Test 5: Homepage Animation (30 seconds)

1. Navigate to `/`
2. Toggle the animation switch
3. **Expected**: `homepage_interaction` event in PostHog

### 3. Verify in PostHog Dashboard

1. Open your PostHog dashboard: https://eu.i.posthog.com
2. Go to **Events** tab
3. You should see events appearing within 5-10 seconds:

   - `report_generated`
   - `report_exported`
   - `frankenstein_roll`
   - `homepage_interaction`

4. Go to **People** tab
5. Your user should appear with:
   - User ID
   - Email
   - Created date

## Event Reference

### Events You Should See

| Event Name                 | Where to Trigger                      | Properties                                 |
| -------------------------- | ------------------------------------- | ------------------------------------------ |
| `report_generated`         | Analyzer, Kiroween, Frankenstein      | `report_type`, `idea_length`, `user_id`    |
| `frankenstein_roll`        | Dr. Frankenstein "Create" button      | `mode`, `slot_count`, `roll_count`         |
| `frankenstein_mode_select` | Dr. Frankenstein mode toggle          | `mode`                                     |
| `frankenstein_slot_config` | Dr. Frankenstein slot buttons         | `slot_count`                               |
| `homepage_interaction`     | Homepage animation toggle             | `action`, `animation_state`, `device_type` |
| `idea_enhancement`         | Adding suggestions or modifying ideas | `action`, `analysis_type`                  |
| `report_exported`          | Export buttons                        | `format`, `report_type`, `success`         |

## Troubleshooting

### Events Not Appearing?

1. **Check Browser Console**

   - Open DevTools → Console
   - Look for PostHog errors
   - Verify no ad blocker is blocking `/ingest/` requests

2. **Check Server Logs**

   - Look for "PostHog server-side client initialized successfully"
   - Check for any error messages

3. **Verify Network Requests**

   - Open DevTools → Network tab
   - Perform a tracked action
   - Look for requests to `/ingest/`
   - Should see 200 status codes

4. **Check PostHog Dashboard**
   - Events may take 5-10 seconds to appear
   - Try refreshing the dashboard
   - Check the time range filter

### Ad Blocker Issues?

The reverse proxy should bypass ad blockers, but if you're still having issues:

1. Temporarily disable your ad blocker
2. Check if events appear
3. If they do, the reverse proxy may need adjustment

### Still Having Issues?

1. Check environment variables are set correctly:

   ```bash
   ./scripts/check-posthog-config.sh
   ```

2. Restart the development server:

   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

3. Check the full testing guide:
   ```
   tests/integration/POSTHOG_TESTING_GUIDE.md
   ```

## Advanced Testing

For comprehensive testing of all features, see:

- **Full Testing Guide**: `tests/integration/POSTHOG_TESTING_GUIDE.md`
- **Verification Summary**: `tests/integration/POSTHOG_VERIFICATION_SUMMARY.md`

## Production Deployment

When deploying to production:

1. Add environment variables to your hosting platform:

   ```
   NEXT_PUBLIC_POSTHOG_KEY=phc_your_key
   NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
   ```

2. Verify the reverse proxy works in production

3. Test a few events to confirm everything works

4. Monitor the PostHog dashboard for incoming events

## Success Criteria

✅ You're all set when:

- User appears in PostHog People tab after login
- Events appear in PostHog Events tab within 10 seconds
- All event properties are populated correctly
- No errors in browser or server console
- Reverse proxy bypasses ad blockers

---

**Need Help?** Check the comprehensive testing guide at `tests/integration/POSTHOG_TESTING_GUIDE.md`
