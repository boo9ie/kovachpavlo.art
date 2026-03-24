# Deployment Guide

This document describes the process of setting up and deploying the site on a cPanel hosting environment.

**IMPORTANT: Because cPanel shared hosting environments vary, the most reliable method is to build the site locally and push the `dist` folder to GitHub.**

## Part 1: Automated Deployment Workflow (Рекомендованок)

This project has a **GitHub Action** named `cpanel-deploy.yml` configured. 
Every time you push a change to the `main` branch, GitHub will automatically:
1. Build the project using Node.js/Vite.
2. Put all production files in the `dist` folder.
3. Push those files directly to a new branch called **`cpanel`**.

This means you **never need to build locally** to deploy.

---

## Part 2: cPanel Configuration

To connect this automated workflow to your cPanel hosting:

### Step 1: Git Version Control Setup
1. Go to cPanel -> **Git™ Version Control**.
2. Click **Create**.
3. **Clone URL**: Paste your repository link (`https://github.com/boo9ie/kovachpavlo.art.git`).
4. **Repository Path**: `repositories/kovachpavlo.art` (or any path you prefer outside public_html).
5. **Repository Name**: `kovachpavlo.art`.
6. Click **Create** (this tracks the `main` branch by default).

### Step 2: Switch to the Deployment Branch
1. After creating, click **Manage** next to your repository.
2. In the **Basic Information** tab, find **Checked-Out Branch**.
3. Change it from `main` to **`cpanel`**.
   *(Note: if `cpanel` doesn't exist yet, wait 1-2 minutes for the GitHub Action to finish its first run and refresh).*
4. Click **Update**.

### Step 3: Deploy to public_html
1. Go to the **Pull or Deploy** tab.
2. Click **Update from Remote**.
3. Click **Deploy HEAD Commit**.

Because the `cpanel` branch only contains your final built files and the correct `.cpanel.yml`, your site will instantly go live in your `public_html` folder.

In the future, simply click **Update from Remote** and **Deploy HEAD Commit** whenever you push new changes to GitHub!
