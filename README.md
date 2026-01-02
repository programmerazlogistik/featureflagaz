# Feature Flags Admin

A professional dashboard to manage application feature flags stored in AWS S3 with Supabase authentication.

## Features

- **AWS S3 Integration**: Flags are stored as a flat JSON object in S3 for centralized management.
- **Supabase Authentication**: Secure, scalable authentication supporting multiple admin users.
- **Inline Editing**: Edit flag keys directly in the table without modal dialogs.
- **Inline Add**: Create new flags with an inline input row at the top of the table.
- **Bulk Delete**: Select multiple flags and delete them all at once.
- **Keyboard Shortcuts**: Press Enter to save, Escape to cancel editing.
- **Real-time Updates**: Changes are saved immediately with optimistic UI updates.
- **Real-time Search**: Quickly find flags by key.
- **Dark Mode Support**: Built with Shadcn UI and Tailwind CSS.

## Implementation Details

The system uses a flat JSON structure in S3 specifically designed for performance and backward compatibility:

```json
{
  "isMaintenance": false,
  "new_dashboard": true,
  "advanced_search": false
}
```

- **Backend**: Next.js API Routes (`/api/flags`) using the `@aws-sdk/client-s3`.
- **Authentication**: Supabase Auth with cookie-based sessions and protected API routes.
- **Frontend**: React with SWR for efficient data fetching and optimistic UI updates.
- **Styling**: Tailwind CSS with Shadcn UI components.

## UI Features

### Inline Editing

- Click the **edit icon** (pencil) on any flag to edit its key inline
- Press **Enter** to save changes or **Escape** to cancel
- Edit mode prevents accidental changes with inline save/cancel buttons

### Inline Add

- Click **"Add New Flag"** to reveal an inline input row
- Type the flag key and press **Enter** or click the checkmark to save
- New flags are created with `enabled: false` by default

### Bulk Delete

- Select multiple flags using checkboxes
- Click **"Delete X selected"** button that appears in the bottom-right corner
- Confirm deletion to remove all selected flags at once
- Sequential deletion prevents race conditions

### Toggle Status

- Use the toggle switch to enable/disable flags instantly
- Changes are saved immediately with optimistic UI updates

## Local Development

### 1. Clone the repository

```bash
git clone <repository-url>
cd flags-admin
```

### 2. Install dependencies

```bash
npm install
# or
bun install
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: Choose a project name (e.g., "Feature Flags Admin")
   - **Database Password**: Set a strong password (you won't need this for auth)
   - **Region**: Choose the closest region to your users
4. Click **"Create new project"** and wait for setup to complete (~2 minutes)

#### Get Your Supabase API Credentials

1. Once your project is ready, go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy these two values (you'll need them for `.env.local`):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

#### Create Your First Admin User

1. Go to **Authentication** in the left sidebar
2. Click **Users** tab
3. Click **"Add user"** button (top right)
4. Select **"Create new user"**
5. Fill in the form:
   - **Email**: Enter the admin email address (e.g., `admin@yourdomain.com`)
   - **Password**: Set a strong password
   - **Auto Confirm User**: Leave checked (so user can log in immediately)
6. Click **"Create user"**

> 💡 **Tip**: You can create multiple admin users by repeating step 3-6. Each user will have their own login credentials.

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure:

**Supabase Authentication (Required):**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-publishable-key
```

**AWS S3 (Required for persistence):**

```env
AWS_REGION=ap-southeast-3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_S3_OBJECT_KEY=path/to/flag.json
```

> **Important Notes**:
>
> - Do NOT use quotes around values in `.env.local`
> - Get Supabase credentials from your Supabase project dashboard
> - Restart the dev server after changing `.env.local` for changes to take effect

### 5. Run the development server

```bash
npm run dev
# or
bun run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login) and sign in with your Supabase admin user credentials.

## Deployment

### Vercel (Recommended)

1. Push your code to a GitHub repository.
2. Connect the repository to Vercel.
3. Add the following Environment Variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_S3_BUCKET_NAME`
   - `AWS_S3_OBJECT_KEY`

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

Ensure all environment variables are properly set in your hosting environment.

## Security Notes

### ⚠️ Important Security Practices

1. **Secure Supabase Credentials**: Keep your Supabase URL and keys secure. The `anon` key is safe to use in the browser, but always use Row Level Security (RLS) policies in Supabase if storing data there.
2. **Remove Hardcoded Credentials**: Never commit AWS credentials or Supabase keys to your repository.
3. **Use Environment Variables**: Always configure credentials via `.env.local` (local) or hosting platform environment variables (production).
4. **Rotate Credentials**: If credentials are accidentally exposed, rotate them immediately in AWS IAM and/or Supabase.
5. **Multiple Admin Users**: You can create multiple admin users in your Supabase project's Authentication dashboard.

## Managing Admin Users

To add more admin users:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** and create a new user with email and password
4. The new user can immediately log in to the admin dashboard

You can also manage users, reset passwords, and configure authentication settings from the Supabase dashboard.

## Troubleshooting

### Environment Variables Not Loading

If your `.env.local` changes are not being picked up:

1. **Restart the dev server** - Environment variables are only loaded at server start
2. **Check for quotes** - Don't use quotes around values: `KEY=value` not `KEY="value"`
3. **Check file location** - `.env.local` must be in the project root
4. **Check console output** - Look for environment variable errors in the terminal

### Authentication Issues

If you're having trouble logging in:

1. **Verify Supabase credentials** - Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` are correct
2. **Check user exists** - Verify the user is created in Supabase Auth dashboard
3. **Clear browser data** - Clear cookies and local storage, then try again
4. **Check browser console** - Look for authentication errors in the browser console

### Flag Keys with Spaces

Flag keys with spaces or special characters are properly URL-encoded automatically. You can safely use flags like `"feature_flag "` (with trailing space).

## Migration from Old Auth System

If you're upgrading from the old environment variable-based auth system:

1. **Old users will need to re-login** - localStorage sessions are not compatible with Supabase
2. **Remove old environment variables** - Delete `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env.local`
3. **Create Supabase users** - Add your admin users in the Supabase dashboard
4. **Update deployment** - Ensure production environment variables are updated
