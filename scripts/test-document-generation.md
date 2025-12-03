# Testing Document Generation Feature

## Setup Complete ✅

The document generation feature is now enabled with:

- `FF_ENABLE_DOCUMENT_GENERATION=true`
- `NEXT_PUBLIC_FF_ENABLE_DOCUMENT_GENERATION=true`

## How to Test

### Step 1: Access the Application

1. Open your browser and go to: **http://localhost:3001**
2. Log in with your credentials

### Step 2: Navigate to Dashboard

1. Click on "Dashboard" in the navigation
2. You should see your ideas listed

### Step 3: Open the First Idea

1. Click on the first idea card (or the "Manage" button)
2. This will take you to the Idea Panel at `/idea/[ideaId]`

### Step 4: Generate Documents

You should now see the document generation interface with:

#### Document Progress Indicator

- Shows workflow: Analysis → PRD → Technical Design → Architecture → Roadmap
- Displays completion status for each document type
- Highlights the next recommended document

#### Generation Buttons

You'll see buttons for:

- **Generate PRD** (50 credits)
- **Generate Technical Design** (75 credits)
- **Generate Architecture** (75 credits)
- **Generate Roadmap** (50 credits)

### Step 5: Generate a PRD (Recommended First)

1. Click "Generate PRD"
2. You'll be taken to `/generate/prd/[ideaId]`
3. Review the context displayed:
   - Your idea text
   - Analysis summary (if available)
   - Existing documents (if any)
   - Credit cost (50 credits)
4. Click "Generate Product Requirements Document"
5. Wait for AI generation (progress messages will rotate)
6. Upon success, you'll be redirected back to the Idea Panel
7. The PRD will now appear in your documents list

### Step 6: Generate Other Documents

Follow the same process for:

- Technical Design (references PRD if available)
- Architecture (references Technical Design if available)
- Roadmap (references PRD and Technical Design if available)

## Features to Test

### ✅ Credit System

- Check your credit balance before generation
- Verify credits are deducted after successful generation
- Test insufficient credits error (if balance is low)

### ✅ Version Management

- Edit a generated document
- Save changes (creates new version)
- View version history
- Restore previous versions

### ✅ Export Functionality

- Export as Markdown (.md file)
- Export as PDF (formatted document)

### ✅ Regeneration

- Click "Regenerate" on an existing document
- Confirm the action (costs credits)
- New version is created, old version preserved

### ✅ Error Handling

- Test with insufficient credits
- Test network errors (disconnect internet briefly)
- Verify credits are refunded on failure

### ✅ Feature Flag

- Disable the feature flag in `.env.local`
- Restart server
- Verify buttons are hidden
- Re-enable to continue testing

## Expected Behavior

### Document Generation Flow

1. **Pre-Generation**: Credit check, context loading
2. **Generation**: AI processing with progress feedback
3. **Post-Generation**: Save to database, credit deduction, navigation back
4. **Display**: Document appears in Idea Panel with all metadata

### Context-Aware Generation

- PRD uses: idea text + analysis
- Technical Design uses: idea text + PRD (if exists)
- Architecture uses: idea text + Technical Design (if exists)
- Roadmap uses: idea text + PRD + Technical Design (if exists)

### Version Control

- Each edit creates a new version
- All versions preserved (immutable history)
- Version numbers increment (1, 2, 3, ...)
- Latest version displayed by default

## Troubleshooting

### Buttons Not Visible

- Check feature flag is enabled in `.env.local`
- Restart dev server after changing environment variables
- Clear browser cache

### Generation Fails

- Check Gemini API key is valid
- Check credit balance is sufficient
- Check network connection
- View browser console for errors

### Credits Not Deducted

- Check if mock mode is enabled (`FF_USE_MOCK_API=true`)
- In mock mode, credits are simulated
- Disable mock mode for real credit operations

## Mock Mode Note

Your `.env.local` has mock mode enabled:

```
FF_USE_MOCK_API=true
NEXT_PUBLIC_FF_USE_MOCK_API=true
```

This means:

- AI generation uses mock responses (faster, no API costs)
- Credits are simulated (not real deductions)
- Perfect for testing the UI and flow

To test with real AI:

1. Set `FF_USE_MOCK_API=false`
2. Set `NEXT_PUBLIC_FF_USE_MOCK_API=false`
3. Restart the dev server

## Next Steps

After testing the basic flow, try:

1. Generate all 4 document types for one idea
2. Edit documents and create multiple versions
3. Export documents in both formats
4. Test the version history and restoration
5. Test regeneration (creates new version)
6. Test with different ideas

## Support

If you encounter issues:

1. Check browser console for errors
2. Check server logs in terminal
3. Verify database migrations are applied
4. Check Supabase for data persistence

---

**Ready to test!** Open http://localhost:3001 and follow the steps above.
