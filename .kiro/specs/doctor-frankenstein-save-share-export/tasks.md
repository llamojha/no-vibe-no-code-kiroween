# Implementation Plan

- [x] 1. Database Setup

  - [x] 1.1 Create database migration file


    - Write SQL migration for saved_frankenstein_ideas table
    - Add indexes for user_id and created_at
    - Enable Row Level Security
    - Create RLS policies for SELECT, INSERT, DELETE
    - _Requirements: 7.3_

  - [x] 1.2 Update TypeScript types


    - Add SavedFrankensteinIdeasRow type to lib/supabase/types.ts
    - Add SavedFrankensteinIdeasInsert type
    - Add SavedFrankensteinIdeasUpdate type
    - Export new types
    - _Requirements: 7.3_

  - [x] 1.3 Create mapper functions


    - Implement mapSavedFrankensteinIdea function in lib/supabase/mappers.ts
    - Handle JSON parsing for analysis field
    - Map database columns to domain model
    - _Requirements: 7.3, 7.4_

  - [x] 1.4 Run database migration

    - Execute migration in Supabase dashboard
    - Verify table creation
    - Verify indexes are created
    - Verify RLS policies are active
    - _Requirements: 7.3_

- [x] 2. Save/Load API Implementation

  - [x] 2.1 Create save API function


    - Create features/doctor-frankenstein/api/saveFrankensteinIdea.ts
    - Implement saveFrankensteinIdea function
    - Handle authentication check
    - Handle local dev mode with localStorage
    - Handle database insertion
    - Return SavedFrankensteinIdea or error
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.5_

  - [x] 2.2 Create load API function

    - Implement loadFrankensteinIdea function in same file
    - Handle local dev mode with localStorage
    - Handle database query
    - Handle not found case
    - Return SavedFrankensteinIdea or error
    - _Requirements: 2.3, 5.2, 5.3, 5.4, 7.1, 7.2, 7.5_

  - [x] 2.3 Update localStorage service


    - Add saveFrankensteinIdea method to lib/localStorage.ts
    - Add getFrankensteinIdea method
    - Add listFrankensteinIdeas method
    - Implement IndexedDB storage
    - _Requirements: 7.5_

  - [x] 2.4 Write API tests

    - Test save with valid data
    - Test save without authentication
    - Test load existing idea
    - Test load non-existent idea
    - Test local dev mode operations
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.3, 5.2, 5.3, 5.4_

- [x] 3. Export Utilities Implementation

  - [x] 3.1 Create export utilities file


    - Create features/doctor-frankenstein/utils/exportFrankensteinIdea.ts
    - Define export function interfaces
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 3.2 Implement Markdown export

    - Write generateMarkdownReport function
    - Include frontmatter with metadata
    - Format technologies section
    - Format analysis sections
    - Return markdown string
    - _Requirements: 4.3, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 3.3 Implement JSON export

    - Write generateJSONReport function
    - Structure data with metadata
    - Include technologies and analysis
    - Return formatted JSON string
    - _Requirements: 4.4, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 3.4 Implement PDF export


    - Write generatePDFReport function
    - Use jsPDF library
    - Format title and metadata
    - Format technologies section
    - Format analysis sections with proper spacing
    - Handle page breaks for long content
    - Trigger download
    - _Requirements: 4.2, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 3.5 Write export utility tests

    - Test Markdown generation
    - Test JSON generation
    - Test PDF generation (mock jsPDF)
    - Test format validation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Export Control Component

  - [x] 4.1 Create FrankensteinExportControl component


    - Create features/doctor-frankenstein/components/FrankensteinExportControl.tsx
    - Implement dropdown UI
    - Add export button with icon
    - Add dropdown menu with format options
    - Handle click outside to close
    - _Requirements: 4.1, 4.5_

  - [x] 4.2 Implement export handlers

    - Add handleExport function for each format
    - Call appropriate export utility
    - Trigger browser download
    - Close dropdown after export
    - _Requirements: 4.2, 4.3, 4.4_

  - [x] 4.3 Add accessibility features

    - Add ARIA labels and roles
    - Implement keyboard navigation (arrow keys, escape)
    - Manage focus states
    - Add screen reader announcements
    - _Requirements: 4.1, 4.5_

  - [x] 4.4 Write component tests

    - Test dropdown open/close
    - Test export button clicks
    - Test keyboard navigation
    - Test accessibility features
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Save/Share Controls in Main View

  - [x] 5.1 Update DoctorFrankensteinView state


    - Add savedIdeaRecord state
    - Add isSaved state
    - Add isLoadingSaved state
    - Update state structure to track saved status
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

  - [x] 5.2 Implement save functionality

    - Add handleSaveReport function
    - Check authentication status
    - Call saveFrankensteinIdea API
    - Update URL with savedId parameter
    - Update UI state to show saved status
    - Handle errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 5.3 Implement load functionality

    - Add useEffect to check for savedId in URL
    - Call loadFrankensteinIdea API
    - Restore technology selections and mode
    - Display saved analysis
    - Handle loading state
    - Handle errors
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 5.4 Add Save Report button

    - Show button when analysis exists and not saved
    - Hide button when already saved
    - Show "Report Saved" confirmation when saved
    - Add loading state during save
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 5.5 Add Share button

    - Show button only when idea is saved
    - Implement copyShareableLinkToClipboard function
    - Show "Link Copied" confirmation for 2 seconds
    - Handle clipboard API errors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 5.6 Add Go to Dashboard button


    - Show button when viewing saved idea
    - Navigate to dashboard on click
    - _Requirements: 2.4_

  - [x] 5.7 Implement refine functionality


    - Add "Spin Again" button when viewing saved idea
    - Enable slot machine when clicked
    - Allow mode switching
    - Create new save instead of overwriting
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6. Dashboard Integration

  - [x] 6.1 Update Dashboard component


    - Add frankensteinIdeas state
    - Create loadFrankensteinIdeas function
    - Query saved_frankenstein_ideas table
    - Sort by created_at descending
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 6.2 Create Frankenstein ideas section

    - Add "Doctor Frankenstein Ideas" section to dashboard
    - Display list of saved ideas
    - Show idea name, technologies, mode, and date
    - Add link to view each idea
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 6.3 Add delete functionality


    - Add delete button for each idea
    - Implement delete confirmation dialog
    - Call Supabase delete operation
    - Refresh list after deletion
    - _Requirements: 2.1, 2.2_

  - [x] 6.4 Add pagination


    - Implement pagination for large lists
    - Show 10 ideas per page
    - Add next/previous buttons
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 7. Internationalization

  - [x] 7.1 Add English translations


    - Add save/share keys to locales/en.json
    - Add export keys
    - Add error message keys
    - Add button label keys
    - _Requirements: 1.1, 1.2, 1.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

  - [x] 7.2 Add Spanish translations


    - Add save/share keys to locales/es.json
    - Add export keys
    - Add error message keys
    - Add button label keys
    - _Requirements: 1.1, 1.2, 1.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

  - [x] 7.3 Test language switching


    - Verify all new UI text switches correctly
    - Test save/load with different languages
    - Test export in different languages
    - _Requirements: All requirements_

