# Google Sheets Email Collection Setup

This guide shows you how to set up **unlimited, free** email collection using Google Sheets.

## 📋 What You'll Get:
- ✅ Unlimited submissions (no limits!)
- ✅ 100% Free forever
- ✅ All emails in a Google Sheet
- ✅ Easy to export to CSV
- ✅ No backend server needed

---

## 🚀 Setup Instructions (5 minutes)

### Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "FramerIDE Waitlist"
4. In the first row, add these headers:
   - A1: `Timestamp`
   - B1: `Email`
   - C1: `Source`
   - D1: `User Agent`

### Step 2: Create Google Apps Script

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any existing code
3. Copy and paste the script below:

```javascript
function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Add a new row with the data
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.email,
      data.source || 'Unknown',
      data.userAgent || 'Unknown'
    ]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: Test function
function test() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        email: 'test@example.com',
        timestamp: new Date().toISOString(),
        source: 'Test',
        userAgent: 'Test Browser'
      })
    }
  };
  
  const result = doPost(testData);
  Logger.log(result.getContent());
}
```

### Step 3: Deploy the Script

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: "FramerIDE Waitlist API"
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Click **Deploy**
6. **Copy the Web app URL** (looks like: `https://script.google.com/macros/s/ABC123.../exec`)
7. Click **Done**

### Step 4: Update Your Code

1. Open `/Framersite/src/components/WaitlistModal.tsx`
2. Find this line:
   ```typescript
   const GOOGLE_SHEETS_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
   ```
3. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL` with your actual URL from Step 3

### Step 5: Test It!

1. Run your app: `yarn dev`
2. Click "Start Building" to open the waitlist modal
3. Enter a test email
4. Click "Join Now"
5. Check your Google Sheet - you should see the email appear!

---

## 📊 Viewing Your Data

Your Google Sheet will automatically fill with:
- **Timestamp**: When they signed up
- **Email**: Their email address
- **Source**: "FramerIDE Waitlist"
- **User Agent**: Their browser info

You can:
- ✅ Export to CSV anytime
- ✅ Import to Mailchimp/ConvertKit
- ✅ Share with your team
- ✅ Create charts/analytics

---

## 🔒 Security Notes

- The script runs under YOUR Google account
- Only you can see the spreadsheet
- The endpoint is public but only accepts POST requests
- No sensitive data is exposed

---

## 🐛 Troubleshooting

**"Something went wrong" error:**
1. Make sure you deployed as "Anyone" can access
2. Check the Apps Script logs: **Executions** tab
3. Test the script using the `test()` function

**Emails not appearing:**
1. Refresh your Google Sheet
2. Check if the script is deployed (not just saved)
3. Make sure the URL is correct in your code

---

## 💡 Pro Tips

1. **Add more columns**: Edit the script to capture more data (name, company, etc.)
2. **Email notifications**: Use Google Sheets add-ons to get notified of new signups
3. **Auto-responder**: Use Zapier to send welcome emails automatically
4. **Analytics**: Create a dashboard in Google Sheets to track signups over time

---

## 🎉 You're Done!

Your waitlist can now handle **unlimited signups** for free! 🚀
