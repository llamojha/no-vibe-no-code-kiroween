#!/bin/bash

# PostHog Configuration Check Script
# This script checks if PostHog environment variables are configured

echo "=================================================="
echo "PostHog Configuration Check"
echo "=================================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found"
    echo "   Create .env.local and add PostHog configuration"
    echo ""
    exit 1
fi

# Check for PostHog API key
if grep -q "NEXT_PUBLIC_POSTHOG_KEY=" .env.local; then
    KEY_VALUE=$(grep "NEXT_PUBLIC_POSTHOG_KEY=" .env.local | cut -d '=' -f 2)
    if [ -z "$KEY_VALUE" ] || [ "$KEY_VALUE" = "your_posthog_project_api_key" ]; then
        echo "⚠️  NEXT_PUBLIC_POSTHOG_KEY is set but not configured"
        echo "   Update with your actual PostHog API key"
    else
        echo "✅ NEXT_PUBLIC_POSTHOG_KEY is configured"
    fi
else
    echo "❌ NEXT_PUBLIC_POSTHOG_KEY not found in .env.local"
    echo "   Add: NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here"
fi

echo ""

# Check for PostHog host
if grep -q "NEXT_PUBLIC_POSTHOG_HOST=" .env.local; then
    HOST_VALUE=$(grep "NEXT_PUBLIC_POSTHOG_HOST=" .env.local | cut -d '=' -f 2)
    if [ -z "$HOST_VALUE" ]; then
        echo "⚠️  NEXT_PUBLIC_POSTHOG_HOST is set but empty"
        echo "   Update with: https://us.i.posthog.com or https://eu.i.posthog.com"
    else
        echo "✅ NEXT_PUBLIC_POSTHOG_HOST is configured: $HOST_VALUE"
    fi
else
    echo "❌ NEXT_PUBLIC_POSTHOG_HOST not found in .env.local"
    echo "   Add: NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com"
fi

echo ""
echo "=================================================="
echo "Configuration Status"
echo "=================================================="

# Check if both are configured
if grep -q "NEXT_PUBLIC_POSTHOG_KEY=" .env.local && grep -q "NEXT_PUBLIC_POSTHOG_HOST=" .env.local; then
    KEY_VALUE=$(grep "NEXT_PUBLIC_POSTHOG_KEY=" .env.local | cut -d '=' -f 2)
    HOST_VALUE=$(grep "NEXT_PUBLIC_POSTHOG_HOST=" .env.local | cut -d '=' -f 2)

    if [ ! -z "$KEY_VALUE" ] && [ "$KEY_VALUE" != "your_posthog_project_api_key" ] && [ ! -z "$HOST_VALUE" ]; then
        echo "✅ PostHog is fully configured and ready to use"
        echo ""
        echo "Next steps:"
        echo "1. Start the development server: npm run dev"
        echo "2. Check console for PostHog initialization"
        echo "3. Perform tracked actions and verify in PostHog dashboard"
    else
        echo "⚠️  PostHog is partially configured"
        echo ""
        echo "To enable PostHog analytics:"
        echo "1. Sign up at https://posthog.com"
        echo "2. Create a new project"
        echo "3. Copy your API key"
        echo "4. Update .env.local with your API key and host"
    fi
else
    echo "❌ PostHog is not configured"
    echo ""
    echo "To enable PostHog analytics, add to .env.local:"
    echo ""
    echo "NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key"
    echo "NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com"
fi

echo ""
