# AI Chat Visual Testing Guide

## 🎯 Complete Testing Workflow

Follow this step-by-step guide to test the new AI Chat feature.

---

## 📍 Test Location

**Path:** Doctor Dashboard → Select Patient → Patient Tab

**Component Location:** Between "AI Summary" section and "Diagnosis & Prescription" form

---

## ✅ Test Scenario 1: Initial Disabled State

### **Steps:**
1. Navigate to Doctor Dashboard
2. Click on any patient from the appointments list
3. Scroll down to see the AI Summary section

### **Expected Result:**
- You should see a new collapsible section with header:
  - 💬 Icon
  - "AI Chat About Reports" title
  - Yellow badge: "Generate Summary First"
  - Chevron down icon (indicating collapsed state)

### **Visual Verification:**
- [ ] Component appears below "AI Summary" section
- [ ] Component appears above "Diagnosis & Prescription" form
- [ ] Background is light gray gradient
- [ ] Text is grayed out slightly (opacity: 0.7)
- [ ] Cursor shows "not-allowed" on hover

### **Interaction Test:**
- Click on the header
- Alert should appear: "Please generate AI Summary first before using chat."
- Component should NOT expand

---

## ✅ Test Scenario 2: Enabling the Chat

### **Steps:**
1. Select at least one medical report from the "Uploaded Reports" card
2. Click "Generate AI Summary" button
3. Wait for AI Summary to complete

### **Expected Result:**
- Chat component header transforms:
  - Yellow "Generate Summary First" badge disappears
  - Blue badge appears showing report count (e.g., "1 report" or "3 reports")
  - Component is no longer grayed out
  - Cursor shows pointer on hover

### **Visual Verification:**
- [ ] Badge color changes from yellow to blue
- [ ] Badge text changes to show report count
- [ ] Component opacity returns to normal (1.0)
- [ ] Hover effect appears on header (background darkens slightly)

---

## ✅ Test Scenario 3: Expanding the Chat

### **Steps:**
1. Click on the chat header (now enabled)

### **Expected Result:**
- Smooth expansion animation (0.3s)
- Content reveals three sections:
  1. **Quick Questions** (4 buttons in grid)
  2. **Messages Container** (showing welcome message)
  3. **Input Area** (text field + send button)

### **Visual Verification:**

#### Quick Questions Section:
- [ ] Label: "Quick Questions:" in gray text
- [ ] 4 white buttons with questions:
  - "What are the key abnormal findings?"
  - "Are there any critical values?"
  - "Summarize the main diagnosis"
  - "What follow-up tests are recommended?"
- [ ] Buttons have subtle border
- [ ] Hover effect: buttons turn blue gradient with white text

#### Welcome Message:
- [ ] System message with ℹ️ icon
- [ ] Yellow background
- [ ] Text: "Ready to analyze [N] medical report(s). Ask me anything!"

#### Input Area:
- [ ] White background
- [ ] Text field placeholder: "Ask a question about the reports..."
- [ ] Blue gradient send button with send icon
- [ ] 2px blue border around entire input area

---

## ✅ Test Scenario 4: Quick Question Interaction

### **Steps:**
1. Click on any quick question button (e.g., "What are the key abnormal findings?")

### **Expected Result:**
- User message appears:
  - 👨‍⚕️ Avatar on left
  - Blue gradient message bubble on right
  - Question text in white
  - Rounded corners
- Loading indicator appears:
  - 🤖 Avatar on left
  - Gray bubble with spinning loader icon
  - Text: "AI is analyzing..."
- After 1.5 seconds (mock delay):
  - Loading message disappears
  - AI response appears:
    - 🤖 Avatar on left
    - Gray message bubble
    - Mock response text in dark gray
    - Small "medium" confidence badge below message

### **Visual Verification:**
- [ ] Quick questions section disappears after first message
- [ ] Messages appear with fade-in animation
- [ ] Auto-scroll to latest message
- [ ] Loading spinner rotates smoothly
- [ ] Confidence badge shows correct color (yellow for "medium")

---

## ✅ Test Scenario 5: Manual Question Entry

### **Steps:**
1. Type "What is the patient's hemoglobin level?" in the input field
2. Click send button (or press Enter)

### **Expected Result:**
- Same flow as quick questions:
  - User message appears
  - Loading indicator shows
  - Mock response after delay
  - Auto-scroll to bottom

### **Visual Verification:**
- [ ] Input field clears after sending
- [ ] Send button disables during loading
- [ ] Send button only enables when text is entered
- [ ] Enter key works (without Shift)
- [ ] Shift+Enter NOT implemented (single-line input)

---

## ✅ Test Scenario 6: Multiple Messages

### **Steps:**
1. Send 3-4 different questions
2. Observe conversation history

### **Expected Result:**
- All messages appear in chronological order
- Scrollbar appears when content exceeds 400px
- Each message has:
  - Unique ID
  - Timestamp
  - Proper role (user/assistant/system)
- Auto-scroll maintains view at bottom

### **Visual Verification:**
- [ ] Messages stack properly without overlap
- [ ] User messages consistently align right
- [ ] AI messages consistently align left
- [ ] Avatars remain visible during scroll
- [ ] Scrollbar appears smoothly

---

## ✅ Test Scenario 7: Clear Chat Function

### **Steps:**
1. Click the trash icon in header (appears after messages exist)
2. Confirm the dialog

