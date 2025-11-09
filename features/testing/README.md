# Testing Features

This directory contains components and utilities related to testing and development workflows.

## MockModeIndicator Component

The `MockModeIndicator` component displays a visual indicator when the application is running in mock mode.

### Features

- **Visual Indicator**: Shows a distinctive yellow badge with a test tube emoji (🧪) in the bottom-right corner
- **Production Safety**: Never displays in production environments, even if the flag is accidentally set
- **Accessibility**: Includes proper ARIA labels and live region for screen readers
- **Distinctive Styling**: Uses yellow background with pulse animation to make it clearly visible

### Usage

The component is automatically integrated into the root layout (`app/layout.tsx`) and requires no manual integration in individual pages.

### Configuration

To enable the mock mode indicator, set the following environment variable:

```bash
NEXT_PUBLIC_FF_USE_MOCK_API=true
```

**Note**: This is a client-side environment variable (prefixed with `NEXT_PUBLIC_`) that controls the visibility of the indicator. The server-side mock functionality is controlled by `FF_USE_MOCK_API`.

### Requirements

- Requirement 3.5: Visual indicator for mock mode
- Only visible in non-production environments
- Positioned in bottom-right corner with z-index 50
- Uses Tailwind CSS for styling

### Example

When mock mode is active in development:

```
┌─────────────────────────────────────┐
│                                     │
│         Application Content         │
│                                     │
│                                     │
│                  ┌──────────────────┤
│                  │ 🧪 Mock Mode     │
│                  │    Active        │
└──────────────────┴──────────────────┘
```

### Testing

To test the indicator:

1. Set `NEXT_PUBLIC_FF_USE_MOCK_API=true` in your `.env.local` file
2. Restart the development server
3. The indicator should appear in the bottom-right corner of all pages
4. Set `NODE_ENV=production` to verify it doesn't appear in production mode

### Related Files

- `features/testing/components/MockModeIndicator.tsx` - Component implementation
- `app/layout.tsx` - Integration point
- `lib/testing/FeatureFlagManager.ts` - Server-side flag management
