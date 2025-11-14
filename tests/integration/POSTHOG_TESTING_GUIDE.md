# PostHog Analytics Integration Testing Guide

This guide provides comprehensive instructions for testing the PostHog analytics integration in the No Vibe No Code application.

## Prerequisites

1. **PostHog Account**: Create a free account at [posthog.com](https://posthog.com)
2. **Project Setup**: Create a new project in PostHog
3. **API Key**: Obtain your project API key from PostHog settings

## Environment Configuration

### Step 1: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# PostHog Analytics Configuration
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

**Note**: Replace `phc_your_project_api_key_here` with your actual PostHog API key.

### Step 2: Verify Configuration

Run the following command to check if PostHog is configured:

```bash
npm run dev
```

Check the console for:

- ✅ "PostHog server-side client initialized successfully" (server-side)
- ✅ No warnings about missing PostHog configuration

## Automated Tests

### Run Integration Tests

```bash
npm test tests/integration/posthog-analytics.test.ts
```

This will verify:

- ✅ All tracking functions accept correct parameters
- ✅ Type safety is enforced
- ✅ Error handling works correctly
- ✅ Functions don't throw when PostHog is not configured

## Manual Testing Checklist

### 1. PostHog Initialization

#### Client-Side Initialization

- [ ] Start the development server: `npm run dev`
- [ ] Open browser console
- [ ] Navigate to the homepage
- [ ] Verify no PostHog initialization errors in console
- [ ] Check that PostHog is loaded: `window.posthog` should be defined

#### Server-Side Initialization

- [ ] Check server logs for "PostHog server-side client initialized successfully"
- [ ] Verify no errors during server startup

### 2. User Identification

#### Test User Login

- [ ] Navigate to `/login`
- [ ] Log in with a test account
- [ ] Open PostHog dashboard → People
- [ ] Verify your user appears with correct properties:
  - User ID
  - Email
  - Created date

### 3. Report Generation Events

#### Startup Analyzer

- [ ] Navigate to `/analyzer`
- [ ] Enter a startup idea
- [ ] Click "Analyze"
- [ ] Wait for analysis to complete
- [ ] Check PostHog dashboard → Events
- [ ] Verify `report_generated` event with:
  - `report_type: "startup"`
  - `idea_length: <number>`
  - `user_id: <your_user_id>`
  - `timestamp: <ISO_8601_timestamp>`

#### Kiroween Analyzer

- [ ] Navigate to `/kiroween-analyzer`
- [ ] Enter a hackathon project
- [ ] Click "Analyze"
- [ ] Wait for analysis to complete
- [ ] Check PostHog dashboard → Events
- [ ] Verify `report_generated` event with:
  - `report_type: "kiroween"`
  - `idea_length: <number>`
  - `user_id: <your_user_id>`

#### Dr. Frankenstein

- [ ] Navigate to `/doctor-frankenstein`
- [ ] Click "Roll" button
- [ ] Wait for idea generation
- [ ] Check PostHog dashboard → Events
- [ ] Verify `report_generated` event with:
  - `report_type: "frankenstein"`
  - `user_id: <your_user_id>`

### 4. Dr. Frankenstein Interaction Events

#### Roll Action

- [ ] Navigate to `/doctor-frankenstein`
- [ ] Click "Roll" button multiple times
- [ ] Check PostHog dashboard → Events
- [ ] Verify `frankenstein_roll` events with:
  - `mode: "aws" | "tech_companies"`
  - `slot_count: 3 | 4`
  - `roll_count: <number>`

#### Mode Selection

- [ ] Toggle between AWS and Tech Companies modes
- [ ] Check PostHog dashboard → Events
- [ ] Verify `frankenstein_mode_select` events with:
  - `mode: "aws" | "tech_companies"`

#### Slot Configuration

- [ ] Toggle between 3 and 4 slots
- [ ] Check PostHog dashboard → Events
- [ ] Verify `frankenstein_slot_config` events with:
  - `slot_count: 3 | 4`

### 5. Export Events

#### Analyzer Export

- [ ] Generate an analysis in `/analyzer`
- [ ] Click "Export as Markdown"
- [ ] Check PostHog dashboard → Events
- [ ] Verify `report_exported` event with:

  - `format: "markdown"`
  - `report_type: "startup"`
  - `success: true`

- [ ] Click "Export as Text"
- [ ] Verify `report_exported` event with:
  - `format: "txt"`
  - `success: true`

#### Kiroween Export

- [ ] Generate an analysis in `/kiroween-analyzer`
- [ ] Test all export formats (Markdown, Text)
- [ ] Verify events for each format

#### Frankenstein Export

- [ ] Generate an idea in `/doctor-frankenstein`
- [ ] Test all export formats (PDF, Markdown, JSON)
- [ ] Verify events for each format

### 6. Homepage Interaction Events

#### Animation Toggle

- [ ] Navigate to homepage `/`
- [ ] Click the animation toggle button
- [ ] Check PostHog dashboard → Events
- [ ] Verify `homepage_interaction` event with:

  - `action: "animation_toggle"`
  - `animation_state: "enabled" | "disabled"`
  - `device_type: "mobile" | "tablet" | "desktop"`

- [ ] Toggle animation multiple times
- [ ] Verify each toggle creates a new event

### 7. Idea Enhancement Events

**Note**: This feature may not be fully implemented yet. Test if available.

- [ ] Navigate to `/analyzer`
- [ ] Generate an analysis
- [ ] Add a suggestion or modify the idea
- [ ] Check PostHog dashboard → Events
- [ ] Verify `idea_enhancement` event with:
  - `action: "add_suggestion" | "modify_idea"`
  - `analysis_type: "startup" | "kiroween"`
  - `suggestion_length: <number>` (if applicable)

### 8. Reverse Proxy Testing

#### Test with Ad Blocker

- [ ] Install an ad blocker (e.g., uBlock Origin)
- [ ] Enable the ad blocker
- [ ] Perform any tracked action (e.g., generate analysis)
- [ ] Check PostHog dashboard → Events
- [ ] Verify events are still captured (reverse proxy bypasses ad blockers)

#### Test Proxy Endpoints

- [ ] Open browser DevTools → Network tab
- [ ] Perform a tracked action
- [ ] Look for requests to `/ingest/`
- [ ] Verify requests go through your domain, not PostHog directly

### 9. Graceful Degradation Testing

#### Test Without PostHog Configuration

- [ ] Remove PostHog environment variables from `.env.local`
- [ ] Restart the development server
- [ ] Perform various actions (analyze, export, etc.)
- [ ] Verify application works normally
- [ ] Check console for warning: "PostHog not configured"
- [ ] Verify no errors are thrown

#### Test with Invalid Configuration

- [ ] Set `NEXT_PUBLIC_POSTHOG_KEY=invalid_key`
- [ ] Restart the development server
- [ ] Perform tracked actions
- [ ] Verify application continues to work
- [ ] Check console for errors (should be logged but not thrown)

### 10. Error Handling Testing

#### Test Network Failures

- [ ] Open browser DevTools → Network tab
- [ ] Set network throttling to "Offline"
- [ ] Perform tracked actions
- [ ] Verify application continues to work
- [ ] Check console for error logs (should be logged, not thrown)
- [ ] Re-enable network
- [ ] Verify subsequent events are captured

#### Test Invalid Event Properties

- [ ] Open browser console
- [ ] Try calling tracking functions with invalid data:
  ```javascript
  window.trackReportGeneration({ reportType: "invalid" });
  ```
- [ ] Verify TypeScript prevents this at compile time
- [ ] Verify runtime doesn't crash if called

### 11. Event Properties Verification

For each event type, verify all properties are present and correct:

#### Report Generated Event

```json
{
  "event": "report_generated",
  "properties": {
    "report_type": "startup | kiroween | frankenstein",
    "idea_length": 123,
    "user_id": "user-uuid",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Frankenstein Interaction Events

```json
{
  "event": "frankenstein_roll | frankenstein_mode_select | frankenstein_slot_config",
  "properties": {
    "mode": "aws | tech_companies",
    "slot_count": 3 | 4,
    "roll_count": 5,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Homepage Interaction Event

```json
{
  "event": "homepage_interaction",
  "properties": {
    "action": "animation_toggle",
    "animation_state": "enabled | disabled",
    "device_type": "mobile | tablet | desktop",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Export Event

```json
{
  "event": "report_exported",
  "properties": {
    "format": "pdf | markdown | json | txt",
    "report_type": "startup | kiroween | frankenstein",
    "success": true | false,
    "error_message": "Error description (if failed)",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 12. Server-Side Tracking Testing

#### Test API Route Tracking

- [ ] Make API calls to analysis endpoints
- [ ] Check server logs for tracking events
- [ ] Verify events appear in PostHog dashboard
- [ ] Check for `source: "server"` and `user_tier` properties

#### Test Error Tracking

- [ ] Trigger an error in an API route (e.g., invalid input)
- [ ] Check PostHog dashboard for `server_error` event
- [ ] Verify error and `user_tier` properties are captured

## PostHog Dashboard Verification

### Events to Verify

1. Navigate to PostHog dashboard → Events
2. Verify the following events appear:
   - `report_generated`
   - `frankenstein_roll`
   - `frankenstein_mode_select`
   - `frankenstein_slot_config`
   - `homepage_interaction`
   - `idea_enhancement` (if implemented)
   - `report_exported`
   - `server_analysis_request` (server-side)
   - `server_error` (server-side)

### User Identification

1. Navigate to PostHog dashboard → People
2. Verify users appear with correct properties
3. Check that events are associated with correct users

### Event Properties

1. Click on any event in the dashboard
2. Verify all expected properties are present
3. Check that timestamps are correct
4. Verify property values match expected types

## Performance Testing

### Page Load Impact

- [ ] Measure page load time without PostHog
- [ ] Enable PostHog and measure again
- [ ] Verify minimal impact (< 100ms difference)

### Event Capture Performance

- [ ] Perform rapid actions (e.g., multiple clicks)
- [ ] Verify all events are captured
- [ ] Check that UI remains responsive

## Troubleshooting

### Events Not Appearing in PostHog

1. **Check Configuration**

   - Verify `NEXT_PUBLIC_POSTHOG_KEY` is set correctly
   - Verify `NEXT_PUBLIC_POSTHOG_HOST` is set correctly
   - Restart development server after changes

2. **Check Browser Console**

   - Look for PostHog initialization errors
   - Check for network errors to `/ingest/` endpoints

3. **Check Server Logs**

   - Look for "PostHog server-side client initialized successfully"
   - Check for any error messages

4. **Check PostHog Dashboard**
   - Events may take a few seconds to appear
   - Try refreshing the dashboard
   - Check the time range filter

### Ad Blocker Issues

1. **Verify Reverse Proxy**

   - Check `next.config.js` has rewrite rules
   - Verify requests go to `/ingest/` not PostHog directly

2. **Test Without Ad Blocker**
   - Disable ad blocker temporarily
   - If events appear, reverse proxy may not be working

### Type Errors

1. **Check TypeScript Version**

   - Ensure TypeScript is up to date
   - Run `npm install` to update dependencies

2. **Check Import Paths**
   - Verify imports use correct paths
   - Check that tracking functions are exported correctly

## Success Criteria

All tests pass when:

- ✅ PostHog initializes without errors
- ✅ All event types are captured correctly
- ✅ Event properties are complete and accurate
- ✅ User identification works correctly
- ✅ Reverse proxy bypasses ad blockers
- ✅ Application works without PostHog configured
- ✅ Error handling prevents crashes
- ✅ No performance degradation
- ✅ Events appear in PostHog dashboard within seconds

## Next Steps

After completing all tests:

1. Document any issues found
2. Verify fixes for any issues
3. Update this guide with any new findings
4. Mark task as complete in tasks.md
