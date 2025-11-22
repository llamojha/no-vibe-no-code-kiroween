# Idea Panel Test Instructions

## Quick Start

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Visit one of these test URLs:

### Test URL 1: Manual Idea with Documents

```
http://localhost:3000/idea/123e4567-e89b-12d3-a456-426614174000
```

This shows:

- ✅ Manual entry idea (coffee drone delivery)
- ✅ 2 documents (startup analysis + hackathon analysis)
- ✅ Status: "Idea"
- ✅ No notes or tags

### Test URL 2: Frankenstein Idea (No Documents)

```
http://localhost:3000/idea/frank-123
```

This shows:

- ✅ Doctor Frankenstein generated idea (Stripe + Notion)
- ✅ No documents yet (shows "No analyses yet" message)
- ✅ Status: "In Progress"
- ✅ Has notes and tags

## What to Test

### Layout & Navigation

- [ ] Breadcrumb navigation back to dashboard works
- [ ] Language toggle works (EN/ES)
- [ ] Responsive design on mobile (resize browser)
- [ ] Sticky header stays at top when scrolling

### Idea Details Section

- [ ] Idea text displays prominently
- [ ] Source badge shows correctly (Manual Entry vs Doctor Frankenstein)
- [ ] Creation and update dates display
- [ ] Responsive layout on mobile

### Project Status Control

- [ ] Current status displays with correct color and icon
- [ ] Dropdown opens when clicking "Update Status"
- [ ] All 4 status options visible (Idea, In Progress, Completed, Archived)
- [ ] Current status is highlighted in dropdown
- [ ] Clicking outside closes dropdown
- [ ] Last updated timestamp shows

### Analyze Button

- [ ] Button displays prominently
- [ ] Dropdown opens with 2 options
- [ ] Startup Analysis option shows icon and description
- [ ] Hackathon Analysis option shows icon and description
- [ ] Clicking option navigates to analyzer (will show 404 for now - that's expected)

### Documents List Section

- [ ] Shows "No analyses yet" when no documents (frank-123 URL)
- [ ] Lists all documents when present (first URL)
- [ ] Document type icons display correctly
- [ ] Click to expand/collapse document details
- [ ] Startup analysis shows: Final Score, Market Demand, Uniqueness
- [ ] Hackathon analysis shows: Overall Score, Technical, Creativity, Impact
- [ ] Summary section displays when available

### Accessibility

- [ ] Tab navigation works through all interactive elements
- [ ] Focus indicators visible
- [ ] Screen reader labels present (check with browser inspector)

## Known Limitations (Mock Data)

- Status updates don't persist (just console logs)
- Analyze button navigation will 404 (analyzers not updated yet)
- No real API calls (all mock data)
- Only 2 test IDs work (the ones listed above)

## Next Steps

Once you're happy with the UX, the next tasks are:

- Task 11: Notes and Tags sections
- Task 12.1: IdeaPanelView component (wires everything together)
- Task 12.2: Update Dashboard to link here
- Task 8: API routes for real data
