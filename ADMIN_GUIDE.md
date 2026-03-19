# CashFlowCrew Admin Panel — Complete Guide
### For Administrators & Internal Operations Team

---

## Table of Contents

1. [What is the Admin Panel?](#1-what-is-the-admin-panel)
2. [How to Log In](#2-how-to-log-in)
3. [Admin Panel Layout & Navigation](#3-admin-panel-layout--navigation)
4. [Dashboard — Analytics Overview](#4-dashboard--analytics-overview)
5. [Masterclasses — Course Management](#5-masterclasses--course-management)
6. [Categories Management](#6-categories-management)
7. [Coupons Management](#7-coupons-management)
8. [Users & Transactions](#8-users--transactions)
9. [Order Details](#9-order-details)
10. [Blogs Management](#10-blogs-management)
11. [Image Management](#11-image-management)
12. [Complete Admin Workflows](#13-complete-admin-workflows)
13. [FAQ for Admins](#14-faq-for-admins)

---

## 1. What is the Admin Panel?

The **CashFlowCrew Admin Panel** is a private back-office web application used by the internal team to manage everything on the CashFlowCrew platform — courses, users, orders, blogs, coupons, and marketing.

It is a **separate website** from the main student-facing storefront. Only people with admin credentials can access it.

**Admin Panel URL:** *(provided by the development team — typically something like `admin.cashflowcrew.com`)*

**Main storefront:** `cashflowcrew.com` — this is what your users and customers see.

The admin panel connects to the **same backend database** as the main storefront, so any changes made here (new courses, price changes, new blogs, coupons) reflect on the live website immediately.

---

## 2. How to Log In

### Step-by-Step Login

1. Open the Admin Panel URL in your browser
2. You will see the **Login Page**
3. **Step 1:** Enter your admin **email address** → click **"Continue"**
4. **Step 2:** Enter your **password** → click **"Sign In"**

Your session is saved in a secure browser cookie. You will stay logged in unless you manually log out or clear your browser data.

### Logging Out

1. Look at the **bottom of the left sidebar** — you will see your name/avatar
2. Click on it to open a dropdown
3. Click **"Logout"**
4. You will be redirected to the login page

> **Important:** Always log out when using a shared computer.

### If You Forget Your Password

Contact the development team to reset your admin credentials. There is no self-service password reset on the admin panel.

---

## 3. Admin Panel Layout & Navigation

### Overall Layout

The admin panel has three main areas:

```
┌─────────────────────────────────────────────────────────────────────┐
│  TOP HEADER BAR — Page title + action buttons (e.g. "New Blog")     │
├─────────────────┬───────────────────────────────────────────────────┤
│                 │                                                   │
│  LEFT SIDEBAR   │           MAIN CONTENT AREA                       │
│  (navigation)   │    (changes depending on which page you're on)    │
│                 │                                                   │
└─────────────────┴───────────────────────────────────────────────────┘
```

### Left Sidebar Navigation

The sidebar lists all sections of the admin panel. The **currently active page** is highlighted in blue.

| Sidebar Item | What It Opens |
|---|---|
| **Dashboard** | Analytics overview + transaction summary |
| **Users Management** | View all users, transaction history, charts |
| **Masterclasses** | Create, edit, manage all courses |
| **Coupons** | Create and manage discount codes |
| **Categories** | Manage course categories |
| **Images** | Upload and manage image assets |
| **Blogs** | Create and manage blog posts |

### Mobile / Small Screen

On a phone or tablet, the sidebar is hidden. Tap the **menu icon (☰)** at the top-left to open it as a sliding drawer.

### Collapsing the Sidebar

On desktop, you can click the collapse arrow on the sidebar to shrink it to icon-only mode for more screen space. Click it again to expand.

---

## 4. Dashboard — Analytics Overview

**Navigate to:** Sidebar → **Dashboard**

### What You'll See

The dashboard is your **command center** for monitoring sales and transactions. It shows:

- **Weekly transaction summary** — a card view of all payments processed
- **Two tabs on the card:**
  - **Successful Transactions** (shown in green) — completed, paid orders
  - **Pending / Failed** (shown in red) — incomplete or failed payments

### Filtering by Week

- By default, the **current week** (Sunday to Saturday) is shown
- Use the week navigation arrows to go back and see **previous weeks**
- Each week shows who paid, how much, and for which course

### Per-Transaction Actions

For each successful order on the dashboard you can:

| Action | What It Does |
|---|---|
| **Send Registration Details** | Sends a confirmation email to the user |
| **Send Reminder Email** | Sends a reminder for an upcoming live class |
| **WhatsApp Community** | Opens a link to add the user to the WhatsApp group |

> **Use Case:** After a live workshop registration, use these buttons to onboard attendees — send them their login details and add them to the community WhatsApp group.

---

## 5. Masterclasses — Course Management

**Navigate to:** Sidebar → **Masterclasses**

This is the most important section — it controls everything about your courses.

### Viewing All Courses

You will see a list/table of all masterclasses (courses) with:
- Course title and thumbnail
- Type (Recorded / Live / Hybrid)
- Price and Original Price
- Published status (live on website or not)
- Visibility (shown or hidden)

### Creating a New Course

1. Click the **"New Masterclass"** button (top-right)
2. Fill in the course form:

| Field | What to Enter |
|---|---|
| **Title** | The course name (e.g., "Equity Mutual Fund Analysis") |
| **Sub-heading** | A short tagline or subtitle |
| **Description** | A brief summary (shown in course listings) |
| **Content** | Full course details using the rich-text editor (supports headings, bullet points, images) |
| **Status** | e.g., Active, Coming Soon, Ended |
| **Price** | Selling price in ₹ (e.g., 2499) |
| **Original Price** | Crossed-out price to show a discount (e.g., 4999) |
| **Thumbnail** | Upload a course cover image |
| **Type** | Recorded / Live / Hybrid |
| **Duration** | e.g., "6 hours", "3 Days" |
| **TrainerCentral Course ID** | The ID from TrainerCentral for course access |
| **TrainerCentral URL** | The link students get after purchase to access the course |
| **Start Date** | For live/hybrid courses — when it begins |
| **Max Seats** | For live courses — enrollment cap |
| **Category** | Assign to a category (e.g., "Mutual Funds & Equity") |
| **Static Route** | Custom URL slug (e.g., `equity-mutual-fund-analysis`) |
| **Visibility** | Show (visible on website) / Hide (hidden from listing) |
| **Published** | Toggle ON to make it live, OFF to keep it as a draft |

3. Click **Save / Create**

### Editing an Existing Course

1. Find the course in the list
2. Click the **Edit** button (pencil icon)
3. Make your changes in the form
4. Click **Save**

> **Important:** The **Published** toggle is the main switch to make a course appear or disappear from the website. Turning it OFF immediately removes it from the student-facing website.

### Course Visibility vs. Published

- **Visibility: Hidden** — Course won't appear in the course catalog/listing
- **Published: OFF** — Course is completely offline (draft mode)
- A course needs **Visibility: Show** AND **Published: ON** to be visible to customers

### Waitlist Management

For **"Coming Soon"** courses, you can:
1. Click on the course to open its detail view
2. See a **Waitlist** tab with all users who clicked "Notify Me"
3. Download the waitlist as a **CSV file** to export to your email marketing tool

---

## 6. Categories Management

**Navigate to:** Sidebar → **Categories**

Categories are used to organize courses into groups on the student website (filters on the `/courses` page).

### Current Categories

- Getting Started
- Mutual Funds & Equity
- Advanced Strategies *(and others you create)*

### Creating a New Category

1. Click **"Add Category"**
2. Enter the **Category Name**
3. Click Save

### Editing a Category Name

1. Find the category in the list
2. Click the **Edit** button
3. Change the name
4. Click Save

### Understanding the Course Count Column

Each category row shows how many masterclasses are assigned to it (e.g., "4 masterclasses"). This helps you keep categories balanced.

> **Note:** Categories cannot be deleted if courses are assigned to them. Reassign courses to other categories first.

---

## 7. Coupons Management

**Navigate to:** Sidebar → **Coupons**

Coupons are discount codes users can enter at checkout to get a price reduction.

### Viewing All Coupons

You'll see a list of all coupons with:
- Coupon code
- Discount amount/percentage
- Expiry date
- Usage count (how many times used vs. the limit)
- Enabled/Disabled status

### Creating a New Coupon

1. Click **"New Coupon"** (or the form mode button)
2. Fill in the details:

| Field | What to Enter |
|---|---|
| **Code** | The code users will type (e.g., `SAVE20`, `LAUNCH50`) — use UPPERCASE, no spaces |
| **Discount** | The discount value (e.g., `20` for 20% or `500` for ₹500) |
| **Discount Type** | `PERCENTAGE` (%) or `FIXED` (₹ flat amount) |
| **Expiry Date** | When the coupon stops working (pick date & time) |
| **Usage Limit** | Max number of times it can be used total (e.g., `100`) |
| **Minimum Amount** | Minimum cart value required to use this coupon (e.g., ₹1000) |
| **Maximum Discount** | Cap the discount amount for percentage coupons (e.g., max ₹500 off even if 30% calculates higher) |
| **Description** | Internal note about what this coupon is for |
| **Applies To** | Leave blank for all courses, or select specific courses |
| **Enabled** | Toggle ON to activate, OFF to deactivate |

3. Click Save

### Editing or Disabling a Coupon

1. Find the coupon in the list
2. Click Edit to change details
3. Toggle the **Enabled** switch to quickly activate/deactivate without deleting

### Coupon Best Practices

- Use meaningful codes tied to campaigns: `JULY2026`, `NEWUSER`, `WORKSHOP50`
- Set an expiry date to create urgency
- Set a usage limit to prevent abuse
- Use the minimum amount field to ensure coupons only apply to full-priced courses

---

## 8. Users & Transactions

**Navigate to:** Sidebar → **Users Management**

This section gives you a full view of everyone who has interacted with the platform.

### What You Can See

- **All registered users** — name, email, phone number, account type
- **All transaction history** — who paid, how much, for which course, payment status
- **Charts and graphs** — user growth over time, revenue trends

### Information Per User

| Column | What It Means |
|---|---|
| Name | User's first and last name |
| Email | Their registered email |
| Phone | Phone number (provided at checkout) |
| Order ID | The ID of their purchase |
| Transaction Status | PAID / FAILED / PENDING |
| Value | Amount paid |
| Event Time | When the transaction happened |
| Admin | Whether this user has admin access |

### Filtering and Searching

- Use the **Search bar** to find a specific user by name or email
- Use **Filter by Status** to show only PAID or FAILED transactions
- Use **Date Range** filters to view users from a specific period

### Exporting Data

Click the **Download/Export** button to download user and transaction data as a **CSV file**. You can open this in Excel or Google Sheets.

### Viewing a User's Order

Click the **Order ID** or a user's row to navigate to the [Order Details](#9-order-details) page for that specific purchase.

### Charts Available

- **Line Chart** — User registrations over time
- **Bar Chart** — Revenue over time
- **Pie Chart** — Payment status breakdown
- **Combo Chart** — Combined views

---

## 9. Order Details

**Navigate to:** Users Management → click an Order ID

This page shows everything about **one specific purchase**.

### What You'll See

| Section | Details |
|---|---|
| **Order Info** | Order ID, order creation date, total amount, order status |
| **Customer** | Name, email, phone (registered user or guest checkout details) |
| **Items Purchased** | List of courses in the order, individual prices |
| **Payment Info** | Payment ID, amount, currency, payment method used, payment status |

### Order Statuses

| Status | Meaning |
|---|---|
| **PAID** | Payment confirmed, customer has course access |
| **PENDING** | Payment initiated but not yet confirmed |
| **FAILED** | Payment did not go through |

### Back Button

Use the **Back** button (← arrow) at the top to return to the previous page (Users list or Dashboard).

---

## 10. Blogs Management

**Navigate to:** Sidebar → **Blogs**

### Blog List Page (`/admin/blogs`)

Shows all blog posts in a searchable table:
- Title, slug (URL), author
- Published status (Live or Draft)
- Tags
- Created/updated dates
- Edit and Delete buttons per post

### Creating a New Blog Post

1. Click **"New Blog"** button (top-right)
2. You're taken to the Blog Form

**Fill in the fields:**

| Field | What to Enter |
|---|---|
| **Title** | The headline of the article |
| **Slug** | URL-friendly version of the title (auto-generated, e.g., `how-to-invest-in-mutual-funds`) |
| **Excerpt** | A short summary (shown in the blog listing page and Google search results) |
| **Thumbnail** | Upload or select a cover image for the post |
| **SEO Title** | Title shown in Google search results (can differ from the article title) |
| **SEO Description** | Description shown in Google search — keep it under 160 characters |
| **Tags** | Keywords for categorization (e.g., `mutual funds`, `investing`) |
| **Content** | Write the full article using the built-in editor (supports headings, bold, italics, bullet lists, images, links) |
| **Published** | Toggle ON to make it live on the website, OFF for draft |

3. Click **Save / Publish**

### Editing an Existing Blog Post

1. Find the blog in the list
2. Click **Edit** (pencil icon) → opens the same form pre-filled
3. Make changes → click Save

### Deleting a Blog Post

1. Click **Delete** on the blog post row
2. Confirm the deletion in the dialog box

> **Warning:** Deleting a blog post is permanent and cannot be undone.

### Using the Content Editor (TipTap)

The blog editor is a rich-text editor (similar to Google Docs):

- **Toolbar** at the top with formatting options
- **Headings:** Select H1, H2, H3 from the dropdown for section titles
- **Bold / Italic / Underline:** Standard text formatting
- **Bullet Lists / Numbered Lists:** For structured content
- **Images:** Insert images into the content body
- **Links:** Highlight text and click the link icon to add hyperlinks
- **Undo / Redo:** Standard keyboard shortcuts work (Ctrl+Z / Ctrl+Y)

---

## 11. Image Management

**Navigate to:** Sidebar → **Images**

This section is a central library for all images used across the website (course thumbnails, blog images, etc.).

### What You Can Do

| Action | How |
|---|---|
| **View all images** | All uploaded images shown in a grid |
| **Upload a new image** | Click "Upload" → select file from your computer |
| **Copy image URL** | Click on an image to get its URL for use in courses/blogs |
| **Delete an image** | Select and delete images no longer needed |

### When to Use Image Management

- Before creating a new course — upload the course thumbnail here first
- Before writing a blog — upload the blog cover image here
- When updating existing course artwork

> **Tip:** Images are stored permanently. Keep the library organized by deleting outdated or duplicate images regularly.

---



## 13. Complete Admin Workflows

### Workflow 1: Launching a New Recorded Course

```
1. Go to Sidebar → Images
   → Upload course thumbnail image

2. Go to Sidebar → Categories
   → Create a new category if needed, or use an existing one

3. Go to Sidebar → Masterclasses → "New Masterclass"
   → Fill in all course details
   → Set Type = RECORDED
   → Set Visibility = Show
   → Set Published = OFF (keep as draft while reviewing)
   → Save

4. Review the course on a staging/preview link

5. Go back to Masterclasses → Edit the course
   → Set Published = ON
   → Save
   → Course is now LIVE on the website

6. Create a coupon for the launch (optional)
   → Go to Coupons → "New Coupon"
   → Set code, discount, expiry, usage limit
   → Enable it
```

### Workflow 2: Running a Live Workshop

```
1. Create the course in Masterclasses
   → Set Type = LIVE
   → Set Start Date for the workshop date/time
   → Set Max Seats (e.g., 100)
   → Publish it

2. Users register and pay on the website

3. After the workshop:
   → Go to Dashboard
   → Filter to the week of the workshop
   → For each registrant, click "Send Registration Details"
   → Click "WhatsApp Community" to add them to the group

4. Download the waitlist CSV from the Masterclass detail view
   → Use for email follow-ups or future campaign targeting
```

### Workflow 3: Creating a Discount Campaign

```
1. Go to Coupons → "New Coupon"
2. Create the coupon:
   → Code: e.g., JULY50
   → Discount: 50% or ₹500 fixed
   → Expiry: Last day of the campaign
   → Usage Limit: e.g., 200 uses
   → Enable it

3. Share the coupon code in:
   → Email campaigns
   → Social media posts
   → WhatsApp messages

4. Monitor usage in Coupons list (shows used count vs. limit)

5. After the campaign, either:
   → Let it expire naturally, OR
   → Toggle Enabled = OFF to immediately disable it
```

### Workflow 4: Publishing a New Blog Post

```
1. Draft the article in Google Docs (for easy collaboration)

2. Go to Sidebar → Blogs → "New Blog"
3. Fill in:
   → Title, Slug, Excerpt
   → SEO Title + Description (for Google)
   → Tags
   → Upload thumbnail in Image Management first, then paste URL
4. Paste/retype content into the editor, format headings and lists
5. Set Published = OFF → Save as draft
6. Review the draft
7. Edit → Set Published = ON → goes live
```

### Workflow 5: Handling a User Support Request

```
Customer says: "I paid but can't access my course"

1. Go to Users Management
2. Search by customer email
3. Find their row → check Transaction Status
   → If PAID: Check if TrainerCentral link is correct in the Masterclass settings
   → If PENDING: Payment may still be processing, wait or check with payment team
   → If FAILED: Payment didn't go through — advise customer to retry

4. Click the Order ID to open Order Details
5. Verify: Order Items (correct course?), Payment Transaction status
6. If all looks good but access is missing, contact the dev team with the Order ID
```

---

## 14. FAQ for Admins

**Q: I published a course but it's not showing on the website. Why?**
A: Check two things: (1) **Visibility** must be set to "Show", AND (2) **Published** must be toggled ON. Both must be active.

**Q: How do I change the price of a course?**
A: Go to Masterclasses → find the course → Edit → change the Price field → Save. The new price appears on the website immediately.

**Q: A user paid but their course isn't in their dashboard. What do I do?**
A: Check their order in Users Management. If the order status is PAID, the TrainerCentral URL might be incorrectly set in the course. Check the Masterclass's `TrainerCentral URL` field. Contact the dev team if needed.

**Q: Can I have multiple admins?**
A: Yes. Admin accounts are managed at the database level by the development team. Contact them to add a new admin user.

**Q: How do I see total revenue for a month?**
A: Go to Users Management and filter by date range. The charts will show revenue for the selected period. You can also export the data as CSV and total it in Excel.

**Q: Can I delete a user?**
A: User deletion is not available in the admin panel UI for safety reasons. Contact the development team if a user needs to be removed.

**Q: What happens if I delete a blog post?**
A: It is permanently removed from the website and cannot be recovered. If uncertain, set it to **Published = OFF** (draft mode) instead of deleting.

**Q: Can I schedule a blog post to auto-publish at a future date?**
A: Currently no. You need to manually turn the Published toggle ON when you want it to go live.

**Q: How do I know which marketing campaign is driving sales?**
A: Each purchase stores UTM tracking data (source, medium, campaign). Ask the development team for a UTM attribution report from the database.

**Q: The coupon code isn't working for a customer. What should I check?**
A: Verify: (1) Is it Enabled? (2) Is it expired? (3) Has it hit the usage limit? (4) Does the cart meet the minimum amount? (5) Is it restricted to specific courses that the customer isn't buying?

**Q: Can I edit an order after it's placed?**
A: No. Orders are financial records and cannot be edited through the admin panel. Contact the development team for any order corrections.

---

## Quick Reference Card

| I Want To... | Go To |
|---|---|
| See today's sales | Dashboard |
| Create a new course | Masterclasses → New Masterclass |
| Make a course invisible temporarily | Masterclasses → Edit → Visibility: Hide |
| Take a course offline | Masterclasses → Edit → Published: OFF |
| Create a discount code | Coupons → New Coupon |
| Disable a coupon | Coupons → find coupon → toggle Enabled OFF |
| Add a course category | Categories → Add Category |
| See who bought what | Users Management |
| View a specific order | Users Management → click Order ID |
| Publish a blog post | Blogs → New Blog (or edit existing) |
| Upload a new image | Images → Upload |
| Export user list | Users Management → Download button |
| Download workshop registrations | Masterclasses → open course → Waitlist → Download CSV |
| Log out | Bottom of sidebar → avatar → Logout |

---

*Last updated: March 2026*
*For technical support, contact the development team with the relevant Order ID, User Email, or Course Name.*
