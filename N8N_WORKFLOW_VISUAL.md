# n8n Workflow Visual Guide - OCR Fallback

## 🎯 Current Problem
```
PDF with scanned image → pdf-parse → "\n\n\n\n..." → AI → Bad summary ❌
```

## ✅ Solution
```
PDF → Check if image-based → Yes → OCR → Real text → AI → Good summary ✅
                            → No → Direct → Real text → AI → Good summary ✅
```

---

## 📊 Node Flow Diagram

### **SIMPLE VIEW**

```
┌─────────────┐
│   START     │ Webhook receives PDF
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Extract PDF │ Try pdf-parse first (fast)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Check Text  │ ← ADD THIS
│   Quality   │   Count real characters
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   IF Good?  │ ← ADD THIS
└───┬─────┬───┘   Is text > 50 chars?
    │     │
  NO│    YES│
    │     │
    ▼     └──────┐
┌─────────┐      │
│   OCR   │←ADD  │
└────┬────┘      │
     │           │
     │           │
     └─────┬─────┘
           ▼
     ┌─────────┐
     │  Merge  │ ← ADD THIS
     └────┬────┘
          │
          ▼
     ┌─────────┐
     │   AI    │ (Existing)
     └────┬────┘
          │
          ▼
     ┌─────────┐
     │  Return │
     └─────────┘
```

---

## 🔧 Detailed Node Configuration

### **NODE 1: Check Text Quality** (NEW)

**Type:** `Function`  
**Position:** After "Extract PDF Text"

```javascript
// Count non-whitespace characters
const extractedText = $json.extracted_text || '';
const realChars = extractedText.replace(/\s/g, '').length;

console.log(`Text length: ${realChars} characters`);

if (realChars < 50) {
  console.log('⚠️ Image-based PDF detected - will use OCR');
  return {
    json: {
      ...($json),
      requiresOCR: true,
      textQuality: 'poor'
    }
  };
} else {
  console.log('✅ Good text extraction');
  return {
    json: {
      ...($json),
      requiresOCR: false,
      textQuality: 'good'
    }
  };
}
```

**Output Fields Added:**
- `requiresOCR`: true/false
- `textQuality`: "good"/"poor"

---

### **NODE 2: Route Based on Quality** (NEW)

**Type:** `IF`

**Conditions:**
- **Field to Check:** `{{ $json.requiresOCR }}`
- **Operation:** `Equal`
- **Value:** `true`

**Branches:**
- **true** → Connect to OCR node
- **false** → Connect to Merge node (skip OCR)

---

### **NODE 3: Google Vision OCR** (NEW)

**Type:** `HTTP Request`

**Method:** `POST`

**URL:**
```
https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY
```

**Authentication:** None (key in URL)

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "requests": [
    {
      "image": {
        "content": "{{ $json.file_base64 }}"
      },
      "features": [
        {
          "type": "DOCUMENT_TEXT_DETECTION"
        }
      ]
    }
  ]
}
```

**Post-Process (Add Function node after this):**
```javascript
// Extract text from Google Vision response
const response = $json;
const fullText = response.responses[0]?.fullTextAnnotation?.text || '';

console.log(`OCR extracted ${fullText.length} characters`);

return {
  json: {
    extracted_text: fullText,
    extraction_method: 'google-vision-ocr',
    extraction_success: fullText.length > 0
  }
};
```

---

### **NODE 4: Merge** (NEW)

**Type:** `Merge`

**Mode:** `Wait`

**Inputs:**
1. IF node (false branch) - text-based PDFs
2. OCR node output - image-based PDFs

**Output:** Merged stream goes to AI node

---

### **NODE 5: AI Summary** (EXISTING - No Changes)

**Input Field:**
```
{{ $json.extracted_text }}
```

Works with both pdf-parse and OCR text!

---

## 📝 Connection Map

```
[Extract PDF Text]
       ↓
[Check Text Quality] ← ADD
       ↓
[IF requiresOCR?] ← ADD
   ├─ TRUE ──→ [OCR Node] ─┐ ← ADD
   │                        ↓
   └─ FALSE ──→ [Merge] ←──┘ ← ADD
                   ↓
            [AI Summary] (existing)
                   ↓
            [Return Response]