### **Expected Result:**
- Browser confirmation: "Clear all chat messages?"
- After confirming:
  - All messages disappear
  - Welcome message may reappear (depending on implementation)
  - Trash icon disappears (no messages to clear)

### **Visual Verification:**
- [ ] Trash icon only appears when messages > 1
- [ ] Trash icon turns red on hover
- [ ] Confirmation dialog appears
- [ ] Messages clear immediately after confirmation
- [ ] No console errors

---

## ✅ Test Scenario 8: Collapse and Re-expand

### **Steps:**
1. With active conversation, click header to collapse
2. Click header again to re-expand

### **Expected Result:**
- Smooth collapse animation
- Chevron icon rotates 180° to point down
- On re-expand:
  - All messages are preserved
  - Quick questions do NOT reappear (already used)
  - Scroll position may reset to bottom

### **Visual Verification:**
- [ ] Animation is smooth (no jumps)
- [ ] Icon rotation is smooth
- [ ] Conversation history persists
- [ ] No layout shift in surrounding content

---

## ✅ Test Scenario 9: Chat Disabled During AI Summary Generation

### **Steps:**
1. Select different reports
2. Click "Generate AI Summary" button
3. **During** loading, try to use chat

### **Expected Result:**
- Chat component becomes disabled again
- Even if previously enabled, it locks during generation
- Cannot click to expand
- OR if already expanded, send button disables

### **Visual Verification:**
- [ ] Component grays out during generation
- [ ] Badge may change or show loading state
- [ ] Cannot send messages during generation
- [ ] Re-enables automatically when generation completes

---

## ✅ Test Scenario 10: Switching Patients

### **Steps:**
1. Have an active chat with Patient A
2. Click "Back to Appointments"
3. Select Patient B
4. Generate AI Summary for Patient B
5. Expand chat

### **Expected Result:**
- Chat state resets for Patient B
- No messages from Patient A appear
- Fresh welcome message
- Quick questions reappear
- Correct patient ID and report IDs sent in API calls

### **Visual Verification:**
- [ ] No data leakage between patients
- [ ] Report count reflects Patient B's selection
- [ ] Component behaves as fresh instance

---

## 🎨 Dark Mode Testing

### **Steps:**
1. Enable dark mode in system preferences or app settings
2. Repeat all above scenarios

### **Expected Changes:**
- Component background: Dark gray (#1f2937)
- Header: Darker gradient
- Messages container: Dark background
- AI messages: Dark gray (#374151)
- Input area: Dark with lighter border
- Text: Light colors throughout
- All icons remain visible

### **Visual Verification:**
- [ ] Readable contrast in all sections
- [ ] No white/light flash during animations
- [ ] Icons visible against dark backgrounds
- [ ] Hover effects work in dark mode

---

## 📱 Responsive Testing

### **Mobile View (≤ 768px):**
1. Resize browser to mobile width
2. Test all interactions

### **Expected Changes:**
- Quick questions: Single column (not 2x2 grid)
- Messages container: Max height 300px (reduced from 400px)
- All other functionality identical
- Touch targets remain adequate

### **Visual Verification:**
- [ ] No horizontal scrolling
- [ ] Text remains readable
- [ ] Buttons remain clickable
- [ ] Input area doesn't overflow

---

## 🐛 Error Testing

### **Scenario A: Network Failure Simulation**

*Note: This requires code modification for testing*

Temporarily modify `AICollapsibleChat.tsx` to throw an error:
```typescript
throw new Error('Network error simulation');
```

**Expected Result:**
- Error message appears in red box
- Text: "⚠️ Unable to connect to AI service..."
- Mock response still provided for development

### **Scenario B: Empty Report IDs**

Pass empty array for `reportIds` prop:
**Expected Result:**
- Component may show "0 reports" badge
- API call should handle gracefully

---

## ✅ Performance Testing

### **Checks:**
1. Open browser DevTools → Performance tab
2. Record interaction session
3. Verify:
   - [ ] No memory leaks when expanding/collapsing
   - [ ] Smooth 60fps animations
   - [ ] No layout thrashing
   - [ ] React renders are optimized

---

## 📊 Console Error Check

Throughout all testing:
- [ ] No console errors
- [ ] No console warnings (except pre-existing)
- [ ] No React warnings
- [ ] No TypeScript errors

---

## ✅ Final Integration Checklist

- [ ] AI Summary still generates correctly
- [ ] Diagnosis & Prescription form still works
- [ ] No impact on report selection
- [ ] No impact on patient data display
- [ ] Page load time not affected
- [ ] No visual glitches or layout shifts

---

## 🎬 Testing Complete!

If all scenarios pass, the AI Chat feature is working correctly and ready for n8n integration.

**Next Step:** Update the webhook URL in `AICollapsibleChat.tsx` to connect to real n8n workflow.

---

## 📸 Visual Reference Points

### **Component States Summary:**

1. **Disabled State:**
   - Gray, yellow badge, cursor blocked

2. **Enabled-Collapsed State:**
   - Normal colors, blue badge with count, clickable

3. **Enabled-Expanded State:**
   - Full content visible, quick questions (first time)

4. **Active Chat State:**
   - Multiple messages, scrollable, trash icon visible

5. **Loading State:**
   - Spinner visible, send button disabled

6. **Error State:**
   - Red error box, fallback message

---

*Visual Testing Guide - AI Chat Feature Implementation*
*Last Updated: November 9, 2025*




