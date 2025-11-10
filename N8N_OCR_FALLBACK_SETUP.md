# n8n OCR Fallback Setup for Image-Based PDFs

## 🎯 Problem
PDFs with scanned images (like photos of medical reports) return only newlines - no text extracted.

## ✅ Solution
Add OCR fallback when `pdf-parse` fails to extract meaningful text.

---

## 📊 Current Workflow vs. New Workflow

### **BEFORE (Current)**
```
Webhook Trigger
    ↓
Extract PDF Text (pdf-parse)
    ↓
Send to AI (Claude/OpenAI)
    ↓
Return Summary
```

**Problem:** If PDF is image-based → Only newlines extracted → AI gets garbage → Bad summary

---

### **AFTER (Fixed)**
```
Webhook Trigger
    ↓
Extract PDF Text (pdf-parse)
    ↓
Check Text Quality ← NEW NODE
    ├─ Good text? → Send to AI
    └─ Bad text? → OCR Node → Send to AI
                      ↓
                Return Summary
```

---

## 🔧 Implementation Steps

### **Step 1: Add "Check Text Quality" Node**

**Node Type:** `Function` or `Code`  
**Position:** After "Extract PDF Text" node  
**Name:** `Check Text Quality`

**Code:**
```javascript
// Check if PDF text extraction was successful
const extractedText = $json.extracted_text || '';
const textLength = extractedText.trim().length;
const nonWhitespaceChars = extractedText.replace(/\s/g, '').length;

// If less than 50 real characters, it's probably an image-based PDF
if (nonWhitespaceChars < 50) {
  return {
    json: {
      ...($json),
      requiresOCR: true,
      ocrReason: 'Insufficient text extracted - likely image-based PDF',
      originalTextLength: textLength
    }
  };
} else {
  return {
    json: {
      ...($json),
      requiresOCR: false,
      extractionQuality: 'good'
    }
  };
}
```

**Output:** Adds `requiresOCR` flag to data

---

### **Step 2: Add IF Node**

**Node Type:** `IF`  
**Position:** After "Check Text Quality"  
**Name:** `Route Based on Quality`

**Condition:**
- **Field:** `requiresOCR`
- **Operation:** `Equal`
- **Value:** `true`

**Branches:**
- **TRUE branch** → Goes to OCR node
- **FALSE branch** → Goes to AI node (existing)

---

### **Step 3: Add OCR Node** (Choose ONE option)

#### **Option A: Google Cloud Vision API** (RECOMMENDED)
**Best for:** Medical documents, high accuracy

**Node Type:** `HTTP Request`  
**Name:** `OCR with Google Vision`

**Settings:**
- **Method:** POST
- **URL:** `https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY`
- **Authentication:** None (uses API key in URL)
- **Headers:** 
  - `Content-Type: application/json`

**Body (JSON):**
```json
{
  "requests": [
    {
      "image": {
        "content": "{{$json.file_base64}}"
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

**Post-Processing Function:**
```javascript
// Extract text from Google Vision response
const fullText = $json.responses[0]?.fullTextAnnotation?.text || '';

return {
  json: {
    extracted_text: fullText,
    extraction_method: 'google-vision-ocr',
    extraction_success: fullText.length > 0
  }
};
```

---

#### **Option B: AWS Textract** (ALTERNATIVE)
**Best for:** Structured medical forms, tables

**Node Type:** `AWS Textract`  
**Name:** `OCR with AWS Textract`

**Settings:**
- **AWS Credentials:** (Configure in n8n credentials)
- **Operation:** `Analyze Document`
- **Document:** From `file_url` field
- **Feature Types:** `TABLES`, `FORMS`

**Output:** Returns extracted text automatically

---

#### **Option C: Tesseract (Free)** (BASIC)
**Best for:** Simple scans, no budget

**Node Type:** `HTTP Request` (to Tesseract API)  
**Name:** `OCR with Tesseract`

**Pre-requisite:** Deploy Tesseract API server (Docker):
```bash
docker run -d -p 8080:8080 hertzg/tesseract-server
```

**Settings:**
- **Method:** POST
- **URL:** `http://localhost:8080/ocr`
- **Body Type:** `multipart-form-data`
- **Fields:**
  - `file`: `{{$binary.data}}`
  - `lang`: `eng`

---

### **Step 4: Merge Paths**

**Node Type:** `Merge`  
**Name:** `Combine Results`

**Settings:**
- **Mode:** `Wait`
- **Wait for Input:** Both branches

**Connects:**
- OCR Node output → Merge
- IF False branch → Merge
- Merge output → AI Node

---

### **Step 5: Update AI Node Input**

**Node Type:** Your existing AI node  
**Name:** `Generate AI Summary`

**Input Field Update:**
```javascript
// Use extracted_text regardless of source (pdf-parse or OCR)
{{$json.extracted_text}}
```

No other changes needed!

---

## 🎨 Visual Node Flow

