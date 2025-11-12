import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Loader, Trash2, MessageSquare, Mic, MicOff } from 'lucide-react';
import './AICollapsibleChat.css';

// TypeScript declarations for Speech Recognition API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

// Simple UUID generator (to avoid uuid package import issues)
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  confidence?: 'high' | 'medium' | 'low';
}

interface AICollapsibleChatProps {
  patientId: string;
  reportIds: string[];
  doctorId: string;
  reportNames?: string[];
  isEnabled: boolean;
  onChatStart?: () => void;
  extractedText?: string;
}

const AICollapsibleChat: React.FC<AICollapsibleChatProps> = ({
  patientId,
  reportIds,
  doctorId,
  reportNames = [],
  isEnabled,
  onChatStart,
  extractedText = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousReportIdsRef = useRef<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const lastFinalIndexRef = useRef<number>(-1);
  const interimTextRef = useRef<string>('');
  const accumulatedFinalTextRef = useRef<string>('');

  const quickQuestions = [
    "What are the key abnormal findings?",
    "Are there any critical values?",
    "Summarize the main diagnosis",
    "What follow-up tests are recommended?"
  ];

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSpeechSupported(!!SpeechRecognition);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSpeechSupported) return;

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let newFinalText = '';
      let latestInterimText = '';

      // Process only NEW results since last final index
      for (let i = Math.max(0, lastFinalIndexRef.current + 1); i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          // Only add new final results
          if (transcript) {
            newFinalText += transcript + ' ';
            lastFinalIndexRef.current = i;
          }
        } else {
          // Keep the latest interim result
          if (transcript) {
            latestInterimText = transcript;
          }
        }
      }

      // Update accumulated final text
      if (newFinalText) {
        accumulatedFinalTextRef.current += newFinalText;
        interimTextRef.current = ''; // Clear interim when we get final
      }

      // Update the input field
      setCurrentQuestion(() => {
        // Build the display text: accumulated final + latest interim
        let displayText = accumulatedFinalTextRef.current.trim();
        if (latestInterimText) {
          interimTextRef.current = latestInterimText;
          displayText = (displayText + ' ' + latestInterimText).trim();
        } else {
          interimTextRef.current = '';
        }
        return displayText;
      });
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // These are common and can be ignored
        return;
      }
      setIsRecording(false);
      setError('Speech recognition error. Please try again.');
    };

    recognition.onend = () => {
      if (isRecording) {
        // Restart if still recording (continuous mode)
        try {
          recognition.start();
        } catch (e) {
          setIsRecording(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [isSpeechSupported, isRecording]);

  useEffect(() => {
    if (isExpanded && chatContentRef.current && messages.length > 0) {
      // Only scroll the messages container, not the page
      const container = chatContentRef.current.querySelector('.messages-container') as HTMLElement;
      if (container && messagesEndRef.current) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom) {
          // Use scrollTop instead of scrollIntoView to prevent page jumping
          setTimeout(() => {
            container.scrollTop = container.scrollHeight;
          }, 50);
        }
      }
    }
  }, [messages, isLoading, isExpanded]);

  // Clear chat messages when reportIds change (new report selected)
  useEffect(() => {
    const currentReportIdsKey = reportIds.sort().join(',');
    if (previousReportIdsRef.current && previousReportIdsRef.current !== currentReportIdsKey) {
      setMessages([]);
      setError(null);
      setCurrentQuestion('');
    }
    previousReportIdsRef.current = currentReportIdsKey;
  }, [reportIds]);

  useEffect(() => {
    if (isExpanded && messages.length === 0 && reportIds.length > 0) {
      const welcomeMessage: Message = {
        id: generateId(),
        role: 'system',
        content: `Ready to analyze ${reportIds.length} medical report${reportIds.length > 1 ? 's' : ''}. Ask me anything!`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isExpanded, reportIds.length]);

  const sendQuestion = async (question: string) => {
    if (!question.trim() || !isEnabled) return;

    // Stop recording if active
    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
        interimTextRef.current = '';
        lastFinalIndexRef.current = -1;
        accumulatedFinalTextRef.current = '';
      } catch (e) {
        // Ignore errors
      }
    }

    // Clean up question text
    let cleanQuestion = question.replace(/\[Listening\.\.\.\]$/, '').trim();
    if (interimTextRef.current && cleanQuestion.endsWith(interimTextRef.current)) {
      cleanQuestion = cleanQuestion.replace(interimTextRef.current, '').trim();
    }
    if (!cleanQuestion) return;

    setIsLoading(true);
    setError(null);

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: cleanQuestion,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentQuestion('');

    try {
      // Use real n8n webhook with extracted text
      const webhookUrl = (import.meta as any).env?.VITE_N8N_REPORT_CHAT_WEBHOOK;
      
      if (!webhookUrl) {
        // TEMPORARY: Mock response when webhook URL is not configured
        console.warn('⚠️ VITE_N8N_REPORT_CHAT_WEBHOOK not configured. Using mock response.');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockAnswer = `📊 **Mock Response** (Configure n8n webhook to get real AI responses)\n\n` +
                          `Your question: "${cleanQuestion}"\n\n` +
                          `Extracted text available: ${extractedText.length} characters\n\n` +
                          `To enable real AI chat:\n` +
                          `1. Set up your n8n /report-chat endpoint\n` +
                          `2. Add VITE_N8N_REPORT_CHAT_WEBHOOK to .env\n` +
                          `3. Restart your dev server`;
        
        const aiMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: mockAnswer,
          timestamp: new Date(),
          confidence: 'low'
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: cleanQuestion,
          extractedText,
          chatHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          })),
          patientId,
          reportIds,
          doctorId
        })
      });

      if (!response.ok) {
        throw new Error(`AI service returned status ${response.status}`);
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.answer || 'I received your question but couldn\'t generate a response.',
        timestamp: new Date(),
        confidence: (data.confidence as 'high' | 'medium' | 'low') || 'medium'
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get AI response. Please try again.');

      const errorMessage: Message = {
        id: generateId(),
        role: 'system',
        content: '⚠️ Unable to connect to AI service. Please check your connection and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(currentQuestion);
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear all chat messages?')) {
      setMessages([]);
      setError(null);
    }
  };

  const toggleExpand = () => {
    if (!isEnabled) {
      alert('Please generate AI Summary first before using chat.');
      return;
    }
    setIsExpanded(!isExpanded);
    if (!isExpanded && onChatStart) {
      onChatStart();
    }
    // Stop recording if expanding/collapsing
    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
      } catch (e) {
        // Ignore errors
      }
    }
  };

  const toggleVoiceInput = () => {
    if (!isSpeechSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (!recognitionRef.current) return;

    if (isRecording) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
        // Remove any "[Listening...]" text and interim text
        setCurrentQuestion(prev => {
          let text = prev.replace(/\[Listening\.\.\.\]$/, '').trim();
          if (interimTextRef.current && text.endsWith(interimTextRef.current)) {
            text = text.slice(0, -interimTextRef.current.length).trim();
          }
          return text;
        });
        interimTextRef.current = '';
        lastFinalIndexRef.current = -1;
        accumulatedFinalTextRef.current = '';
      } catch (e) {
        setIsRecording(false);
      }
    } else {
      try {
        // Reset tracking
        lastFinalIndexRef.current = -1;
        interimTextRef.current = '';
        accumulatedFinalTextRef.current = '';
        recognitionRef.current.start();
        setIsRecording(true);
        setError(null);
      } catch (e) {
        console.error('Failed to start recognition:', e);
        setError('Failed to start voice input. Please try again.');
      }
    }
  };

  return (
    <div className={`ai-collapsible-chat-wrapper bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-600 ${!isEnabled ? 'disabled' : ''}`}>
      <div className={`ai-collapsible-chat ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Header - Always Visible - Matching AI Summary Design */}
        <div className="chat-header-wrapper">
          <div className="chat-header" onClick={toggleExpand}>
          <div className="chat-header-left">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100 m-0">AI Chat About Reports</h3>
              <p className="text-sm text-theme-muted dark:text-gray-400 mt-1 m-0">Ask questions about the medical reports and get instant AI-powered answers</p>
            </div>
            {!isEnabled && <span className="disabled-badge">Generate Summary First</span>}
            {isEnabled && reportIds.length > 0 && (
              <span className="report-count">{reportIds.length} report{reportIds.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="chat-header-right">
            {isEnabled && messages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); clearChat(); }}
                className="clear-btn"
                title="Clear chat"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button className="expand-btn">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          </div>
        </div>

      {/* Collapsible Content */}
      {isExpanded && isEnabled && (
        <div className="chat-content" ref={chatContentRef}>
          {/* Quick Questions - Always Visible */}
          <div className="quick-questions">
            <p className="quick-questions-label">Quick Questions:</p>
            <div className="quick-questions-grid">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendQuestion(q)}
                  className="quick-question-chip"
                  disabled={isLoading || isRecording}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="messages-container">
            {messages.map(msg => (
              <div key={msg.id} className={`message message-${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👨‍⚕️' : msg.role === 'assistant' ? '🤖' : 'ℹ️'}
                </div>
                <div className="message-content">
                  {msg.role === 'assistant' && (
                    msg.content.includes('<span') || 
                    msg.content.includes('class="high-risk') || 
                    msg.content.includes('class="moderate-risk') || 
                    msg.content.includes('class="mild-risk') || 
                    msg.content.includes('class="normal') ||
                    msg.content.includes('&lt;span') ||
                    msg.content.includes('high-risk') ||
                    msg.content.includes('moderate-risk') ||
                    msg.content.includes('mild-risk')
                  ) ? (
                    <div 
                      className="message-text ai-chat-message" 
                      dangerouslySetInnerHTML={{ 
                        __html: msg.content.includes('&lt;') 
                          ? msg.content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
                          : msg.content 
                      }} 
                    />
                  ) : (
                    <div className="message-text">{msg.content}</div>
                  )}
                  {msg.confidence && (
                    <span className={`confidence-badge confidence-${msg.confidence}`}>
                      {msg.confidence}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message message-assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <Loader className="spinner" size={16} />
                    <span>AI is analyzing...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-area">
            <input
              type="text"
              value={currentQuestion + (isRecording ? ' [Listening...]' : '')}
              onChange={(e) => {
                // Only remove [Listening...] indicator, don't trim spaces
                const value = e.target.value.replace(/\[Listening\.\.\.\]$/, '');
                setCurrentQuestion(value);
              }}
              onKeyPress={handleKeyPress}
              onKeyDown={(e) => {
                // Allow spacebar to work normally
                if (e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              placeholder={isRecording ? "Listening..." : "Ask a question about the reports..."}
              disabled={isLoading || isRecording}
              className="chat-input"
            />
            {isSpeechSupported && (
              <button
                onClick={toggleVoiceInput}
                className={`voice-button ${isRecording ? 'recording' : ''}`}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
                type="button"
              >
                {isRecording ? (
                  <MicOff size={18} className="voice-icon" />
                ) : (
                  <Mic size={18} className="voice-icon" />
                )}
              </button>
            )}
            <button
              onClick={() => sendQuestion(currentQuestion)}
              disabled={!currentQuestion.trim() || isLoading || isRecording}
              className="send-button"
              title="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AICollapsibleChat;

