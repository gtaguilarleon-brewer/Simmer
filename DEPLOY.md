# Simmer - Deployment Guide

Follow these steps in order. Each step should take just a few minutes.

---

## Step 1: Set up the database

1. Go to your Supabase dashboard (supabase.com)
2. Open your "Simmer" project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"
5. Open the file `supabase/schema.sql` from this project in any text editor
6. Copy the ENTIRE contents and paste it into the SQL editor
7. Click "Run" (the green play button)
8. You should see "Success" - this creates all your tables and loads the starter data

---

## Step 2: Create the GitHub repository

1. Go to github.com and sign in
2. Click the "+" in the top-right corner, then "New repository"
3. Name it "simmer"
4. Leave it as "Public" (or Private, your choice)
5. Do NOT check "Add a README" or any other boxes
6. Click "Create repository"
7. You'll see a page with setup instructions - keep this tab open

---

## Step 3: Push the code to GitHub

You'll need to do this from your computer's terminal (Terminal on Mac, Command Prompt on Windows).

If you don't have Git installed, download it from git-scm.com first.

1. Download the `simmer` folder from this session to your computer
2. Open Terminal and navigate to the simmer folder:
   ```
   cd path/to/simmer
   ```
3. Run these commands one at a time:
   ```
   git init
   git add .
   git commit -m "Initial commit - Simmer meal planning app"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/simmer.git
   git push -u origin main
   ```
   Replace YOUR_GITHUB_USERNAME with your actual GitHub username.

---

## Step 4: Deploy on Vercel

1. Go to vercel.com and sign in
2. Click "Add New Project"
3. It will ask you to connect GitHub - authorize it
4. You should see your "simmer" repository in the list - click "Import"
5. On the configuration page:
   - Framework Preset should auto-detect "Next.js"
   - Under "Environment Variables", add these two:
     - Name: `NEXT_PUBLIC_SUPABASE_URL` Value: `https://uehpssdmqwdoalrlgznz.supabase.co`
     - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY` Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlaHBzc2RtcXdkb2Fscmxnem56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTA0OTEsImV4cCI6MjA5MDM4NjQ5MX0.UZuxgI2u6gSSTZLpMAvkjTSMob25qBS3-uQcwgfKgkU`
6. Click "Deploy"
7. Wait about 60 seconds for the build to complete
8. Vercel will give you a URL like `simmer-abc123.vercel.app` - that's your app!

---

## Step 5: (Optional) Custom domain

If you want a cleaner URL instead of the default Vercel one:
1. In Vercel, go to your project Settings > Domains
2. You can add a custom domain if you own one, or use the free `.vercel.app` subdomain

---

## How to make updates later

When you have code changes:
1. Make the changes in your local simmer folder
2. In Terminal:
   ```
   git add .
   git commit -m "Description of what changed"
   git push
   ```
3. Vercel automatically rebuilds and deploys within ~60 seconds

Your data in Supabase is never affected by code deploys.

---

## Project structure (for reference)

```
simmer/
  src/
    app/
      page.js          - Weekly Plan (home page)
      layout.js        - App shell
      globals.css      - Global styles
      recipes/page.js  - Recipes library
      grocery/page.js  - Grocery list
      settings/page.js - Settings (4 lists)
    components/        - Shared UI components
    hooks/             - Data layer (Supabase operations)
    lib/
      supabase.js      - Database connection
      theme.js         - Design tokens
      categories.js    - Grocery category logic
  supabase/
    schema.sql         - Database schema + seed data
```
