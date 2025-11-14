# Email Updates Feature - Setup Instructions

## Step 1: Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- File: create-email-history-table.sql
```

This creates the `email_history` table to track all emails sent to clients.

## Step 2: Test the Feature

1. Start your dev server: `netlify dev`
2. Login as admin
3. Go to Admin Panel
4. Click "Send Updates" in the side menu

## How It Works

### First Time (No Email History)
1. Select a user
2. Select their project
3. Type a personal message
4. Click "Check Changes"
5. You'll see: "Project was set up successfully, emails with updates will be sent as changes are made"
6. Click "Preview Email" to see how it will look
7. Click "Send Email" - saves to database (OneSignal integration pending)

### After First Email (With Changes)
1. When you click "Check Changes", it queries:
   - Completed tasks since last email
   - New screens created
   - Screens that were edited
   - New tasks added
2. Shows organized summary with color coding:
   - Green: Completed tasks
   - Blue: New screens
   - Yellow: Updated screens
   - Gray: New tasks

### Email Preview
- Shows recipient email
- Shows subject line
- Shows your personal message
- Shows formatted changes (if any)
- Professional signature

## OneSignal Integration (Pending)

In `SendUpdatesSection.tsx` around line 177, there's a commented section:

```typescript
// TODO: OneSignal Integration
// await sendEmailViaOneSignal({
//   to: users.find(u => u.id === selectedUserId)?.email,
//   subject: `Project Update - ${projects.find(p => p.id === selectedProjectId)?.name}`,
//   body: formatEmailBody()
// });
```

When ready to integrate OneSignal:
1. Set up OneSignal email in your OneSignal dashboard
2. Add OneSignal credentials to `.env`
3. Create a Netlify function `send-update-email.ts`
4. Replace the commented section with actual API call

## Database Schema

**email_history** table:
- `id` - UUID primary key
- `user_id` - Recipient user
- `project_id` - Project being updated
- `sent_by` - Admin who sent it
- `sent_at` - Timestamp
- `personal_message` - Your custom message
- `changes_snapshot` - JSON of what changes were included
- `email_subject` - Subject line
- `email_sent_successfully` - Boolean (true when OneSignal integrated)

## Testing Checklist

- [ ] Database table created successfully
- [ ] "Send Updates" menu item appears in Admin Panel
- [ ] Can select user from dropdown
- [ ] Can select project from dropdown (only shows that user's projects)
- [ ] Can type personal message
- [ ] "Check Changes" button works
- [ ] First time shows: "Project was set up successfully..."
- [ ] "Preview Email" button appears after checking changes
- [ ] Preview modal shows correctly formatted email
- [ ] "Send Email" saves to email_history table
- [ ] Can send multiple emails and it tracks "last sent" correctly

## Next Steps

Once you verify everything works:
1. Test the change detection with real data (complete some tasks, add screens)
2. Send a second email to verify it shows changes since first email
3. Set up OneSignal email integration
4. Replace commented code with actual email sending
