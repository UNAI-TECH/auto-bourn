# 🟢 AUTOBOURN CRM — WhatsApp Automation Setup Guide

> Complete step-by-step guide to configure Twilio WhatsApp Business API, Supabase Edge Functions, and the CRM integration.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Twilio Account Setup](#2-twilio-account-setup)
3. [WhatsApp Sandbox Setup (Development)](#3-whatsapp-sandbox-setup-development)
4. [WhatsApp Business Profile (Production)](#4-whatsapp-business-profile-production)
5. [Configure Three Sender Numbers](#5-configure-three-sender-numbers)
6. [Supabase Database Migration](#6-supabase-database-migration)
7. [Set Supabase Deno Secrets](#7-set-supabase-deno-secrets)
8. [Deploy the Edge Function](#8-deploy-the-edge-function)
9. [Configure Database Webhook (Optional)](#9-configure-database-webhook-optional)
10. [Add Environment Variables to Next.js](#10-add-environment-variables-to-nextjs)
11. [Testing & Verification](#11-testing--verification)
12. [Troubleshooting](#12-troubleshooting)
13. [Architecture Reference](#13-architecture-reference)

---

## 1. Prerequisites

Before you begin, make sure you have:

- [ ] A **Twilio account** (free trial is OK for development) — [Sign up here](https://www.twilio.com/try-twilio)
- [ ] **Supabase CLI** installed — [Install guide](https://supabase.com/docs/guides/cli/getting-started)
- [ ] Your Supabase project linked locally: `supabase link --project-ref <your-project-ref>`
- [ ] **Node.js 18+** and **npm** installed
- [ ] Access to your Supabase project **SQL Editor** (Dashboard → SQL Editor)

---

## 2. Twilio Account Setup

### 2.1 Create a Twilio Account

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up with your email and verify your phone number
3. Once logged in, go to your **Console Dashboard**

### 2.2 Locate Your Account Credentials

From the Twilio Console Dashboard, note down:

| Credential | Location |
|---|---|
| **Account SID** | Shown at the top of the Console Dashboard (starts with `AC...`) |
| **Auth Token** | Click "Show" next to Auth Token on the Console Dashboard |

> ⚠️ **IMPORTANT**: Never expose your Auth Token in frontend/client-side code. Our architecture keeps it exclusively in Supabase Deno secrets (server-side only).

### 2.3 Buy WhatsApp-Enabled Phone Numbers (Production)

For production, you need **3 Twilio phone numbers** — one for each lead type:

1. Go to **Console → Phone Numbers → Buy a Number**
2. Select your country (India: +91) and check **SMS** and **MMS** capabilities
3. Purchase **3 numbers** and label them:
   - **Number 1**: For Sell Car leads
   - **Number 2**: For Contact Us / Get In Touch leads
   - **Number 3**: For CRM Manual Entry / Walk-in leads

> 💡 If all three lead types should use the **same Twilio account** but different sender numbers, you only need one Account SID + Auth Token pair. If they are on separate Twilio accounts, you'll need individual credentials per lead type.

---

## 3. WhatsApp Sandbox Setup (Development)

The Twilio WhatsApp Sandbox allows you to test WhatsApp messaging **without going through Meta's Business approval**.

### 3.1 Activate the Sandbox

1. Go to **Twilio Console → Messaging → Try it Out → Send a WhatsApp Message**
2. You will see a sandbox number (usually `+1 415 523 8886`) and a **join code** like:
   ```
   join <your-sandbox-keyword>
   ```
3. From **each test phone**, send this join message to the sandbox number via WhatsApp:
   ```
   join <your-sandbox-keyword>
   ```
4. You should receive a confirmation: *"You are now connected to the sandbox"*

### 3.2 Sandbox Limitations

| Feature | Sandbox | Production |
|---|---|---|
| Sender Number | Shared (`+14155238886`) | Your own dedicated numbers |
| Recipients | Only phones that have "joined" | Any WhatsApp user |
| Templates Required | No (free-form allowed within 24h) | Yes (pre-approved templates) |
| Rate Limits | Low (1 msg/sec) | High (varies by plan) |
| Suitable For | Development & Testing | Live customers |

### 3.3 Important Sandbox Notes

- The sandbox uses a **single shared number** (`+14155238886`), so you cannot test multi-number routing in sandbox mode.
- Each recipient phone must send the `join` message first before they can receive sandbox messages.
- Sandbox sessions expire after **72 hours of inactivity**. Recipients may need to rejoin.

---

## 4. WhatsApp Business Profile (Production)

To send messages to real customers without them joining a sandbox:

### 4.1 Submit a WhatsApp Sender Request

1. Go to **Twilio Console → Messaging → Senders → WhatsApp Senders**
2. Click **"New WhatsApp Sender"**
3. Fill in:
   - **Business Display Name**: `AUTOBOURN Cars`
   - **Phone Number**: Select one of your purchased Twilio numbers
   - **Business Category**: `Automotive`
   - **Business Description**: `Premium pre-owned luxury car dealership in Chennai`
4. Submit for Meta approval (takes 1-7 business days)
5. **Repeat for all 3 phone numbers** you want to use

### 4.2 Create Content Templates (Required for Production)

WhatsApp requires pre-approved **Content Templates** to send the first message to a user (outside the 24-hour reply window).

Go to **Twilio Console → Messaging → Content Template Builder** and create:

#### Template 1: Sell Car Greeting
```
Name: sell_car_greeting
Category: MARKETING
Language: en

Body:
Hello {{1}},

Thank you for choosing AUTOBOURN Cars to sell your luxury vehicle! 🚗✨

We have received your listing details for {{2}}. Our certified expert will contact you within 24 hours to schedule a free inspection and provide you with the best valuation.

📋 What happens next:
  1. Our team reviews your submission
  2. We schedule a convenient inspection
  3. You receive a competitive offer

🌐 www.autobourncars.com
📞 +91 91767 77222

Best regards,
AUTOBOURN Cars — Velachery, Chennai

Variables:
{{1}} = Customer Name
{{2}} = Vehicle Details
```

#### Template 2: Contact Us Greeting
```
Name: contact_us_greeting
Category: MARKETING
Language: en

Body:
Hello {{1}},

Thank you for reaching out to AUTOBOURN Cars! 👋

We have received your inquiry regarding {{2}}. A member of our team will respond to you shortly.

We look forward to helping you find your perfect luxury car!

🌐 www.autobourncars.com
📞 +91 91767 77222

Warm regards,
AUTOBOURN Cars — Velachery, Chennai

Variables:
{{1}} = Customer Name
{{2}} = Interest Area
```

#### Template 3: CRM Welcome Greeting
```
Name: crm_welcome_greeting
Category: MARKETING
Language: en

Body:
Hello {{1}},

Welcome to AUTOBOURN Cars! 🎉

We are delighted to have you as a valued prospect. Our luxury car consultant has noted your interest{{2}} and will be in touch to assist you.

Browse our premium certified inventory anytime:
🌐 www.autobourncars.com

📞 +91 91767 77222

Best regards,
AUTOBOURN Cars — Velachery, Chennai

Variables:
{{1}} = Customer Name
{{2}} = Car Detail Suffix (e.g., " in BMW 5 Series")
```

> 💡 **Note**: Template approval usually takes 1-24 hours. Your current Edge Function sends free-form text messages (using the `Body` parameter), which works within the 24-hour session window and for sandbox testing. For production outbound-first messages, you'll eventually need to switch to Content SID-based templates.

---

## 5. Configure Three Sender Numbers

The CRM automation routes messages from **different WhatsApp numbers** based on the lead type:

| Lead Type | Classification Rule | Secret Suffix | Example Number |
|---|---|---|---|
| **Sell Car** | Lead has vehicle details in `interested_car` field (default/fallback) | `_SELL_CAR` | `+91 XXXXX XXXXX` |
| **Contact Us** | `interested_car` starts with `"Get In Touch"` | `_CONTACT` | `+91 YYYYY YYYYY` |
| **CRM Manual** | Source is `manual`, `walk_in`, or `referral` | `_CRM` | `+91 ZZZZZ ZZZZZ` |

### Resolution Logic (with fallback)

```
Lead classified as "contact_greeting"
  → Try TWILIO_WHATSAPP_FROM_CONTACT
  → Fallback to TWILIO_WHATSAPP_FROM (generic)

Lead classified as "crm_welcome"
  → Try TWILIO_WHATSAPP_FROM_CRM
  → Fallback to TWILIO_WHATSAPP_FROM (generic)

Lead classified as "sell_car_greeting"
  → Try TWILIO_WHATSAPP_FROM_SELL_CAR
  → Fallback to TWILIO_WHATSAPP_FROM (generic)
```

This same fallback logic applies to `TWILIO_ACCOUNT_SID_*` and `TWILIO_AUTH_TOKEN_*`.

---

## 6. Supabase Database Migration

Run the SQL migration to create the required database tables and columns.

### 6.1 Run the Migration

1. Open your **Supabase Dashboard → SQL Editor → New Query**
2. Copy the contents of the file: `whatsapp-automation-migration.sql` (located at the project root)
3. Paste and click **Run**

### 6.2 What the Migration Creates

| Object | Type | Purpose |
|---|---|---|
| `leads.wa_greeting_sent` | Column (BOOLEAN) | Prevents duplicate greetings |
| `whatsapp_message_logs` | Table | Stores all outbox logs (sent, failed, pending) |
| `idx_wa_logs_lead` | Index | Fast lookup by lead ID |
| `idx_wa_logs_phone` | Index | Fast lookup by phone |
| `idx_wa_logs_status` | Index | Fast lookup by delivery status |
| `idx_wa_logs_created` | Index | Fast ordering by timestamp |
| RLS Policies (4) | Policies | Admin sees all, employee sees assigned, secure inserts/updates |

### 6.3 Verify the Migration

Run this quick check in SQL Editor:
```sql
-- Check the new column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'wa_greeting_sent';

-- Check the new table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'whatsapp_message_logs';
```

---

## 7. Set Supabase Deno Secrets

These secrets are read by the Edge Function at runtime. They are **never exposed** to the frontend.

### 7.1 Option A — Three Separate Twilio Accounts / Numbers (Recommended)

```bash
# ─── Sell Car Leads (Type 1) ───
supabase secrets set TWILIO_ACCOUNT_SID_SELL_CAR="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
supabase secrets set TWILIO_AUTH_TOKEN_SELL_CAR="your_auth_token_for_sell_car"
supabase secrets set TWILIO_WHATSAPP_FROM_SELL_CAR="+91XXXXXXXXXX"

# ─── Contact Us Leads (Type 2) ───
supabase secrets set TWILIO_ACCOUNT_SID_CONTACT="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
supabase secrets set TWILIO_AUTH_TOKEN_CONTACT="your_auth_token_for_contact"
supabase secrets set TWILIO_WHATSAPP_FROM_CONTACT="+91XXXXXXXXXX"

# ─── CRM Manual / Walk-in Leads (Type 3) ───
supabase secrets set TWILIO_ACCOUNT_SID_CRM="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
supabase secrets set TWILIO_AUTH_TOKEN_CRM="your_auth_token_for_crm"
supabase secrets set TWILIO_WHATSAPP_FROM_CRM="+91XXXXXXXXXX"
```

### 7.2 Option B — Single Twilio Account, Three Numbers

If all three numbers are on the **same Twilio account**, you only need to set the Account SID and Auth Token once as the generic fallback, and provide three different `FROM` numbers:

```bash
# ─── Shared credentials (one Twilio account) ───
supabase secrets set TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
supabase secrets set TWILIO_AUTH_TOKEN="your_single_auth_token"

# ─── Per-lead-type sender numbers ───
supabase secrets set TWILIO_WHATSAPP_FROM_SELL_CAR="+91XXXXXXXXXX"
supabase secrets set TWILIO_WHATSAPP_FROM_CONTACT="+91YYYYYYYYYY"
supabase secrets set TWILIO_WHATSAPP_FROM_CRM="+91ZZZZZZZZZZ"
```

### 7.3 Option C — Sandbox Testing (Single Number)

For development with the Twilio Sandbox, you only need the generic fallback:

```bash
supabase secrets set TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
supabase secrets set TWILIO_AUTH_TOKEN="your_auth_token"
supabase secrets set TWILIO_WHATSAPP_FROM="+14155238886"
```

### 7.4 Verify Your Secrets

```bash
supabase secrets list
```

You should see all the keys you set (values are hidden).

---

## 8. Deploy the Edge Function

### 8.1 Deploy

From your project root directory:

```bash
supabase functions deploy send-whatsapp-greeting
```

### 8.2 Verify Deployment

```bash
supabase functions list
```

You should see `send-whatsapp-greeting` with status `ACTIVE`.

### 8.3 Test the Edge Function Manually

You can invoke the Edge Function directly using curl:

```bash
curl -i -X POST \
  'https://<your-project-ref>.supabase.co/functions/v1/send-whatsapp-greeting' \
  -H 'Authorization: Bearer <your-service-role-key>' \
  -H 'Content-Type: application/json' \
  -d '{"leadId": "<existing-lead-uuid>", "force": true}'
```

Expected response:
```json
{
  "success": true,
  "messageSid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "messageType": "sell_car_greeting"
}
```

---

## 9. Configure Database Webhook (Optional)

This is optional but recommended. It automatically triggers the Edge Function when a new lead is inserted directly into the database (bypassing the Next.js API route).

### 9.1 Set Up the Webhook

1. Go to **Supabase Dashboard → Database → Webhooks**
2. Click **Create a new webhook**
3. Configure:

| Field | Value |
|---|---|
| **Name** | `send-whatsapp-greeting` |
| **Table** | `leads` |
| **Events** | ✅ `INSERT` |
| **Type** | `Supabase Edge Functions` |
| **Edge Function** | `send-whatsapp-greeting` |

4. Click **Create webhook**

> 💡 The Edge Function already has deduplication logic (`wa_greeting_sent` check), so even if both the API route and webhook fire, the greeting will only be sent once.

---

## 10. Add Environment Variables to Next.js

Your Next.js app needs the `SUPABASE_SERVICE_ROLE_KEY` to securely proxy WhatsApp requests from the dashboard to the Edge Function.

### 10.1 Local Development (`.env.local`)

Ensure these are present in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 10.2 Production (Vercel / Hosting Provider)

Add `SUPABASE_SERVICE_ROLE_KEY` as an environment variable in your hosting provider's dashboard:

- **Vercel**: Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` must **never** be prefixed with `NEXT_PUBLIC_` — it should remain server-only.

---

## 11. Testing & Verification

### 11.1 End-to-End Test Checklist

- [ ] **Sandbox joined**: Each test phone has sent the `join` message to the Twilio sandbox
- [ ] **Migration run**: `whatsapp_message_logs` table exists in Supabase
- [ ] **Secrets set**: `supabase secrets list` shows all required keys
- [ ] **Edge function deployed**: `supabase functions list` shows `send-whatsapp-greeting` as `ACTIVE`
- [ ] **Next.js env**: `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`

### 11.2 Test Scenarios

#### Test 1: Sell Car Lead (from /sell page)
1. Go to your website `/sell` page
2. Fill in the form with a **test phone number** that has joined the sandbox
3. Submit the form
4. ✅ Verify: WhatsApp greeting arrives on the test phone
5. ✅ Verify: `whatsapp_message_logs` has a new row with `message_type = 'sell_car_greeting'` and `status = 'sent'`
6. ✅ Verify: `leads` row has `wa_greeting_sent = true`

#### Test 2: Contact Us Lead (from /contact page)
1. Go to your website `/contact` page
2. Fill in the "Get In Touch" form with a test phone
3. Submit
4. ✅ Verify: WhatsApp greeting arrives (different sender number than Test 1 if configured)
5. ✅ Verify: Log shows `message_type = 'contact_greeting'`

#### Test 3: CRM Manual Lead (from Dashboard)
1. Go to **Dashboard → CRM → Leads → New Lead**
2. Create a lead with source `Manual Entry` and a test phone
3. Ensure the "Send WhatsApp welcome greeting" checkbox is checked
4. Submit
5. ✅ Verify: WhatsApp greeting arrives (third sender number if configured)
6. ✅ Verify: Log shows `message_type = 'crm_welcome'`

#### Test 4: Manual Resend (from Lead Details)
1. Open any existing lead in **Dashboard → CRM → Leads → [Lead Name]**
2. Go to the **WhatsApp** tab
3. Click **"Send via Twilio API"**
4. ✅ Verify: Message is sent and a new log entry appears

#### Test 5: Deduplication
1. Trigger a greeting for a lead that already has `wa_greeting_sent = true`
2. ✅ Verify: The function skips sending and returns `"Greeting already sent, skipped."`
3. Now trigger with `force: true` (via the "Resend" button)
4. ✅ Verify: The message is sent again and logged

### 11.3 Check Logs

#### Supabase Edge Function Logs
```bash
supabase functions logs send-whatsapp-greeting --scroll
```

#### Twilio Message Logs
- Go to **Twilio Console → Monitor → Logs → Messaging**
- Filter by your sender number to see delivery statuses

#### Database Outbox Logs
```sql
SELECT id, phone, message_type, status, error_message, created_at
FROM whatsapp_message_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## 12. Troubleshooting

### Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `Missing Twilio credentials in Deno secrets` | Secrets not set or misnamed | Run `supabase secrets list` and verify key names match exactly |
| `Twilio API returned error: 21608` | Recipient hasn't joined sandbox | Ask recipient to send `join <keyword>` to sandbox number |
| `Twilio API returned error: 21211` | Invalid "To" phone number format | Ensure phone has country code (e.g., `+91XXXXXXXXXX`) |
| `Twilio API returned error: 63007` | WhatsApp number not registered | The recipient's number isn't a WhatsApp account |
| `Twilio API returned error: 20003` | Invalid Account SID or Auth Token | Double-check credentials in `supabase secrets list` |
| `Greeting already sent, skipped.` | `wa_greeting_sent` is already `true` | Use `force: true` to resend, or reset the flag in the DB |
| `Lead not found` | Invalid lead UUID passed | Verify the lead ID exists in the `leads` table |
| `SUPABASE_SERVICE_ROLE_KEY missing` | Next.js env var not configured | Add it to `.env.local` or hosting provider dashboard |
| `Unauthorized (401)` from API proxy | User not logged into CRM dashboard | Log in first, then retry |
| `Forbidden (403)` from API proxy | User is not an active employee | Check `employees` table — user must have `status = 'active'` |

### Phone Number Formatting Notes

The Edge Function auto-formats phone numbers:
- `9876543210` → `+919876543210` (assumes India +91)
- `+919876543210` → `+919876543210` (kept as-is)
- `whatsapp:+919876543210` → `+919876543210` (stripped and reformatted)

If your leads have international numbers, ensure they include the country code.

---

## 13. Architecture Reference

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│                  LEAD ENTRY POINTS                   │
├─────────────┬───────────────┬────────────────────────┤
│  /sell page │ /contact page │  CRM Dashboard Manual  │
│  (Type 1)   │   (Type 2)    │      (Type 3)          │
└──────┬──────┴───────┬───────┴──────────┬─────────────┘
       │              │                  │
       └──────────────┼──────────────────┘
                      ▼
         ┌────────────────────────┐
         │  POST /api/leads       │  ← Next.js API Route
         │  (inserts into DB +    │
         │   fire-and-forget      │
         │   Edge Function call)  │
         └───────────┬────────────┘
                     ▼
    ┌─────────────────────────────────────┐
    │  Supabase Edge Function             │
    │  send-whatsapp-greeting             │
    ├─────────────────────────────────────┤
    │  1. Fetch lead from DB              │
    │  2. Check wa_greeting_sent          │
    │  3. Classify lead type              │
    │  4. Resolve Twilio secrets          │
    │     (per lead type + fallback)      │
    │  5. Build personalized message      │
    │  6. POST to Twilio API              │
    │  7. Log result to                   │
    │     whatsapp_message_logs           │
    │  8. Set wa_greeting_sent = true     │
    └──────────┬──────────────────────────┘
               ▼
    ┌──────────────────────┐
    │  Twilio WhatsApp API │
    │  (3 sender numbers)  │
    ├──────────────────────┤
    │  Number 1 → Sell Car │
    │  Number 2 → Contact  │
    │  Number 3 → CRM      │
    └──────────┬───────────┘
               ▼
    ┌──────────────────────┐
    │  Customer's WhatsApp  │
    │  (receives greeting)  │
    └──────────────────────┘
```

### Secret Keys Reference

| Secret Key | Lead Type | Required |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Generic fallback | Yes (if type-specific not set) |
| `TWILIO_AUTH_TOKEN` | Generic fallback | Yes (if type-specific not set) |
| `TWILIO_WHATSAPP_FROM` | Generic fallback | Yes (if type-specific not set) |
| `TWILIO_ACCOUNT_SID_SELL_CAR` | Sell Car | Optional (falls back to generic) |
| `TWILIO_AUTH_TOKEN_SELL_CAR` | Sell Car | Optional (falls back to generic) |
| `TWILIO_WHATSAPP_FROM_SELL_CAR` | Sell Car | Optional (falls back to generic) |
| `TWILIO_ACCOUNT_SID_CONTACT` | Contact Us | Optional (falls back to generic) |
| `TWILIO_AUTH_TOKEN_CONTACT` | Contact Us | Optional (falls back to generic) |
| `TWILIO_WHATSAPP_FROM_CONTACT` | Contact Us | Optional (falls back to generic) |
| `TWILIO_ACCOUNT_SID_CRM` | CRM Manual | Optional (falls back to generic) |
| `TWILIO_AUTH_TOKEN_CRM` | CRM Manual | Optional (falls back to generic) |
| `TWILIO_WHATSAPP_FROM_CRM` | CRM Manual | Optional (falls back to generic) |

### Files Modified / Created

| File | Action | Purpose |
|---|---|---|
| `whatsapp-automation-migration.sql` | NEW | Database schema changes |
| `supabase/functions/send-whatsapp-greeting/index.ts` | REWRITTEN | Core Edge Function with multi-number routing |
| `src/app/api/leads/whatsapp-greeting/route.ts` | NEW | Secure API proxy for manual triggers |
| `src/app/api/leads/route.ts` | MODIFIED | Added fire-and-forget Edge Function call |
| `src/types/crm.ts` | MODIFIED | Added `WhatsAppMessageLog` type + `wa_greeting_sent` |
| `src/app/dashboard/crm/leads/page.tsx` | MODIFIED | WA badges, resend buttons, form checkbox |
| `src/app/dashboard/crm/leads/[id]/page.tsx` | MODIFIED | New WhatsApp tab with outbox + composer |
| `src/lib/twilio.ts` | DELETED | Removed insecure client-side Twilio code |

---

*Last updated: July 2026 — Auto Bourn CRM WhatsApp Automation v1.0*
