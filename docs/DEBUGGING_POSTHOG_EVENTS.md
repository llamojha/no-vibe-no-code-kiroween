# Debugging PostHog Events

This guide shows you how to verify that PostHog events are being captured correctly.

## 🌐 Method 1: Network Tab (Recommended)

**Best for**: Verifying events are actually being sent to PostHog

### Steps:

1. **Open DevTools**

   - Chrome/Edge: `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Firefox: `F12` or `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)

2. **Go to Network Tab**

   - Click the "Network" tab in DevTools

3. **Filter Requests**

   - Type `ingest` in the filter box
   - Or type `posthog` to see all PostHog-related requests

4. **Perform an Action**

   - Generate an analysis
   - Export a report
   - Toggle animation
   - etc.

5. **Look for Requests**
   - You should see: `POST /ingest/batch` with status `200 OK`
   - Click on the request to see details

### What You'll See:

**Request URL:**

```
https://your-domain.com/ingest/batch
```

**Request Payload (click "Payload" tab):**

```json
{
  "api_key": "phc_...",
  "batch": [
    {
      "event": "report_generated",
      "properties": {
        "report_type": "startup",
        "idea_length": 42,
        "user_id": "abc-123-def-456",
        "timestamp": "2025-11-12T23:30:00.000Z",
        "$lib": "web",
        "$lib_version": "1.x.x"
      },
      "timestamp": "2025-11-12T23:30:00.000Z"
    }
  ]
}
```

**Response (click "Response" tab):**

```json
{
  "status": 1
}
```

### Troubleshooting Network Issues:

❌ **No requests appearing?**

- PostHog might not be initialized
- Check console for errors
- Verify environment variables are set

❌ **Requests failing (4xx/5xx)?**

- Check API key is correct
- Verify PostHog host URL
- Check for CORS issues

❌ **Requests blocked by ad blocker?**

- The reverse proxy should prevent this
- Try disabling ad blocker temporarily
- Check that `/ingest/` requests go to your domain, not PostHog directly

---

## 🖥️ Method 2: Console Logs (For Development)

**Best for**: Quick debugging during development

### Option A: Built-in Debug Logs (Already Added!)

I've added console logs to all tracking functions. You'll now see:

```javascript
[PostHog] 📊 report_generated {report_type: "startup", idea_length: 42, ...}
[PostHog] 🧟 frankenstein_roll {mode: "aws", slot_count: 3, ...}
[PostHog] 🏠 homepage_interaction {action: "animation_toggle", ...}
[PostHog] 💡 idea_enhancement {action: "add_suggestion", ...}
[PostHog] 📤 report_exported {format: "markdown", success: true, ...}
[PostHog] 👤 identify {userId: "abc-123", email: "user@example.com", ...}
```

**To see these:**

1. Open DevTools → Console tab
2. Perform actions in the app
3. Watch for `[PostHog]` logs

**To remove these logs** (for production):

- Search for `// Debug logging (remove in production)` in `features/analytics/tracking.ts`
- Delete the `console.log` lines

### Option B: Enable PostHog Debug Mode

Type this in the browser console:

```javascript
posthog.debug();
```

You'll see detailed PostHog internal logs:

```
[PostHog] Tracking event: report_generated
[PostHog] Event properties: {report_type: "startup", ...}
[PostHog] Sending batch of 1 events
[PostHog] Batch sent successfully
```

To disable:

```javascript
posthog.debug(false);
```

---

## 🔍 Method 3: PostHog Dashboard (Real-time)

**Best for**: Verifying events reach PostHog servers

### Steps:

1. **Open PostHog Dashboard**

   - Go to: https://us.i.posthog.com (or your PostHog host)
   - Log in to your account

2. **Go to Events Tab**

   - Click "Events" in the left sidebar
   - Or go to: https://us.i.posthog.com/events

3. **Perform Actions**

   - In your app, perform tracked actions
   - Events should appear within 5-10 seconds

4. **Click on Events**
   - Click any event to see full details
   - Check all properties are correct

### What You'll See:

**Events List:**

```
report_generated          2 minutes ago
frankenstein_roll         3 minutes ago
homepage_interaction      5 minutes ago
```

**Event Details (click on event):**

```json
{
  "event": "report_generated",
  "timestamp": "2025-11-12T23:30:00.000Z",
  "distinct_id": "abc-123-def-456",
  "properties": {
    "report_type": "startup",
    "idea_length": 42,
    "user_id": "abc-123-def-456",
    "timestamp": "2025-11-12T23:30:00.000Z",
    "$browser": "Chrome",
    "$device_type": "Desktop",
    "$current_url": "http://localhost:3000/analyzer"
  }
}
```

---

## 🧪 Quick Test Checklist

Use this checklist to verify all events are working:

### 1. User Identification

