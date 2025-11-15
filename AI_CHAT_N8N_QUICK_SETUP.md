# AI Chat - n8n Quick Setup Guide

## 🚀 5-Minute Integration

### Step 1: Locate the Code (1 min)

**File:** `src/components/PatientTab/AICollapsibleChat/AICollapsibleChat.tsx`  
**Lines:** 75-130

Find this section:
```typescript
// TODO: Replace with actual n8n webhook URL
```

---

### Step 2: Replace Mock Code (2 min)

**REMOVE** these lines (89-108):
```typescript
// MOCK RESPONSE FOR DEVELOPMENT
await new Promise(resolve => setTimeout(resolve, 1500));

const mockResponse = {
  answer: `Based on the ${reportIds.length} report(s) analyzed:\n\n` +
          `📊 Analysis of ${reportNames.length > 0 ? reportNames.join(', ') : 'selected reports'}\n\n` +
          `Your question: "${question}"\n\n` +
          `⚠️ This is a mock response for development testing.\n` +
          `Replace the n8n webhook URL in AICollapsibleChat.tsx to get real AI responses.\n\n` +
          `The actual integration will analyze medical reports and provide intelligent responses based on Claude AI.`,
  confidence: 'medium'
};

const aiMessage: Message = {
  id: uuidv4(),
  role: 'assistant',
  content: mockResponse.answer,
  timestamp: new Date(),
  confidence: mockResponse.confidence as 'high' | 'medium' | 'low'
};
setMessages(prev => [...prev, aiMessage]);
```

**ADD** this code instead:
```typescript
const response = await fetch('https://YOUR-NGROK-URL.ngrok-free.app/webhook/report-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question,
    patientId,
    reportIds,
    doctorId,
    chatHistory: messages.slice(-10)
  })
});

if (!response.ok) {
  throw new Error(`AI service returned status ${response.status}`);
}

const data = await response.json();

if (!data.success || !data.answer) {
  throw new Error('Invalid response from AI service');
}

const aiMessage: Message = {
  id: uuidv4(),
  role: 'assistant',
  content: data.answer,
  timestamp: new Date(),
  confidence: data.confidence as 'high' | 'medium' | 'low'
};
setMessages(prev => [...prev, aiMessage]);
```

---

### Step 3: Update Your n8n URL (30 sec)

Replace `'https://YOUR-NGROK-URL.ngrok-free.app/webhook/report-chat'` with your actual webhook URL.

**Examples:**
- ngrok: `https://4f937a970858.ngrok-free.app/webhook-test/report-chat`
- Production: `https://n8n.yourdomain.com/webhook/report-chat`

---

### Step 4: Verify n8n Response Format (1 min)

Your n8n workflow must return JSON in this format:

```json
{
  "success": true,
  "answer": "Based on the medical reports...",
  "confidence": "high",
  "timestamp": "2025-11-09T15:19:24.173Z",
  "reportsAnalyzed": 3,
  "question": "What are the key abnormal findings?"
}
```

**Required fields:**
- `success` (boolean)
- `answer` (string)
- `confidence` (string: "high", "medium", or "low")

**Optional fields:**
- `timestamp`, `reportsAnalyzed`, `question` (for logging)

---

### Step 5: Test! (30 sec)

1. Save the file
2. Refresh your browser
3. Generate AI Summary
4. Expand AI Chat
5. Ask a question

**Check for:**
- ✅ Real AI response appears
- ✅ Confidence badge shows
- ✅ No errors in browser console
- ✅ No errors in n8n execution log

---

## 🔧 Advanced Configuration

### Timeout Adjustment

If responses take longer than 30 seconds, you may want to add a timeout:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

