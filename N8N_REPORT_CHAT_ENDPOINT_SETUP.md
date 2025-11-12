# n8n Report Chat Endpoint Setup Guide

## 🎯 **ENDPOINT CONFIGURATION**

Your frontend now sends requests to the `/report-chat` endpoint with extracted text. Configure your n8n workflow to receive and use this data.

---

## 📨 **REQUEST FORMAT**

### **Endpoint:**
```
POST https://whwjdnvxskaysebdbexv.supabase.co/functions/v1/report-chat
```

### **Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

### **Request Body:**
```json
{
  "question": "What are the key abnormal findings?",
  "extractedText": "Full extracted text from all reports...",
  "chatHistory": [
    {
      "role": "user",
      "content": "Previous user question"
    },
    {
      "role": "assistant",
      "content": "Previous AI response"
    }
  ],
  "patientId": "uuid-123",
  "reportIds": ["report-id-1", "report-id-2"],
  "doctorId": "doc-uuid-456"
}
```

### **Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | ✅ Yes | User's question about the reports |
| `extractedText` | string | ✅ Yes | Full extracted text from all selected reports |
| `chatHistory` | array | ✅ Yes | Last 10 messages for context (may be empty array) |
| `patientId` | string | ⚠️ Optional | For logging/tracking |
| `reportIds` | array | ⚠️ Optional | List of report IDs being discussed |
| `doctorId` | string | ⚠️ Optional | For logging/tracking |

---

## 📤 **EXPECTED RESPONSE FORMAT**

### **Success Response:**
```json
{
  "success": true,
  "answer": "Based on the reports, the key abnormal findings are...",
  "confidence": "high",
  "timestamp": "2025-11-11T10:30:00Z"
}
```

### **Required Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `answer` | string | ✅ Yes | AI's response to the question |
| `confidence` | string | ✅ Yes | "high", "medium", or "low" |
| `success` | boolean | ⚠️ Recommended | Indicates success/failure |
| `timestamp` | string | ⚠️ Optional | ISO timestamp of response |

### **Error Response:**
```json
{
  "success": false,
  "error": "Error message here",
  "timestamp": "2025-11-11T10:30:00Z"
}
```

---

## 🔧 **n8n WORKFLOW SETUP**

### **Step 1: Webhook Node**
1. Add a **Webhook** node
2. Set HTTP Method: `POST`
3. Path: `/report-chat`
4. Response Mode: `Wait for Webhook Response`

### **Step 2: Extract Data**
Add a **Set** node to extract fields:

```javascript
// In Set node, extract these values:
{
  "question": "{{ $json.body.question }}",
  "extractedText": "{{ $json.body.extractedText }}",
  "chatHistory": "{{ $json.body.chatHistory }}",
  "patientId": "{{ $json.body.patientId }}",
  "reportIds": "{{ $json.body.reportIds }}",
  "doctorId": "{{ $json.body.doctorId }}"
}
```

### **Step 3: Build AI Prompt**
Add a **Code** node to build the prompt:

```javascript
// Prepare context from chat history
const chatHistory = $input.item.json.chatHistory || [];
const conversationContext = chatHistory
  .map(msg => `${msg.role}: ${msg.content}`)
  .join('\n');

// Build the full prompt
const prompt = `You are a medical AI assistant analyzing patient reports.

EXTRACTED REPORT TEXT:
${$input.item.json.extractedText}

${conversationContext ? `PREVIOUS CONVERSATION:\n${conversationContext}\n` : ''}

CURRENT QUESTION:
${$input.item.json.question}

Please provide a clear, concise answer based on the report data. Focus on:
- Accuracy based on the actual report content
- Clinical relevance
- Clear explanations for medical terms
- Actionable insights when appropriate`;

return {
  json: {
    prompt: prompt,
    question: $input.item.json.question,
    patientId: $input.item.json.patientId
  }
};
```

### **Step 4: Call AI Service**
Add an **HTTP Request** or **OpenAI/Anthropic** node:

#### **Option A: OpenAI Node**
- Model: `gpt-4` or `gpt-3.5-turbo`
- Messages:
  - System: "You are a medical AI assistant."
  - User: `{{ $json.prompt }}`

#### **Option B: Anthropic/Claude Node**
- Model: `claude-3-5-sonnet-20241022`
- Prompt: `{{ $json.prompt }}`
- Max Tokens: 1000

#### **Option C: Custom HTTP Request**
```json
{
  "method": "POST",
  "url": "YOUR_AI_PROVIDER_URL",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  "body": {
    "prompt": "{{ $json.prompt }}",
    "max_tokens": 1000
  }
}
```

### **Step 5: Determine Confidence**
Add a **Code** node to calculate confidence:

