# Deployment Guide

This document describes the process of setting up and deploying the site on a cPanel hosting environment.

**IMPORTANT: Because cPanel shared hosting environments vary, the most reliable method is to build the site locally and push the `dist` folder to GitHub.**

## Part 1: Local Preparation & Build

Before starting, ensure that **Node.js** and **Git** are installed on your computer.

1. **Install Dependencies:**
   Open a terminal in the project folder and run:
   ```bash
   npm install
   ```

2. **Build the Project:**
   This creates the `dist` folder which contains your actual website files.
   ```bash
   npm run build
   ```

3. **Initialize Git & Push:**
   If you haven't already initialized git:
   ```bash
   git init
   git add .
   git commit -m "Initial commit with build"
   git remote add origin <your_repo_link.git>
   git push -u origin master
   ```

   *If you make future changes:*
   1. Make your code changes.
   2. Run `npm run build`.
   3. `git add .`
   4. `git commit -m "Update"`
   5. `git push`

---

## Part 2: cPanel Configuration

### Step 1: Git Version Control Setup
1. Go to cPanel -> **Git™ Version Control**.
2. Click **Create**.
3. **Clone URL**: Paste your repository link.
4. **Repository Path**: `repositories/pavlo-portfolio`.
5. **Repository Name**: `pavlo-portfolio`.
6. Click **Create**.

---

## Part 3: Deployment

The project includes a `.cpanel.yml` file that tells cPanel to copy the files from the `dist` folder to your public website folder.

1. In cPanel -> **Git™ Version Control**, click **Manage** next to your repository.
2. Go to the **Pull or Deploy** tab.
3. Click **Update from Remote** to fetch your latest commit (which includes the `dist` folder).
4. Click **Deploy HEAD Commit**.

Your site should now be live in your `public_html` folder.
