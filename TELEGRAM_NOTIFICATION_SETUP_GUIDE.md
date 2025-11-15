# 📱 Telegram Notification Setup Guide
## Simple Step-by-Step Instructions

This guide will help you set up automatic Telegram notifications when patients book appointments. Don't worry - it's easier than it sounds!

---

## ✅ What's Already Done (Code Changes)

The following code changes have been completed automatically:
- ✅ New notification file created
- ✅ Appointment booking code updated
- ✅ Database migration file created
- ✅ Environment variable template updated

**You don't need to do anything with the code!** Just follow the steps below.

---

## 📋 What You Need to Do (5 Simple Steps)

### **STEP 1: Add Telegram User ID Column to Database** ⏱️ 5 minutes

**What this does:** Adds a place to store each patient's Telegram ID so we can send them messages.

**How to do it:**
1. Open your **Supabase Dashboard** (the website where you manage your database)
2. Click on **"SQL Editor"** in the left menu
3. Click **"New Query"** button
4. Open the file: `supabase/migrations/20251113000109_add_telegram_user_id.sql`
5. Copy **ALL** the text from that file
6. Paste it into the SQL Editor
7. Click **"Run"** button
8. You should see: ✅ "Success. No rows returned"

**Done!** ✅

---

### **STEP 2: Create Telegram Bot** ⏱️ 10 minutes

**What this does:** Creates a Telegram bot that will send messages to patients.

**How to do it:**
1. Open Telegram app (on phone or computer)
2. Search for **"@BotFather"** and start a chat
3. Send this message: `/newbot`
4. BotFather will ask for a name - type: `EaseHealth Appointment Bot` (or any name you like)
5. BotFather will ask for a username - type: `easehealth_appointment_bot` (must end with "bot")
6. BotFather will give you a **Token** - it looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
7. **COPY THIS TOKEN** - you'll need it in Step 4!

**Done!** ✅

---

### **STEP 3: Set Up Supabase Webhook** ⏱️ 5 minutes

**What this does:** Tells Supabase to automatically send appointment data to n8n when someone books.

**⚠️ IMPORTANT:** You need your n8n webhook URL first! See the section **"🔍 How to Find Your n8n URL"** below if you don't have it yet.

**How to do it:**
1. In **Supabase Dashboard**, click **"Database"** in the left menu
2. Click **"Webhooks"** tab
3. Click **"Create a new webhook"** button
4. Fill in these details:
   - **Name:** `appointment-notification`
   - **Type of Webhook:** Select **"HTTP Request"** from dropdown
   - **Table:** Select `appointments` from dropdown
   - **Events:** Check only **"INSERT"** (uncheck others)
   - **HTTP Request:**
     - **URL:** `https://your-n8n-instance.com/webhook/appointment-notification`
       - ⚠️ Replace `your-n8n-instance.com` with your actual n8n URL!
       - 💡 **Don't have it yet?** Go to Step 4, Part B first to get the webhook URL from n8n, then come back here!
     - **Method:** `POST`
     - **Headers:** Click "Add header"
       - **Name:** `Content-Type`
       - **Value:** `application/json`
5. Scroll down to **"Advanced"** section
6. Check **"Retry on failure"** checkbox
7. Click **"Create webhook"** button

**Done!** ✅

---

### **🔍 How to Find Your n8n URL** (Important!)

**Before Step 3 and Step 4, you need to know your n8n webhook URL. Here's how:**

#### **Option A: If n8n is Running Locally (Development)**

If you're running n8n on your computer:
1. Open your n8n dashboard (usually `http://localhost:5678`)
2. Create the workflow first (Step 4, Part B)
3. When you add the Webhook node and click "Execute Node", n8n will show you a webhook URL
4. The URL will look like: `http://localhost:5678/webhook/appointment-notification`
5. **BUT** - Supabase can't reach `localhost`, so you need one of these:

   **Option A1: Use ngrok (Recommended for Testing)**
   - Install ngrok: https://ngrok.com/download
   - Run: `ngrok http 5678`
   - Copy the HTTPS URL (looks like: `https://abc123.ngrok-free.app`)
   - Your webhook URL will be: `https://abc123.ngrok-free.app/webhook/appointment-notification`
   
   **Option A2: Use Development Proxy (If Already Set Up)**
   - Check your `vite.config.ts` - if you have `/api/n8n/` proxy configured
   - Use: `https://your-app-domain.com/api/n8n/appointment-notification`

