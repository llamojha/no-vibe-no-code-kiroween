# Doctor Frankenstein Kiroween

## Overview

Doctor Frankenstein is a creative ideation tool that combines random technologies (either tech companies or AWS services) to generate innovative startup concepts. It uses AI to analyze the combinations and produce detailed reports similar to the Kiroween Analyzer.

## Features

- **Dual Mode**: Toggle between Tech Companies (356 companies) and AWS Services
- **Slot Machine Animation**: Visual slot machine effect when selecting random technologies
- **AI-Powered Analysis**: Uses Google Gemini to generate comprehensive startup ideas
- **Kiroween-Style Reports**: Produces detailed analysis with metrics and recommendations
- **Multilingual**: Supports English and Spanish

## Architecture

### Components

- **DoctorFrankensteinView**: Main view component with mode toggle and slot machine
- **FrankensteinSlotMachine**: Animated slot machine for technology selection

### API

- **generateFrankensteinIdea**: Server-side function that calls Gemini AI to generate ideas
- **POST /api/doctor-frankenstein/generate**: API endpoint for idea generation

### Utils

- **dataParser**: Parses markdown files containing tech companies and AWS services
- **selectRandom**: Utility for random selection without duplicates

## Data Sources

- `doctor-frankenstein/well_known_unique_tech_companies_300_400_frankenstein_mashups_catalog.md`: 356 unique tech companies
- `doctor-frankenstein/aws_services_products_full_list_as_of_nov_5_2025.md`: Comprehensive AWS services list

## Usage Flow

1. User selects mode (Tech Companies or AWS Services)
2. User clicks "Create Frankenstein" button
3. Slot machine animation plays for 3 seconds
4. 4 random technologies are selected
5. User can accept or reject the combination
6. If accepted, AI generates a detailed startup idea report
7. Report includes:
   - Idea title and description
   - Core concept and problem statement
   - Solution and value proposition
   - Target audience and business model
   - Growth strategy and tech stack
   - Risks and challenges
   - Metrics (originality, feasibility, impact, scalability, wow factor)
   - Summary

## Environment Variables

Requires `GEMINI_API_KEY` to be set in `.env.local`

## Translations

All UI text is internationalized using the locale system:
- English: `locales/en.json`
- Spanish: `locales/es.json`

## Future Enhancements

- Save generated ideas to database
- Share functionality
- Export reports
- Integration with GitHub issue creation
- More data sources (e.g., programming languages, frameworks)
