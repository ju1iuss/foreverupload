# ForeverUpload

A Pinterest planning and scheduling app that helps you organize and plan your content strategy.

## Setup

### 1. Supabase Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/`:
   - `001_initial_schema.sql` - Creates tables and enables extensions
   - `002_setup_cron.sql` - Sets up the cron job (update with your project URL and anon key)

3. Create a Storage bucket:
   - Go to Storage in Supabase Dashboard
   - Create bucket named `pin_images`
   - Set it to public

4. Set up Edge Function secrets:
   - Go to Edge Functions → Secrets
   - Add:
     - `PINTEREST_CLIENT_ID` - Your Pinterest App ID
     - `PINTEREST_CLIENT_SECRET` - Your Pinterest App Secret
     - `PINTEREST_REDIRECT_URI` - Your OAuth redirect URI (e.g., `https://your-domain.com/api/auth/pinterest/callback`)
     - `NEXT_PUBLIC_SITE_URL` - Your site URL (e.g., `http://localhost:3000` or `https://your-domain.com`)
     - `FRONTEND_URL` - Your frontend URL (e.g., `http://localhost:3000`)

### 2. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref zcftkbpfekuvatkiiujq

# Deploy functions
supabase functions deploy pin-oauth
supabase functions deploy pin-post
supabase functions deploy pin-upload-images
```

### 3. Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp env.example .env.local

# The env.example file already contains the correct Supabase credentials for tasy.ai project

# Run development server
npm run dev
```

## Usage

1. Connect your Pinterest account at `/auth`
2. Upload images and schedule posts at `/schedule`
3. View scheduled posts in the calendar at `/`
4. View your scheduled content plan in the calendar

## Features

- Image upload to Supabase Storage
- Bulk edit titles and descriptions
- Calendar view of scheduled posts
- Daily scheduling limit: 10 pins/day.
- OAuth authentication with Pinterest

## Pinterest Developer Guidelines Compliance

This application is fully compliant with Pinterest's Developer Guidelines:

### 1. Data Storage & Transparency
- ✅ **No Pinterest data caching**: Board lists and user profiles are fetched fresh from the Pinterest API on each request
- ✅ **Secure token storage**: Access tokens are stored server-side only and never exposed to clients
- ✅ **User data isolation**: Each user's data is isolated and never combined with other users' data

### 2. User Intent & Control
- ✅ **Explicit user confirmation**: Users must confirm bulk edits and scheduling actions
- ✅ **Individual review**: Each pin requires title, description, and board selection before scheduling
- ✅ **Content planning**: Plan your pins in advance with a clear scheduling calendar
- ✅ **Daily limits enforced**: Maximum 6 posts per day to prevent spam

### 3. Attribution & Source Linking
- ✅ **Pinterest source links**: All posted pins include "View on Pinterest" links to their source
- ✅ **Clear attribution**: Dashboard and content pool clearly indicate content is from Pinterest
- ✅ **No content modification**: Images are displayed as-is without filters or alterations

### 4. Privacy & Legal Compliance
- ✅ **Privacy Policy**: Comprehensive privacy policy at `/privacy`
- ✅ **Age verification**: Users must confirm they are 13+ years old during sign-up
- ✅ **Transparent data usage**: Clear communication about how Pinterest data is used
- ✅ **User rights**: Users can disconnect Pinterest and delete their data at any time

### 5. API Usage
- ✅ **Token refresh**: Seamless token refresh when needed
- ✅ **Error handling**: Graceful handling of API errors and rate limits
- ✅ **Scope compliance**: Only requests necessary permissions (read/write pins, boards)
- ✅ **No data resale**: User data is never shared, sold, or used for advertising

For more information, see [Pinterest Developer Guidelines](https://policy.pinterest.com/en/developer-guidelines)

