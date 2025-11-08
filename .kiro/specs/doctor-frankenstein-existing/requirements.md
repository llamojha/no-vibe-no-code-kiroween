# Requirements Document

## Introduction

Doctor Frankenstein is an AI-powered feature that generates innovative startup ideas by combining random technologies from two different sources: well-known tech companies or AWS services. The feature provides an interactive slot machine experience where users can "spin" to randomly select technologies, then uses AI to analyze the combination and generate a detailed startup idea with visual representation.

## Glossary

- **Doctor Frankenstein System**: The complete feature that combines technologies and generates startup ideas
- **Slot Machine Component**: The animated UI component that displays spinning technology selections
- **Technology Mode**: Either "Tech Companies" or "AWS Services" selection mode
- **Frankenstein Diagram**: Visual representation showing the fusion of two selected technologies
- **AI Analysis Engine**: The backend service that generates startup ideas based on technology combinations
- **Technology Catalog**: The data source containing tech companies or AWS services information
- **Locale System**: The internationalization system supporting English and Spanish

## Requirements

### Requirement 1

**User Story:** As a user, I want to select between Tech Companies and AWS Services modes, so that I can generate ideas from different technology sources

#### Acceptance Criteria

1. WHEN the user loads the Doctor Frankenstein page, THE Doctor Frankenstein System SHALL display a mode toggle with "Tech Companies" and "AWS Services" options
2. WHEN the user clicks a mode toggle option, THE Doctor Frankenstein System SHALL switch to the selected mode and preserve the previous mode's state
3. WHILE in Tech Companies mode, THE Doctor Frankenstein System SHALL load and display technologies from the tech companies catalog
4. WHILE in AWS Services mode, THE Doctor Frankenstein System SHALL load and display technologies from the AWS services catalog
5. WHEN the user switches modes, THE Doctor Frankenstein System SHALL maintain independent state for each mode including selections and results

### Requirement 2

**User Story:** As a user, I want to see an animated slot machine that randomly selects two technologies, so that I have an engaging experience when generating ideas

#### Acceptance Criteria

1. WHEN the user clicks the "Spin" button, THE Slot Machine Component SHALL animate for 3 seconds showing random technology names
2. WHILE the animation is running, THE Slot Machine Component SHALL disable the spin button to prevent multiple simultaneous spins
3. WHEN the animation completes, THE Slot Machine Component SHALL display two randomly selected technologies from the active catalog
4. THE Slot Machine Component SHALL ensure the two selected technologies are different from each other
5. WHEN technologies are selected, THE Slot Machine Component SHALL display the technology names with proper formatting and truncation for long names

### Requirement 3

**User Story:** As a user, I want the AI to analyze the technology combination and generate a detailed startup idea, so that I can explore innovative business concepts

#### Acceptance Criteria

1. WHEN two technologies are selected, THE AI Analysis Engine SHALL generate a startup idea combining both technologies
2. THE AI Analysis Engine SHALL provide the analysis in the user's current language (English or Spanish)
3. WHEN generating the analysis, THE Doctor Frankenstein System SHALL display a loading state with animated messages
4. THE AI Analysis Engine SHALL return a structured analysis including idea name, description, key features, target market, and unique value proposition
5. IF the AI Analysis Engine fails, THEN THE Doctor Frankenstein System SHALL display an error message to the user

### Requirement 4

**User Story:** As a user, I want to see a visual diagram showing how the two technologies combine, so that I can better understand the fusion concept

#### Acceptance Criteria

1. WHEN an analysis is generated, THE Frankenstein Diagram SHALL display both selected technologies with their names
2. THE Frankenstein Diagram SHALL show a central fusion point connecting the two technologies
3. WHEN the user hovers over a technology element, THE Frankenstein Diagram SHALL display a tooltip with the technology description
4. THE Frankenstein Diagram SHALL position tooltips dynamically to avoid edge overflow on small screens
5. WHERE a technology lacks a description, THE Frankenstein Diagram SHALL display a category-based fallback description

### Requirement 5

**User Story:** As a user, I want to regenerate the analysis if the language doesn't match my preference, so that I can read the content in my preferred language

#### Acceptance Criteria

1. WHEN the analysis language differs from the current UI language, THE Doctor Frankenstein System SHALL display a language mismatch warning
2. WHEN the user clicks the regenerate button, THE Doctor Frankenstein System SHALL request a new analysis in the current language
3. WHILE regenerating, THE Doctor Frankenstein System SHALL show a loading state
4. WHEN regeneration completes, THE Doctor Frankenstein System SHALL replace the previous analysis with the new one
5. THE Doctor Frankenstein System SHALL preserve the same technology selections during regeneration

### Requirement 6

**User Story:** As a user, I want to use the feature in English or Spanish, so that I can interact with it in my preferred language

#### Acceptance Criteria

1. THE Doctor Frankenstein System SHALL support English and Spanish languages through the Locale System
2. WHEN the user changes the language, THE Doctor Frankenstein System SHALL update all UI text immediately
3. THE Doctor Frankenstein System SHALL translate button labels, headings, and messages according to the selected language
4. WHEN requesting AI analysis, THE Doctor Frankenstein System SHALL specify the target language to the AI Analysis Engine
5. THE Locale System SHALL provide translations for all user-facing text including error messages

### Requirement 7

**User Story:** As a user, I want the feature to parse technology data from markdown files, so that the system has access to comprehensive technology information

#### Acceptance Criteria

1. THE Technology Catalog SHALL parse tech companies from a markdown file containing 356 companies
2. THE Technology Catalog SHALL parse AWS services from a markdown file containing 223 services
3. THE Technology Catalog SHALL handle Windows line endings and UTF-8 encoding correctly
4. WHERE a technology entry includes a description, THE Technology Catalog SHALL extract and store it
5. WHERE a technology entry lacks a description, THE Technology Catalog SHALL assign a category-based fallback description

### Requirement 8

**User Story:** As a user, I want the interface to be responsive and themed consistently, so that I have a good experience on any device

#### Acceptance Criteria

1. THE Doctor Frankenstein System SHALL use the Kiroween theme with purple, orange, and black colors
2. THE Doctor Frankenstein System SHALL be fully responsive on mobile, tablet, and desktop screen sizes
3. THE Slot Machine Component SHALL adapt its layout for small screens
4. THE Frankenstein Diagram SHALL adjust tooltip positioning based on element location to prevent overflow
5. THE Doctor Frankenstein System SHALL use consistent typography and spacing throughout the interface