```
┌─────────────────┐
│ Webhook Trigger │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Extract PDF     │ (pdf-parse)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Quality   │ ← NEW: JavaScript function
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   IF Node       │ ← NEW: Check requiresOCR
└───┬─────────┬───┘
    │         │
 TRUE│      FALSE│
    │         │
    ▼         └────────────────┐
┌─────────────────┐            │
│   OCR Node      │ ← NEW      │
│ (Google/AWS/    │            │
│  Tesseract)     │            │
└────────┬────────┘            │
         │                     │
         ▼                     ▼
      ┌──────────────────────────┐
      │     Merge Node           │ ← NEW
      └──────────┬───────────────┘
                 │
                 ▼
         ┌─────────────────┐
         │   AI Summary    │ (Existing)
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Return Response │
         └─────────────────┘
```

---

## 🧪 Testing

### **Test Case 1: Text-based PDF**
1. Upload a normal PDF with selectable text
2. Check logs: Should show `requiresOCR: false`
3. Verify: Goes directly to AI node
4. Result: ✅ Summary generated normally

### **Test Case 2: Image-based PDF** (Your problematic file)
1. Upload `2025-RAZAABBAS-May-2025-Healthcheckup-Optum.pdf`
2. Check logs: Should show `requiresOCR: true`
3. Verify: Routes through OCR node
4. Result: ✅ Text extracted via OCR → AI summary works

### **Test Case 3: Corrupted PDF**
1. Upload a broken/empty PDF
2. Check logs: Both extractions fail
3. Verify: Error handling catches it
4. Result: ⚠️ Returns error message

---

## 💰 Cost Comparison

| Method | Cost per 1000 pages | Accuracy | Speed | Medical Docs |
|--------|-------------------|----------|-------|--------------|
| **Google Vision** | ~$1.50 | ⭐⭐⭐⭐⭐ | Fast | ✅ Excellent |
| **AWS Textract** | ~$1.50 | ⭐⭐⭐⭐⭐ | Fast | ✅ Excellent |
| **Tesseract (Free)** | $0 | ⭐⭐⭐ | Slower | ⚠️ Fair |

**Recommendation:** Start with Google Vision for quality, switch to Tesseract if budget is tight.

---

## 🔍 Debugging

### Check if OCR is Working:

**Add a Debug Node** after OCR:
```javascript
console.log('OCR Result:', $json.extracted_text);
console.log('Text Length:', $json.extracted_text.length);
return $json;
```

### Common Issues:

**1. OCR returns empty text**
- Check API key is valid
- Verify PDF base64 encoding is correct
- Check API quota/limits

**2. Text is garbled**
- Try different OCR engine
- Check PDF quality (low resolution?)
- Adjust OCR language settings

**3. Slow performance**
- Google/AWS are fast (1-3 seconds)
- Tesseract can be slow (5-10 seconds)
- Consider caching OCR results

---

## 📝 Quick Setup Checklist

- [ ] **1.** Add "Check Text Quality" function node
- [ ] **2.** Add IF node with `requiresOCR` condition
- [ ] **3.** Choose OCR provider (Google/AWS/Tesseract)
- [ ] **4.** Set up API credentials
- [ ] **5.** Add OCR node with correct settings
- [ ] **6.** Add Merge node
- [ ] **7.** Connect all nodes properly
- [ ] **8.** Test with text-based PDF
- [ ] **9.** Test with image-based PDF (your problematic file)
- [ ] **10.** Check n8n logs for errors
- [ ] **11.** Deploy and monitor

---

## 🚀 Expected Results

### Before Fix:
```json
{
  "extracted_text": "\n\n\n\n\n\n...",  // Only newlines
  "extraction_success": true,            // False positive
  "extraction_method": "pdf-parse"
}
```
→ AI receives garbage → Bad summary ❌

### After Fix:
```json
{
  "extracted_text": "HEALTH CHECKUP REPORT\nPatient: Raza Abbas\nDate: May 2025\nBlood Pressure: 120/80...",
  "extraction_success": true,
  "extraction_method": "google-vision-ocr",  // OCR was used!
  "requiresOCR": true
}
```
→ AI receives real text → Good summary ✅

---

## 💡 Pro Tips

1. **Cache OCR Results:** Store OCR text in database by `file_hash` to avoid re-processing same file
2. **Parallel Processing:** If multiple PDFs, run OCR in parallel
3. **Fallback Chain:** Try pdf-parse → Google Vision → AWS Textract → Error
4. **Quality Threshold:** Adjust the 50-character threshold based on your needs
5. **Monitoring:** Track OCR usage and costs in your n8n logs

---

## 📞 Need Help?

**If OCR node fails:**
1. Check n8n execution logs
2. Verify API credentials
3. Test API endpoint with curl:
   ```bash
   curl -X POST https://vision.googleapis.com/v1/images:annotate?key=YOUR_KEY \
     -H "Content-Type: application/json" \
     -d '{"requests":[{"image":{"content":"BASE64_HERE"},"features":[{"type":"TEXT_DETECTION"}]}]}'
   ```

**If still having issues:**
- Share the n8n execution error log
- Share the PDF file structure (image count, page count)
- Check if PDF has encryption/password protection

---

**That's it! Your n8n workflow will now handle both text-based and image-based PDFs automatically.** 🎉


