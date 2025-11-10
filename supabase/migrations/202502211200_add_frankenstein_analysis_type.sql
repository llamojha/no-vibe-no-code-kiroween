-- Ensure saved_analyses allows Doctor Frankenstein reports.
alter table public.saved_analyses
  drop constraint if exists saved_analyses_analysis_type_check;

alter table public.saved_analyses
  add constraint saved_analyses_analysis_type_check
  check (analysis_type in ('idea', 'hackathon', 'frankenstein'));
