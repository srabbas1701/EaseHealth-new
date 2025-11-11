import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Loader, Trash2 } from 'lucide-react';
import './AICollapsibleChat.css';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousReportIdsRef = useRef<string>('');

  const quickQuestions = [
    "What are the key abnormal findings?",
    "Are there any critical values?",
    "Summarize the main diagnosis",
    "What follow-up tests are recommended?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

    setIsLoading(true);
    setError(null);

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: question,
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
                          `Your question: "${question}"\n\n` +
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
          question,
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
  };

  return (
    <div className={`ai-collapsible-chat ${isExpanded ? 'expanded' : 'collapsed'} ${!isEnabled ? 'disabled' : ''}`}>
      {/* Header - Always Visible */}
      <div className="chat-header" onClick={toggleExpand}>
        <div className="chat-header-left">
          <span className="chat-icon">💬</span>
          <h3>AI Chat About Reports</h3>
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

      {/* Collapsible Content */}
      {isExpanded && isEnabled && (
        <div className="chat-content">
          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="quick-questions">
              <p className="quick-questions-label">Quick Questions:</p>
              <div className="quick-questions-grid">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendQuestion(q)}
                    className="quick-question-chip"
                    disabled={isLoading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="messages-container">
            {messages.map(msg => (
              <div key={msg.id} className={`message message-${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👨‍⚕️' : msg.role === 'assistant' ? '🤖' : 'ℹ️'}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
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
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about the reports..."
              disabled={isLoading}
              className="chat-input"
            />
            <button
              onClick={() => sendQuestion(currentQuestion)}
              disabled={!currentQuestion.trim() || isLoading}
              className="send-button"
              title="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICollapsibleChat;

