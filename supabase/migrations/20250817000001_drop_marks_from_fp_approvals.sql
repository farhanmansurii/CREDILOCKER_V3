-- Drop marks_allotted column from field_project_approvals table
ALTER TABLE field_project_approvals DROP COLUMN IF EXISTS marks_allotted;