#### **Option B: If n8n is Hosted Online (Production)**

If n8n is running on a server/cloud:
1. Your n8n URL is the domain where n8n is hosted
2. Examples:
   - `https://n8n.yourdomain.com`
   - `https://your-n8n-instance.herokuapp.com`
   - `https://your-n8n-instance.railway.app`
3. Your webhook URL will be: `https://your-n8n-domain.com/webhook/appointment-notification`

#### **Option C: Find It in n8n Dashboard**

**The easiest way:**
1. Go to Step 4, Part B first (create the webhook node in n8n)
2. When you add the Webhook node and click "Execute Node"
3. n8n will show you the **exact webhook URL** to use
4. Copy that URL - it's your n8n webhook URL!

**Example webhook URL format:**
- Local: `http://localhost:5678/webhook/appointment-notification`
- With ngrok: `https://abc123.ngrok-free.app/webhook/appointment-notification`
- Production: `https://n8n.yourdomain.com/webhook/appointment-notification`

---

### **STEP 4: Create n8n Workflow** ⏱️ 5 minutes (or 15 min if building manually)

**What this does:** Creates a workflow in n8n that receives appointment data and sends it via Telegram.

**🎯 QUICK WAY: Import the workflow JSON file (Recommended!)**

1. Open your **n8n** dashboard
2. Click **"Workflows"** in the left menu
3. Click the **"⋮"** (three dots) menu → **"Import from File"**
4. Select the file: `n8n-workflows/appointment-telegram-notification.json`
5. Click **"Import"**
6. The workflow will be created automatically!
7. **Skip to Part D** below to configure Telegram credentials

**OR - Build it manually (15 minutes):**

#### Part A: Create the Workflow
1. Open your **n8n** dashboard
2. Click **"Workflows"** in the left menu
3. Click **"Add workflow"** button
4. Name it: `Appointment Telegram Notification`

#### Part B: Add Webhook Node (First Node) - **GET YOUR WEBHOOK URL HERE!**
1. Click **"+"** button to add a node
2. Search for **"Webhook"** and select it
3. Click on the node to configure it:
   - **Path:** `/webhook/appointment-notification`
   - **Method:** `POST`
   - **Response Mode:** `Respond When Last Node Finishes`
4. Click **"Execute Node"** button (to test and get webhook URL)
5. **📋 COPY the webhook URL** - it will be shown in the output panel
   - It looks like: `https://your-n8n.com/webhook/appointment-notification`
   - Or: `http://localhost:5678/webhook/appointment-notification` (if local)
6. **💡 IMPORTANT:** 
   - If you see `localhost` in the URL, Supabase can't reach it!
   - You need to use ngrok or your production URL (see "🔍 How to Find Your n8n URL" section above)
   - **Go back to Step 3** and paste this webhook URL in the Supabase webhook configuration!

#### Part C: Add Function Node (Second Node)
1. Click **"+"** button again
2. Search for **"Code"** and select **"Function"**
3. Connect it to the Webhook node (drag from webhook to function)
4. Click on the Function node to configure it
5. In the code box, paste this code:

```javascript
const data = $input.item.json;

const message = `🎉 *Appointment Confirmed!*

👤 *Patient ID:* ${data.record.patient_id}
👨‍⚕️ *Doctor:* ${data.record.doctor_name || 'Doctor'}
📅 *Date:* ${data.record.schedule_date}
⏰ *Time:* ${data.record.start_time}
🎫 *Queue Token:* *${data.record.queue_token}*

Please arrive 10 minutes before your appointment.

Thank you for choosing EaseHealth!`;

return {
  json: {
    chat_id: data.record.telegram_user_id,
    text: message,
    parse_mode: 'Markdown'
  }
};
```

6. Click **"Execute Node"** to test

#### Part D: Add Telegram Node (Third Node)
1. Click **"+"** button again
2. Search for **"Telegram"** and select it
3. Connect it to the Function node
4. Click on the Telegram node to configure it:
   - **Operation:** `Send Message`
   - **Chat ID:** `{{ $json.chat_id }}`
   - **Text:** `{{ $json.text }}`
   - **Parse Mode:** `Markdown`
5. Click **"Credential"** dropdown → **"Create New"**
6. Fill in:
   - **Name:** `Telegram Bot Token`
   - **Access Token:** Paste the token you got from BotFather in Step 2