```javascript
const aiResponse = $input.item.json.choices[0].message.content; // Adjust based on AI provider

// Simple confidence logic
let confidence = 'medium';

// High confidence indicators
if (aiResponse.match(/according to the report|based on the data|clearly shows/i)) {
  confidence = 'high';
}

// Low confidence indicators
if (aiResponse.match(/unclear|insufficient data|not specified|may require|possibly/i)) {
  confidence = 'low';
}

return {
  json: {
    answer: aiResponse,
    confidence: confidence,
    success: true,
    timestamp: new Date().toISOString()
  }
};
```

### **Step 6: Respond to Webhook**
Add a **Respond to Webhook** node:

```json
{
  "success": "{{ $json.success }}",
  "answer": "{{ $json.answer }}",
  "confidence": "{{ $json.confidence }}",
  "timestamp": "{{ $json.timestamp }}"
}
```

---

## 🧪 **TESTING YOUR WORKFLOW**

### **Test Payload:**
```bash
curl -X POST https://YOUR-N8N-URL/webhook/report-chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the key findings?",
    "extractedText": "Patient: John Doe\nHemoglobin: 12.5 g/dL (Low)\nGlucose: 95 mg/dL (Normal)",
    "chatHistory": [],
    "patientId": "test-123",
    "reportIds": ["report-1"],
    "doctorId": "doc-1"
  }'
```

### **Expected Response:**
```json
{
  "success": true,
  "answer": "Based on the lab report, the key findings are:\n\n1. **Hemoglobin: 12.5 g/dL (Low)** - This indicates mild anemia...\n2. **Glucose: 95 mg/dL (Normal)** - Blood sugar levels are within normal range.",
  "confidence": "high",
  "timestamp": "2025-11-11T10:30:00Z"
}
```

---

## 🔒 **SECURITY CONSIDERATIONS**

### **1. Rate Limiting**
Implement rate limiting to prevent abuse:
- Max 10 requests per minute per user
- Max 100 requests per hour per doctor

### **2. Input Validation**
Validate incoming data:
```javascript
// In Code node
const question = $input.item.json.question;
const extractedText = $input.item.json.extractedText;

if (!question || question.length < 3) {
  return {
    json: {
      success: false,
      error: 'Question is required and must be at least 3 characters'
    }
  };
}

if (!extractedText || extractedText.length < 10) {
  return {
    json: {
      success: false,
      error: 'No report text available for analysis'
    }
  };
}
```

### **3. Authentication (Optional)**
Add authentication header validation:
```javascript
const authHeader = $input.item.json.headers['authorization'];
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return {
    json: {
      success: false,
      error: 'Unauthorized'
    },
    statusCode: 401
  };
}
```

---

## 📊 **MONITORING & LOGGING**

### **Log Important Metrics:**
1. Question asked
2. Response time
3. Extracted text length
4. Confidence level
5. Patient ID (anonymized)
6. Error messages

### **Sample Logging Node:**
```javascript
// Add after AI response
const logData = {
  timestamp: new Date().toISOString(),
  patientId: $input.item.json.patientId,
  questionLength: $input.item.json.question.length,
  extractedTextLength: $input.item.json.extractedText.length,
  confidence: $input.item.json.confidence,
  responseTime: Date.now() - $input.item.json.startTime
};

console.log('Chat Request Log:', logData);

// Optionally send to analytics service
return { json: logData };
```

---

## 🚨 **TROUBLESHOOTING**

### **Problem: "No extracted text available"**
- **Cause:** AI summary not generated first
- **Solution:** Ensure user clicks "Generate AI Summary" before chat

### **Problem: Empty or short responses**
- **Cause:** Insufficient extracted text
- **Solution:** Check if PDF extraction is working properly

### **Problem: Irrelevant answers**
- **Cause:** AI not using extracted text properly
- **Solution:** Review prompt construction, ensure extractedText is in context

### **Problem: Timeout errors**
- **Cause:** Large extracted text (>50KB)
- **Solution:** Implement text chunking or summarization before sending to AI

---

## 🎯 **OPTIMIZATION TIPS**

### **1. Caching**
Cache AI responses for common questions:
```javascript
const cacheKey = `${patientId}_${question.toLowerCase().trim()}`;
// Check cache before calling AI
```

### **2. Text Truncation**
Limit extracted text to most relevant parts:
```javascript
// Keep first 10,000 characters + last 1,000
const truncatedText = extractedText.length > 11000 
  ? extractedText.substring(0, 10000) + '\n...\n' + extractedText.slice(-1000)
  : extractedText;
```

### **3. Confidence Scoring**
Implement better confidence detection:
- Check for specific medical terms
- Verify data mentioned in answer exists in extractedText
- Lower confidence if answer is vague

---

## ✅ **CHECKLIST**

- [ ] Webhook node configured
- [ ] Data extraction working
- [ ] AI prompt includes extractedText
- [ ] AI service connected
- [ ] Confidence calculation implemented
- [ ] Response format matches expected structure
- [ ] Error handling in place
- [ ] Tested with sample data
- [ ] Logging configured
- [ ] Security measures implemented

---

**Status:** Ready for Implementation  
**Priority:** High  
**Estimated Setup Time:** 30-60 minutes