- [x] 8. Error Handling

  - [x] 8.1 Implement save error handling

    - Handle authentication errors (redirect to login)
    - Handle database errors (show retry)
    - Handle network errors (show message)
    - Log errors for debugging
    - _Requirements: 1.5_

  - [x] 8.2 Implement load error handling

    - Handle not found errors (clear URL, show message)
    - Handle permission errors (show message)
    - Handle database errors (show retry)
    - _Requirements: 5.4_

  - [x] 8.3 Implement export error handling

    - Handle generation errors (show message)
    - Handle browser compatibility issues
    - Provide fallback for clipboard API
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 9. Testing
  - [ ] 9.1 Write integration tests
    - Test save flow: Generate → Save → Verify in DB
    - Test load flow: Save → Reload → Verify loaded
    - Test share flow: Save → Copy link → Open in new tab
    - Test export flow: Generate → Export all formats
    - _Requirements: All requirements_

  - [ ] 9.2 Write E2E tests
    - Test complete user journey: Generate → Save → Dashboard → View
    - Test share link journey: Save → Share → Open link (logged out)
    - Test refine journey: View saved → Spin again → Save new
    - _Requirements: All requirements_

  - [x] 9.3 Manual testing checklist




    - Test save when logged in
    - Test save redirect when not logged in
    - Test load from URL parameter
    - Test share link works without auth
    - Test all export formats download correctly
    - Test dashboard displays ideas correctly
    - Test delete from dashboard
    - Test refine creates new save
    - Test error scenarios
    - _Requirements: All requirements_

- [ ] 10. Documentation
  - [ ] 10.1 Update feature documentation
    - Document save/share/export functionality
    - Add usage examples
    - Document API functions
    - Document export formats
    - _Requirements: All requirements_

  - [ ] 10.2 Update README
    - Add Doctor Frankenstein to features list
    - Mention save/share/export capabilities
    - _Requirements: All requirements_

  - [ ] 10.3 Add inline code comments
    - Document complex logic
    - Add JSDoc comments to public functions
    - Document component props
    - _Requirements: All requirements_

- [ ] 11. Performance Optimization
  - [ ] 11.1 Optimize database queries
    - Verify indexes are used
    - Test query performance with large datasets
    - Implement pagination if needed
    - _Requirements: 2.1, 2.2, 2.5_

  - [ ] 11.2 Optimize export generation
    - Profile PDF generation performance
    - Optimize for large content
    - Test on low-end devices
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ] 11.3 Optimize local storage
    - Implement cleanup for old ideas
    - Limit storage to 50 ideas
    - Test IndexedDB performance
    - _Requirements: 7.5_

- [ ] 12. Security Review
  - [ ] 12.1 Verify RLS policies
    - Test users can only see own ideas
    - Test users can only insert own ideas
    - Test users can only delete own ideas
    - Test shared links work without auth
    - _Requirements: 7.3_

  - [ ] 12.2 Review data exposure
    - Verify no sensitive data in shared links
    - Verify user IDs are not exposed
    - Review error messages for information leakage
    - _Requirements: 3.4, 3.5_

  - [ ] 12.3 Test authentication flows
    - Test save without auth redirects correctly
    - Test load without auth for shared links
    - Test session expiration handling
    - _Requirements: 1.5, 7.1, 7.2_

- [ ] 13. Deployment
  - [ ] 13.1 Pre-deployment checklist
    - Run all tests
    - Verify database migration is ready
    - Review code changes
    - Update environment variables if needed
    - _Requirements: All requirements_

  - [ ] 13.2 Deploy to production
    - Run database migration
    - Deploy code changes
    - Verify deployment successful
    - _Requirements: All requirements_

  - [ ] 13.3 Post-deployment verification
    - Test save/load in production
    - Test share links work
    - Test all export formats
    - Test dashboard integration
    - Monitor for errors
    - _Requirements: All requirements_