7. Click **"Save"**
8. Click **"Execute Node"** to test

#### Part D: Configure Telegram Credentials
1. Click on the **"Send Telegram Message"** node
2. Click **"Credential"** dropdown → **"Create New"**
3. Fill in:
   - **Name:** `Telegram Bot Token`
   - **Access Token:** Paste the token you got from BotFather in Step 2
4. Click **"Save"**
5. Click **"Save"** on the node

#### Part E: Activate the Workflow
1. Click the **toggle switch** at the top right to **"Active"** (it should turn green)
2. Click **"Save"** button

**Done!** ✅

**💡 Note:** If you imported the JSON file, you still need to:
- Configure Telegram credentials (Part D)
- Activate the workflow (Part E)
- Get the webhook URL (Part B) to use in Step 3

---

### **STEP 5: Add Environment Variable** ⏱️ 2 minutes (OPTIONAL)

**What this does:** Enables the backup notification system (fallback). The primary notification (database webhook) works without this!

**⚠️ IMPORTANT:** This step is **OPTIONAL**. Here's why:
- ✅ **Primary notification works without it:** The Supabase Database Webhook (Step 3) sends notifications automatically
- ✅ **Fallback notification needs it:** This is just a backup in case the webhook fails
- ✅ **You can skip this step** if you're okay with just the primary notification system

**If you want the fallback notification (recommended for production):**

1. Open your project folder
2. Find the file named **`.env`** (if it doesn't exist, copy from `env-template.txt`)
3. Open it in a text editor
4. Add this line at the end:
   ```
   VITE_N8N_APPOINTMENT_WEBHOOK=https://your-actual-n8n-url.com/webhook/appointment-notification
   ```
5. Replace `https://your-actual-n8n-url.com/webhook/appointment-notification` with:
   - Your actual n8n webhook URL (same URL you used in Step 3)
   - Example: `https://abc123.ngrok-free.app/webhook/appointment-notification`
   - Example: `https://n8n.yourdomain.com/webhook/appointment-notification`
6. Save the file
7. **Restart your development server** if it's running

**💡 Don't hardcode:** Use your actual n8n URL, not a placeholder. If you don't have one yet, you can skip this step and add it later.

**Done!** ✅

---

## 🎉 Testing

**How to test if everything works:**

1. **Make sure:**
   - ✅ Database migration ran successfully (Step 1)
   - ✅ Telegram bot created (Step 2)
   - ✅ Supabase webhook created (Step 3)
   - ✅ n8n workflow is active (Step 4)
   - ✅ Environment variable added (Step 5) - *Optional, but recommended*

2. **Add a test patient's Telegram ID:**
   - Go to Supabase Dashboard → Table Editor → `patients` table
   - Find a test patient
   - Add their Telegram user ID in the `telegram_user_id` column
   - (To get Telegram user ID: Send `/start` to `@userinfobot` on Telegram)

3. **Book a test appointment:**
   - Go to your app
   - Book an appointment with the test patient
   - Check Telegram - you should receive a message! 📱

---

## ❓ Troubleshooting

### **No Telegram message received?**
- ✅ Check n8n workflow execution logs (see if it ran)
- ✅ Check Supabase webhook logs (see if webhook fired)
- ✅ Make sure patient has `telegram_user_id` filled in
- ✅ Make sure n8n workflow is **Active** (green toggle)

### **Webhook not working?**
- ✅ Make sure n8n webhook URL is correct in Supabase
- ✅ Make sure n8n workflow is active
- ✅ Check n8n webhook URL matches exactly (no extra spaces)

### **Telegram bot not sending?**
- ✅ Check Telegram bot token is correct
- ✅ Make sure patient sent `/start` to your bot first
- ✅ Check Telegram user ID is correct format (numbers only)

---

## 📝 Summary

**What happens when someone books an appointment:**

1. Patient books appointment → Appointment saved in database
2. Supabase webhook automatically fires → Sends data to n8n
3. n8n workflow receives data → Formats message → Sends via Telegram
4. Patient receives message on Telegram! 📱

**If webhook fails:**
- Your app automatically tries again (fallback system)
- Patient still gets notification!

---

## 🆘 Need Help?

If you get stuck:
1. Check the error messages in Supabase Dashboard → Logs
2. Check n8n workflow execution logs
3. Make sure all URLs match exactly (no typos)
4. Verify Telegram bot token is correct

**That's it!** You're all set! 🎉