- [ ] Log in
- [ ] Check console: `[PostHog] 👤 identify`
- [ ] Check network: Request to `/ingest/batch`
- [ ] Check PostHog: User appears in People tab

### 2. Report Generation

- [ ] Generate startup analysis
- [ ] Check console: `[PostHog] 📊 report_generated`
- [ ] Check network: Request with `event: "report_generated"`
- [ ] Check PostHog: Event appears in Events tab

### 3. Export

- [ ] Export as Markdown
- [ ] Check console: `[PostHog] 📤 report_exported`
- [ ] Check network: Request with `event: "report_exported"`
- [ ] Check PostHog: Event with `format: "markdown"`

### 4. Dr. Frankenstein

- [ ] Click "Create Frankenstein"
- [ ] Check console: `[PostHog] 🧟 frankenstein_roll`
- [ ] Check network: Request with `event: "frankenstein_roll"`
- [ ] Check PostHog: Event with `mode` and `slot_count`

### 5. Homepage

- [ ] Toggle animation
- [ ] Check console: `[PostHog] 🏠 homepage_interaction`
- [ ] Check network: Request with `event: "homepage_interaction"`
- [ ] Check PostHog: Event with `animation_state`

---

## 🐛 Common Issues

### Issue: No console logs appearing

**Possible causes:**

- PostHog not initialized
- Environment variables not set
- Browser console filter hiding logs

**Solutions:**

1. Check environment variables:
   ```bash
   ./scripts/check-posthog-config.sh
   ```
2. Restart dev server:
   ```bash
   npm run dev
   ```
3. Clear console filters (click the filter icon)

### Issue: Console logs but no network requests

**Possible causes:**

- PostHog SDK not loaded
- JavaScript error preventing capture
- Ad blocker blocking requests

**Solutions:**

1. Check browser console for errors
2. Verify PostHog SDK loaded: `window.posthog` should exist
3. Temporarily disable ad blocker
4. Check Network tab for blocked requests (red)

### Issue: Network requests but events not in PostHog

**Possible causes:**

- Wrong API key
- Wrong PostHog host
- Events filtered in PostHog dashboard

**Solutions:**

1. Verify API key in `.env.local`
2. Check PostHog host URL is correct
3. Check PostHog dashboard filters (time range, event filters)
4. Wait 10-30 seconds for events to appear

### Issue: Events missing properties

**Possible causes:**

- Properties not passed to tracking function
- Properties undefined/null
- TypeScript errors

**Solutions:**

1. Check console logs to see what's being sent
2. Verify all required properties are provided
3. Check for TypeScript errors: `npm run build`

---

## 📊 Monitoring in Production

### Enable Selective Logging

Instead of logging all events, log only errors:

```typescript
// In features/analytics/tracking.ts
export const trackReportGeneration = (props: ReportGenerationProps): void => {
  if (!isPostHogAvailable()) {
    console.warn(
      "[PostHog] Not available - event not tracked:",
      "report_generated"
    );
    return;
  }

  try {
    const eventData = {
      /* ... */
    };
    posthog.capture("report_generated", eventData);
  } catch (error) {
    console.error("[Analytics] Failed to track report generation:", error);
    // Optional: Send to error tracking service (Sentry, etc.)
  }
};
```

### Use PostHog's Built-in Monitoring

PostHog provides:

- **Event volume graphs**: See event trends over time
- **Property breakdown**: Analyze event properties
- **User paths**: See user journey through events
- **Funnels**: Track conversion through event sequences

---

## 🎯 Best Practices

1. **Use Network Tab for verification** - Most reliable way to confirm events are sent
2. **Use Console for quick debugging** - Fast feedback during development
3. **Use PostHog Dashboard for validation** - Verify events reach the server
4. **Remove debug logs in production** - Keep console clean
5. **Monitor error rates** - Track failed event captures
6. **Test with ad blockers** - Verify reverse proxy works

---

## 📝 Example Debugging Session

```bash
# 1. Start dev server
npm run dev

# 2. Open browser to http://localhost:3000
# 3. Open DevTools (F12)
# 4. Go to Console tab
# 5. Go to Network tab
# 6. Filter by "ingest"

# 7. Perform action (e.g., generate analysis)

# Expected in Console:
# [PostHog] 📊 report_generated {report_type: "startup", ...}

# Expected in Network:
# POST /ingest/batch - Status: 200 OK

# 8. Check PostHog dashboard
# Go to: https://us.i.posthog.com/events
# See: report_generated event within 10 seconds

# ✅ Success! Event captured and sent to PostHog
```

---

**Need more help?** See:

- `tests/integration/QUICK_START.md` - Quick testing guide
- `tests/integration/POSTHOG_TESTING_GUIDE.md` - Comprehensive testing
- `docs/POSTHOG_EVENTS_REFERENCE.md` - All events reference
