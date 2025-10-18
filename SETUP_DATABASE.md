# Database Setup Instructions

## ⚠️ IMPORTANT: Your Supabase database needs to be set up!

The errors you're seeing indicate that the database tables don't exist yet in your Supabase project.

## Steps to Fix:

### 1. Open Supabase Dashboard
- Go to https://supabase.com
- Open your project: `pzirrzxdceirhtzxgizj` (based on your connection string)

### 2. Run the Database Schema

1. Click on **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste it into the SQL Editor
5. Click **Run** or press `Ctrl+Enter`

### 3. Verify Tables Were Created

Go to **Table Editor** and verify you see these tables:
- `agents`
- `agent_configs`
- `evaluations`

### 4. Check Row Level Security (RLS)

In the Table Editor, each table should show:
- 🔒 RLS Enabled
- Policies configured for SELECT, INSERT, UPDATE, DELETE

### 5. (Optional) Seed Test Data

After the schema is set up, you can run:

```bash
npm run seed
```

This will create:
- A test user account
- Sample agents
- Synthetic evaluation data

## What the Schema Creates:

### Tables:
1. **agents** - AI agent definitions
2. **agent_configs** - Configuration for each agent
3. **evaluations** - Performance evaluation records

### Security:
- Row Level Security (RLS) policies
- User-scoped data access
- Foreign key relationships with cascading deletes

### Indexes:
- Performance indexes on user_id, agent_id, and created_at
- Optimized for dashboard queries

## Troubleshooting:

If you still see errors after running the schema:

1. **Refresh the schema cache:**
   - In Supabase Dashboard → Settings → API
   - Look for "Reload schema cache" or restart the PostgREST server

2. **Check your environment variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://pzirrzxdceirhtzxgizj.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Verify database connection:**
   - Make sure your Supabase project is active
   - Check that the API keys are correct

## After Setup:

Once the database is set up, your application should work correctly with:
- ✅ User authentication
- ✅ Agent management
- ✅ Evaluation tracking
- ✅ Analytics dashboards
