# Deployment Guide

This document describes the process of setting up and deploying the site on a cPanel hosting environment.

**IMPORTANT: Because cPanel shared hosting environments vary, the most reliable method is to build the site locally and push the `dist` folder to GitHub.**

## Part 1: Automated Deployment Workflow

This project has a **GitHub Action** named `cpanel-deploy.yml` configured. 
Every time you push a change to the `main` branch, GitHub will automatically:
1. Build the project using Node.js/Vite.
2. Put all production files in the `dist` folder.
3. Push those files directly back into the **`main`** branch.

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

### Step 2: Deploy to public_html
1. Go to the **Pull or Deploy** tab.
2. Click **Update from Remote**. 
   *(Note: wait a 1-2 хвилин after you push code to GitHub for the Action to build the `dist` folder before clicking Update)*
3. Click **Deploy HEAD Commit**.

The `.cpanel.yml` file is configured to copy everything from the `dist` folder into your `public_html` folder. Your site will instantly go live!