try {
  const response = await fetch('YOUR_WEBHOOK_URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* ... */ }),
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  // ... rest of code
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    throw new Error('Request timed out after 30 seconds');
  }
  throw error;
}
```

---

### Error Message Customization

Update the error message in the `catch` block (lines 111-125):

```typescript
} catch (err) {
  console.error('Chat error:', err);
  setError('Failed to get AI response. Please try again.');
  
  // Customize error message based on error type
  let errorText = 'Connection error. Please check your internet connection.';
  if (err.message.includes('timed out')) {
    errorText = 'Request timed out. The AI is taking longer than expected.';
  } else if (err.message.includes('status')) {
    errorText = 'AI service is temporarily unavailable. Please try again later.';
  }
  
  const errorMessage: Message = {
    id: uuidv4(),
    role: 'system',
    content: `⚠️ ${errorText}`,
    timestamp: new Date()
  };
  setMessages(prev => [...prev, errorMessage]);
}
```

---

### CORS Issues (if applicable)

If you encounter CORS errors:

1. **Option A: Configure n8n CORS headers**
   - Add "Respond to Webhook" node with headers:
     ```
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: POST, OPTIONS
     ```

2. **Option B: Use a proxy**
   - Set up a simple proxy in your backend
   - Point the fetch to your backend endpoint
   - Backend forwards to n8n

---

## 🧪 Testing Checklist

After integration:

- [ ] Test with 1 report
- [ ] Test with multiple reports
- [ ] Test with long questions
- [ ] Test with follow-up questions
- [ ] Test error handling (stop n8n and try)
- [ ] Test with different report types (Lab, ECG, etc.)
- [ ] Check n8n execution logs for errors
- [ ] Verify correct patient data is sent
- [ ] Verify chat history is sent (last 10 messages)

---

## 📊 Expected n8n Payload

When a user sends a message, this is what n8n receives:

```json
{
  "question": "What are the key abnormal findings?",
  "patientId": "129ca4cd-dda5-490b-bdf0-8a2001e94db1",
  "reportIds": [
    "d3e9a4a6-f03c-4bc0-ad6a-84e4270136a1",
    "86380d2e-40c0-48ea-a916-91ceb0c19ed2"
  ],
  "doctorId": "0a6194eb-111b-4feb-aa4b-3a5515b86d69",
  "chatHistory": [
    {
      "id": "uuid-1",
      "role": "user",
      "content": "Previous question?",
      "timestamp": "2025-11-09T15:10:00.000Z"
    },
    {
      "id": "uuid-2",
      "role": "assistant",
      "content": "Previous answer...",
      "timestamp": "2025-11-09T15:10:05.000Z",
      "confidence": "high"
    }
  ]
}
```

---

## 🐛 Common Issues

### Issue 1: "fetch is not defined"
**Solution:** You're testing in a very old browser. Update browser or use polyfill.

---

### Issue 2: CORS Error
**Solution:** See CORS section above. Configure n8n headers or use proxy.

---

### Issue 3: Empty Response
**Solution:** Check n8n workflow execution log. Verify "Format Response" node output.

---

### Issue 4: Confidence Badge Not Showing
**Solution:** Ensure n8n returns confidence as "high", "medium", or "low" (lowercase).

---

### Issue 5: Chat History Not Working
**Solution:** Verify chatHistory array is being received in n8n "Validate Input" node.

---

## ✅ Integration Complete!

Once this works, you have a fully functional AI chat system with:
- ✅ Real-time medical report analysis
- ✅ Conversation history
- ✅ Confidence scoring
- ✅ Error handling
- ✅ Beautiful UI

---

## 🔄 Rollback Plan

If you need to revert to mock mode:

1. Keep the n8n code but wrap it in a try-catch
2. In the catch block, use the original mock response
3. This gives you a fallback if n8n is down

```typescript
try {
  // Real n8n integration code
  const response = await fetch(/* ... */);
  // ... process response
} catch (err) {
  console.warn('n8n unavailable, using mock response:', err);
  // FALLBACK: Use mock response code here
  const mockResponse = { /* ... */ };
  // ... rest of mock code
}
```

---

**Integration Time:** ~5 minutes  
**Difficulty:** Easy  
**Risk:** Low (can always revert to mock)

*Ready to go live!* 🚀












