# Medical Report Chat - Visual Testing Guide

## 🎨 What You Should See

This guide shows you what the chat interface looks like and how to verify it's working correctly.

## 📸 Component States

### 1. Empty State (No Reports)

When `reportIds` array is empty:

```
┌─────────────────────────────────────────┐
│                                         │
│              📄 [icon]                  │
│                                         │
│         No Reports Selected             │
│                                         │
│  Please select or upload medical        │
│  reports to start asking questions.     │
│                                         │
└─────────────────────────────────────────┘
```

**What to check:**
- ✅ File icon displayed
- ✅ Message centered
- ✅ Text readable in both light/dark mode

---

### 2. Initial State (With Reports)

When reports are loaded but no questions asked yet:

```
┌─────────────────────────────────────────────────────────┐
│  Ask About Reports    [📄 3 reports loaded]    [× Clear]│
├─────────────────────────────────────────────────────────┤
│  QUICK QUESTIONS:                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │ What are the key     │  │ Are there any        │    │
│  │ abnormal findings?   │  │ critical values?     │    │
│  └──────────────────────┘  └──────────────────────┘    │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │ Summarize the main   │  │ What follow-up tests │    │
│  │ diagnosis            │  │ are recommended?     │    │
│  └──────────────────────┘  └──────────────────────┘    │
│                                                          │
│  🤖  Ready to analyze 3 medical reports. Ask me         │
│      anything about the patient's medical data.         │
│                                                          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Type question here...]              [🎤] [Send]      │
└─────────────────────────────────────────────────────────┘
```

**What to check:**
- ✅ Header shows report count
- ✅ Quick question chips visible
- ✅ Welcome message appears
- ✅ Input field active
- ✅ Mic button visible
- ✅ Send button present

---

### 3. Active Conversation

After asking questions:

```
┌─────────────────────────────────────────────────────────┐
│  Ask About Reports    [📄 3 reports loaded]    [× Clear]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│           What are the key abnormal findings?     👤    │
│                                              [Blue pill] │
│                                          2 minutes ago   │
│                                                          │
│  🤖  Based on the reports, the key abnormal findings    │
│  [Gray pill]                                            │
│      include:                                           │
│      • Elevated white blood cell count (15.2)          │
│      • Low hemoglobin (10.2 g/dL)                      │
│      • Abnormal liver enzymes (ALT: 85)                │
│                                                          │
│      2 minutes ago          ✓ High confidence           │
│                                                          │
│           Are these values concerning?            👤    │
│                                              [Blue pill] │
│                                          1 minute ago    │
│                                                          │
│  🤖  Yes, these values require attention...             │
│  [Gray pill]                                            │
│                                                          │
│      AI is thinking...                                  │
│  [Gray pill with dots]                                  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Type question here...]              [🎤] [Send]      │
└─────────────────────────────────────────────────────────┘
```

**What to check:**
- ✅ User messages on right (blue)
- ✅ AI messages on left (gray)
- ✅ Avatars visible (👤 for user, 🤖 for AI)
- ✅ Timestamps show ("X minutes ago")
- ✅ Confidence badges display
- ✅ Typing indicator animates
- ✅ Auto-scrolls to bottom

---

### 4. Voice Recording Active

When microphone button is pressed:

```
┌─────────────────────────────────────────────────────────┐
│                    [Messages above]                      │
├─────────────────────────────────────────────────────────┤
│  [What should I ask about the blood]  [🎤●] [Send]     │
│                                        ^^^^             │
│                                     Recording           │
│                                    (red, pulsing)       │
└─────────────────────────────────────────────────────────┘
```

**What to check:**
- ✅ Mic button turns red
- ✅ Small red dot appears (recording indicator)
- ✅ Mic icon pulses
- ✅ Transcript appears in input as you speak
- ✅ Click again to stop recording

---

### 5. Error State

When API call fails:

```
┌─────────────────────────────────────────────────────────┐
│  🤖  Sorry, I encountered an error processing your      │
│  [Yellow pill]                                          │
│      question. Please try again.                        │
│                                                          │
│  ⚠️  Error: Failed to get response. Please check your  │
│      connection and try again.                          │
│  [Red banner]                                           │
├─────────────────────────────────────────────────────────┤
```

