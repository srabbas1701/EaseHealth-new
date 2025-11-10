# Medical Report Chat Interface

## 📋 Overview

An AI-powered chat interface that allows doctors to ask questions about patient medical reports and receive intelligent answers. Features both text and voice input with real-time responses.

## ✨ Features

- 💬 **Real-time Chat**: Interactive conversation interface with AI
- 🎤 **Voice Input**: Hands-free question asking using Web Speech API
- 📊 **Confidence Levels**: AI responses include confidence indicators (high/medium/low)
- ⚡ **Quick Questions**: Pre-defined question chips for common queries
- 🌓 **Dark Mode**: Automatic theme support
- 📱 **Mobile Responsive**: Works seamlessly on all devices
- ♿ **Accessible**: Keyboard navigation and screen reader support
- 🔄 **Auto-scroll**: Messages automatically scroll to latest
- 💾 **Chat History**: Maintains context across multiple questions

## 📁 File Structure

```
src/components/PatientTab/ReportChat/
├── ReportChatInterface.tsx    # Main chat component
├── ChatMessage.tsx             # Individual message display
├── VoiceRecorder.tsx           # Voice input handler
├── report-chat.css             # Complete styling
├── index.ts                    # Export barrel
├── ReportChatExample.tsx       # Integration examples
└── README.md                   # This file
```

## 🚀 Quick Start

### 1. Import the Component

```typescript
import ReportChatInterface from './components/PatientTab/ReportChat/ReportChatInterface';
```

### 2. Use in Your Component

```tsx
<ReportChatInterface
  patientId="patient-123"
  reportIds={['report-1', 'report-2']}
  doctorId="doctor-456"
  reportNames={['Blood Test.pdf', 'X-Ray.pdf']}
/>
```

### 3. Configure n8n Webhook

Update the webhook URL in `ReportChatInterface.tsx` (line 84):

```typescript
const response = await fetch('https://your-n8n-instance.com/webhook/report-chat', {
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
```

## 📦 Props Interface

```typescript
interface ReportChatInterfaceProps {
  patientId: string;        // Patient identifier
  reportIds: string[];      // Array of report IDs to query
  doctorId: string;         // Doctor identifier
  reportNames?: string[];   // Optional: Display names of reports
}
```

## 🔧 API Integration

### Request Format

```json
{
  "question": "What are the key abnormal findings?",
  "patientId": "patient-123",
  "reportIds": ["report-1", "report-2"],
  "doctorId": "doctor-456",
  "chatHistory": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "Previous question",
      "timestamp": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Expected Response

```json
{
  "answer": "Based on the reports, the key abnormal findings are...",
  "confidence": "high"
}
```

## 🎨 Customization

### Styling

All styles are in `report-chat.css`. Key variables you can customize:

```css
/* Primary color gradient */
background: linear-gradient(135deg, #0075A2, #0A2647);

/* Container height */
.report-chat-container {
  height: 600px; /* Adjust as needed */
}

/* Message max width */
.message-content {
  max-width: 70%; /* Adjust for wider/narrower messages */
}
```

### Quick Questions

Modify the `quickQuestions` array in `ReportChatInterface.tsx`:

```typescript
const quickQuestions = [
  "Your custom question 1",
  "Your custom question 2",
  // ... add more
];
```

## 🎤 Voice Input

### Browser Support

Voice recognition works in:
- ✅ Chrome/Edge (best support)
- ✅ Safari (partial support)
- ❌ Firefox (not supported)

### Requirements

- HTTPS connection (or localhost for development)
- Microphone permissions granted
- Supported browser

### Usage

1. Click the microphone button
2. Allow microphone access when prompted
3. Speak your question clearly
4. Transcript appears in the input field
5. Click send or press Enter

## 🌐 Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Chat Interface | ✅ | ✅ | ✅ | ✅ |
| Voice Input | ✅ | ✅ | ❌ | ⚠️ |
| Dark Mode | ✅ | ✅ | ✅ | ✅ |
| Mobile | ✅ | ✅ | ✅ | ✅ |

## 📱 Mobile Experience

The interface is fully responsive:
- Adapts to screen size
- Touch-friendly buttons
- Optimized message widths
- Proper keyboard handling

## ♿ Accessibility

- **Keyboard Navigation**: Tab through all interactive elements
- **Focus Indicators**: Clear focus states for all controls
- **ARIA Labels**: Proper labels for screen readers
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Color Contrast**: WCAG AA compliant

## 🔍 Troubleshooting

### Voice Input Not Working

**Problem**: Microphone button disabled or not responding

**Solutions**:
1. Check browser support (use Chrome/Edge)
2. Ensure HTTPS connection (localhost is OK)
3. Grant microphone permissions in browser
4. Check console for errors

### No Response from AI

**Problem**: Messages sent but no response

**Solutions**:
1. Verify n8n webhook URL is correct
2. Check network tab for failed requests
3. Ensure n8n workflow is active
4. Check CORS settings on n8n
5. Verify request payload format

### Styling Issues

**Problem**: Dark mode not working or colors wrong

**Solutions**:
1. Ensure `report-chat.css` is imported
2. Check parent component has proper dark mode class
3. Verify Tailwind CSS is configured correctly
4. Check for CSS conflicts with global styles

### Performance Issues

**Problem**: Chat becomes slow with many messages

**Solutions**:
1. Clear chat history periodically
2. Limit chat history sent to API (already limited to 10)
3. Implement message pagination
4. Use React.memo for ChatMessage component

## 🧪 Testing

### Manual Testing Checklist

- [ ] Send text message
- [ ] Receive AI response
- [ ] Use voice input
- [ ] Click quick question chips
- [ ] Clear chat history
- [ ] Test on mobile device
- [ ] Test in dark mode
- [ ] Test keyboard navigation
- [ ] Test with multiple reports
- [ ] Test with no reports selected

### Test Scenarios

1. **Happy Path**: Send question → Get response → Continue conversation
2. **Error Handling**: Disconnect network → Send message → See error
3. **Voice Input**: Click mic → Speak → See transcript → Send
4. **Quick Questions**: Click chip → See question sent → Get response
5. **Clear Chat**: Send messages → Clear → Confirm empty state

## 📚 Integration Examples

See `ReportChatExample.tsx` for detailed integration examples:

1. **Basic Integration**: Add to existing component
2. **Modal Integration**: Open chat in a dialog
3. **Report Selection**: Let users select which reports to query
4. **Custom Webhook**: Configure n8n connection

## 🔐 Security Considerations

1. **Authentication**: Ensure user is authenticated before allowing chat
2. **Authorization**: Verify doctor has access to patient reports
3. **Data Privacy**: Don't log sensitive medical data
4. **Rate Limiting**: Implement rate limits on n8n webhook
5. **Input Sanitization**: Validate and sanitize all inputs

## 🚧 Future Enhancements

Potential improvements:

- [ ] Message export (PDF/text)
- [ ] Voice output (text-to-speech for responses)
- [ ] Multi-language support
- [ ] Suggested follow-up questions
- [ ] Report highlighting (jump to relevant section)
- [ ] Conversation threading
- [ ] Save/load conversation history
- [ ] Share chat with other doctors
- [ ] Annotation and note-taking

## 📝 License

Part of EaseHealth platform - Internal use only

## 👥 Support

For issues or questions:
1. Check this README
2. Review `ReportChatExample.tsx`
3. Check browser console for errors
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Maintainer**: Development Team


