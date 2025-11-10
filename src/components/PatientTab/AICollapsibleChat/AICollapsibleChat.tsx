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
}

const AICollapsibleChat: React.FC<AICollapsibleChatProps> = ({
  patientId,
  reportIds,
  doctorId,
  reportNames = [],
  isEnabled,
  onChatStart
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "What are the key abnormal findings?",
    "Are there any critical values?",
    "Summarize the main diagnosis",
    "What follow-up tests are recommended?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
      // TODO: Replace with actual n8n webhook URL
      // const response = await fetch('YOUR_N8N_WEBHOOK_URL', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     question,
      //     patientId,
      //     reportIds,
      //     doctorId,
      //     chatHistory: messages.slice(-10)
      //   })
      // });

      // MOCK RESPONSE FOR DEVELOPMENT
      // Simulate API delay
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
        id: generateId(),
        role: 'assistant',
        content: mockResponse.answer,
        timestamp: new Date(),
        confidence: mockResponse.confidence as 'high' | 'medium' | 'low'
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get AI response. Please try again.');
      
      const errorMessage: Message = {
        id: generateId(),
        role: 'system',
        content: '⚠️ Unable to connect to AI service. Using mock response for development.',
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