**What to check:**
- ✅ Error message visible
- ✅ Red banner with left border
- ✅ System message in yellow
- ✅ Helpful error text

---

## 🌓 Dark Mode Appearance

### Light Mode Colors:
- **Background**: White (#ffffff)
- **User Messages**: Blue gradient (#0075A2 → #0A2647)
- **AI Messages**: Light gray (#f3f4f6)
- **Text**: Dark gray (#111827)
- **Quick Questions**: White with gray border

### Dark Mode Colors:
- **Background**: Dark gray (#1f2937)
- **User Messages**: Blue gradient (same)
- **AI Messages**: Medium gray (#374151)
- **Text**: Light gray (#e5e7eb)
- **Quick Questions**: Dark gray with border

**What to check:**
- ✅ Toggle dark mode → all colors change
- ✅ Text remains readable
- ✅ Borders visible
- ✅ Buttons properly styled
- ✅ Input fields styled correctly

---

## 📱 Mobile View (< 768px)

On mobile devices:

```
┌──────────────────────────┐
│ Ask About Reports    [×] │
│ [📄 3 reports]          │
├──────────────────────────┤
│ QUICK QUESTIONS:         │
│ ┌──────────────────────┐ │
│ │ What are the key     │ │
│ │ abnormal findings?   │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Are there any        │ │
│ │ critical values?     │ │
│ └──────────────────────┘ │
│                          │
│  [Messages wider: 85%]   │
│                          │
├──────────────────────────┤
│ [Input]   [🎤]  [Send]  │
└──────────────────────────┘
```

**What to check:**
- ✅ Container height: 500px (shorter)
- ✅ Messages: 85% max width (wider)
- ✅ Quick questions: Stacked vertically
- ✅ Smaller font sizes
- ✅ Touch-friendly buttons
- ✅ Proper spacing

---

## 🎯 Interactive Elements

### Buttons

**Quick Question Chips**:
- **Normal**: White background, gray border
- **Hover**: Blue background, blue border, slight lift
- **Disabled**: Reduced opacity

**Send Button**:
- **Normal**: Blue gradient
- **Hover**: Lifted with shadow
- **Disabled**: 50% opacity, no hover effect

**Microphone Button**:
- **Normal**: White circle, gray border
- **Hover**: Light gray background
- **Recording**: Red background, white icon, pulsing
- **Unsupported**: Grayed out with MicOff icon

**Clear Button**:
- **Normal**: Transparent, gray border
- **Hover**: Light gray background

### Animations

**What to check:**
- ✅ New messages slide in from bottom
- ✅ Typing dots animate (. .. ...)
- ✅ Mic icon pulses when recording
- ✅ Recording indicator blinks
- ✅ Hover effects smooth
- ✅ Auto-scroll smooth

---

## ✅ Visual Testing Checklist

### Desktop (1440px)
- [ ] Chat container visible and properly sized
- [ ] Header with report count and clear button
- [ ] Quick question chips in grid layout
- [ ] Messages properly aligned (user right, AI left)
- [ ] Avatars display correctly
- [ ] Timestamps readable
- [ ] Confidence badges styled
- [ ] Input area at bottom
- [ ] All buttons accessible
- [ ] Scrollbar visible when needed

### Tablet (768px)
- [ ] Layout adapts properly
- [ ] Quick questions readable
- [ ] Messages not too wide
- [ ] Buttons proper size
- [ ] Touch targets adequate

### Mobile (375px)
- [ ] Container height reduced
- [ ] Quick questions stacked
- [ ] Messages wider (85%)
- [ ] Font sizes smaller
- [ ] Buttons touch-friendly
- [ ] Keyboard doesn't overlap input

### Dark Mode
- [ ] Toggle dark mode works
- [ ] All text readable
- [ ] Proper contrast ratios
- [ ] Borders visible
- [ ] Buttons styled correctly
- [ ] Hover states work

### Interactions
- [ ] Type in input → text appears
- [ ] Click send → message sent
- [ ] Press Enter → message sent
- [ ] Click quick question → sends question
- [ ] Click mic → recording starts
- [ ] Speak → transcript appears
- [ ] Click mic again → recording stops
- [ ] Click clear → confirms and clears
- [ ] Scroll up → stays at position
- [ ] New message → auto-scrolls

### Edge Cases
- [ ] Very long message → wraps properly
- [ ] Many messages → scrollbar appears
- [ ] No messages → welcome message
- [ ] Error state → error displays
- [ ] Loading state → typing indicator
- [ ] Disabled state → grayed out

---

## 🔍 Browser DevTools Inspection

### Check These Elements

**Container**:
```css
.report-chat-container {
  height: 600px;  /* or 500px on mobile */
  display: flex;
  flex-direction: column;
}
```

**User Messages**:
```css
.chat-message.user {
  flex-direction: row-reverse;  /* Right-aligned */
}
.chat-message.user .message-text {
  background: linear-gradient(135deg, #0075A2, #0A2647);
  color: white;
}
```

**AI Messages**:
```css
.chat-message.assistant .message-text {
  background: #f3f4f6;  /* Light gray in light mode */
  color: #111827;
}
```

---

## 📊 Performance Checks

**What to verify:**
- ✅ Initial render < 1 second
- ✅ Send message < 500ms
- ✅ Receive response depends on AI (usually 2-5s)
- ✅ Smooth scrolling
- ✅ No layout shifts
- ✅ Animations smooth (60fps)
- ✅ No memory leaks

---

## 🎬 Testing Scenarios

### Scenario 1: First Time User

1. Open page → See empty state OR welcome message
2. View quick question chips
3. Click a quick question
4. See message sent
5. See typing indicator
6. See AI response
7. See confidence badge

**Expected**: Smooth, intuitive flow

### Scenario 2: Voice Input

1. Click microphone button
2. Browser asks for permission → Allow
3. Button turns red, starts pulsing
4. Speak: "What are the findings?"
5. See transcript appear in input
6. Click mic again to stop
7. Click send
8. See message sent

**Expected**: Clear feedback at each step

### Scenario 3: Long Conversation

1. Ask 5-10 questions
2. Check scroll behavior
3. Check message order
4. Check timestamps
5. Click clear chat
6. Confirm dialog appears
7. Chat clears, welcome message returns

**Expected**: Maintains performance, proper cleanup

### Scenario 4: Error Handling

1. Disconnect network
2. Send message
3. See error message
4. Reconnect network
5. Try again
6. Works successfully

**Expected**: Clear error communication

---

## 🐛 Common Visual Issues

### Issue: Messages Not Aligned Properly

**Check**:
```css
.chat-message.user {
  flex-direction: row-reverse;  /* Should be here */
}
```

### Issue: Dark Mode Not Working

**Check**:
1. Parent has `.dark` class
2. CSS file imported
3. Dark mode selectors present

### Issue: Scrollbar Always Visible

**Check**:
```css
.messages-container {
  overflow-y: auto;  /* Should be auto, not scroll */
}
```

### Issue: Mobile Layout Broken

**Check**:
```css
@media (max-width: 768px) {
  .message-content {
    max-width: 85%;  /* Should be wider on mobile */
  }
}
```

---

## ✨ Final Visual Verification

Before considering complete, verify:

1. ✅ **Professional appearance**: Clean, modern, medical-appropriate
2. ✅ **Brand consistency**: Colors match EaseHealth theme
3. ✅ **Accessibility**: High contrast, readable fonts
4. ✅ **Responsiveness**: Works on all screen sizes
5. ✅ **Animations**: Smooth and purposeful
6. ✅ **Error states**: Clear and helpful
7. ✅ **Loading states**: Visible and informative
8. ✅ **Empty states**: Instructive and welcoming
9. ✅ **Dark mode**: Fully functional and readable
10. ✅ **Polish**: No visual bugs or glitches

---

**Visual Testing Complete!** 🎨

If everything looks good according to this guide, the chat interface is ready for use!