```

---

## 🎨 Color Coding (Optional in n8n)

- 🟢 **Green nodes:** Existing (don't touch)
- 🔵 **Blue nodes:** New logic nodes
- 🟡 **Yellow nodes:** OCR processing
- 🟣 **Purple nodes:** Merge/routing

---

## ⚙️ Get Google Vision API Key

### **Quick Setup (5 minutes):**

1. Go to: https://console.cloud.google.com
2. Create new project: "EaseHealth-OCR"
3. Enable API: Search "Cloud Vision API" → Enable
4. Create credentials:
   - API Keys → Create API Key
   - Restrict key to "Cloud Vision API"
   - Copy key
5. Paste in n8n HTTP Request URL

**Cost:** Free tier = 1,000 images/month, then $1.50/1,000

---

## 🧪 Test Cases

### **Test 1: Normal PDF (text-based)**
```
Input: regular_report.pdf
       ↓
Extract PDF: "Patient Name: John Doe, BP: 120/80..."
       ↓
Check Quality: realChars = 500 → requiresOCR = false
       ↓
IF Node: FALSE branch
       ↓
Merge → AI → Summary ✅
```

**Expected:** Fast (2-3 sec), no OCR used

---

### **Test 2: Scanned PDF (your problematic file)**
```
Input: 2025-RAZAABBAS-May-2025-Healthcheckup-Optum.pdf
       ↓
Extract PDF: "\n\n\n\n\n..." (only newlines)
       ↓
Check Quality: realChars = 0 → requiresOCR = true
       ↓
IF Node: TRUE branch
       ↓
OCR Node: Extracts "HEALTH CHECKUP REPORT Patient: Raza Abbas..."
       ↓
Merge → AI → Summary ✅
```

**Expected:** Slower (4-6 sec), OCR used, text extracted correctly

---

## 🐛 Debugging

### **Check OCR Trigger**

Add this to your workflow execution log:

```javascript
// In "Check Text Quality" node
console.log('=== TEXT QUALITY CHECK ===');
console.log('Extracted text length:', $json.extracted_text.length);
console.log('Real characters:', $json.extracted_text.replace(/\s/g, '').length);
console.log('Requires OCR:', realChars < 50);
console.log('========================');
```

### **Check OCR Output**

Add this after OCR node:

```javascript
console.log('=== OCR RESULT ===');
console.log('OCR text length:', $json.extracted_text.length);
console.log('First 100 chars:', $json.extracted_text.substring(0, 100));
console.log('==================');
```

---

## 💡 Pro Tips

1. **Test with curl first:**
   ```bash
   curl -X POST "https://vision.googleapis.com/v1/images:annotate?key=YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "requests": [{
         "image": {"content": "BASE64_HERE"},
         "features": [{"type": "TEXT_DETECTION"}]
       }]
     }'
   ```

2. **Base64 encoding:**
   - Make sure your PDF is base64 encoded
   - Field should be `$json.file_base64`
   - If not available, add encoding step before OCR

3. **Threshold tuning:**
   - Start with 50 characters
   - Adjust based on your PDFs
   - Too low = unnecessary OCR calls
   - Too high = miss some image PDFs

4. **Error handling:**
   - Add try-catch in Function nodes
   - Set default values for missing fields
   - Log all errors for debugging

---

## 📊 Expected Results

### **Before Fix:**
```json
{
  "report_name": "scanned-report.pdf",
  "extracted_text": "\n\n\n\n\n...",
  "extraction_method": "pdf-parse",
  "ai_summary": "Unable to analyze report - insufficient text"
}
```
❌ **Failed**

### **After Fix:**
```json
{
  "report_name": "scanned-report.pdf",
  "extracted_text": "HEALTH CHECK REPORT\nPatient: John Doe...",
  "extraction_method": "google-vision-ocr",
  "requiresOCR": true,
  "ai_summary": "✅ Complete analysis with findings..."
}
```
✅ **Success**

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Get Google API key | 5 min |
| Add Check Quality node | 2 min |
| Add IF node | 1 min |
| Add OCR node | 5 min |
| Add Merge node | 2 min |
| Connect everything | 3 min |
| Test | 5 min |
| **TOTAL** | **~20 min** |

---

## ✅ Completion Checklist

- [ ] Google Vision API key obtained
- [ ] "Check Text Quality" node added
- [ ] IF node configured with `requiresOCR` condition
- [ ] OCR HTTP Request node added with API key
- [ ] OCR post-process Function node added
- [ ] Merge node added
- [ ] All nodes connected correctly
- [ ] Tested with text-based PDF → Works
- [ ] Tested with image-based PDF → OCR triggered
- [ ] Tested with your problematic PDF → Text extracted
- [ ] AI summary quality verified
- [ ] Workflow saved and activated

---

**That's it! Follow this visual guide and you'll have OCR working in 20 minutes.** 🎉


