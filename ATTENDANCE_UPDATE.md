# Volunteer Hub 2.0 — Attendance overhaul (staging)

This release replaces the attendance UI across Clock In/Out, My Attendance, and Staff Attendance.

## Changes
- Clock In/Out: active shift summary, direct link to staff approvals, and recent shift history without an empty Actions column.
- My Attendance: approved-hours summary and read-only history.
- Staff Attendance: pending review queue, clocked-in count, approved-hours summary, status filtering, and clear review actions.
- Consistent forest-green theme, responsive cards, status badges, and explicit persistence feedback.
- Clock-out updates require an open shift (`end_time IS NULL`) and confirm exactly one changed row.
- Approval only permits completed, unreviewed shifts and confirms exactly one changed row.

## Deployment
Replace the existing GitHub project files with the contents of this directory and deploy to Vercel staging. No SQL is included.

## Limitations
- This version has passed `node --check` for all four JavaScript files, but has not been tested against live Supabase or through a complete Vite build.
- The existing RLS policies determine whether shift writes and staff approvals succeed.
- Staff history displays up to 300 recent records; approved-hours summary is for those loaded records.
- Historical attendance editing and export are not included.
