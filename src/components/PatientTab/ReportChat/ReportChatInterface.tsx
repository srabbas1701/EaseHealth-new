import React, { useState, useEffect, useRef } from 'react';
import { Send, X, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from './ChatMessage';
import VoiceRecorder from './VoiceRecorder';
import './report-chat.css';

interface ReportChatInterfaceProps {
    patientId: string;
    reportIds: string[];  // Array of report IDs to query
    doctorId: string;
    reportNames?: string[];  // Display which reports are loaded
}

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    confidence?: 'high' | 'medium' | 'low';
}

const ReportChatInterface: React.FC<ReportChatInterfaceProps> = ({
    patientId,
    reportIds,
    doctorId,
    reportNames = [] // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Quick question suggestions
    const quickQuestions = [
        "What are the key abnormal findings?",
        "Are there any critical values?",
        "Summarize the main diagnosis",
        "What follow-up tests are recommended?",
        "Explain elevated markers",
        "Compare with normal ranges"
    ];

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Initialize with welcome message
    useEffect(() => {
        if (messages.length === 0 && reportIds.length > 0) {
            const welcomeMessage: Message = {
                id: uuidv4(),
                role: 'system',
                content: `Ready to analyze ${reportIds.length} medical report${reportIds.length > 1 ? 's' : ''}. Ask me anything about the patient's medical data.`,
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        }
    }, [reportIds.length]);

    const sendQuestion = async (question: string) => {
        if (!question.trim()) return;

        setIsLoading(true);
        setError(null);

        // Add user message immediately
        const userMessage: Message = {
            id: uuidv4(),
            role: 'user',
            content: question,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setCurrentQuestion('');

        try {
            // TODO: Replace with actual n8n webhook URL
            const response = await fetch('YOUR_N8N_WEBHOOK_URL', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    patientId,
                    reportIds,
                    doctorId,
                    chatHistory: messages.slice(-10)  // Last 10 messages for context
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Add AI response
            const aiMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: data.answer || 'I received your question but couldn\'t generate a response.',
                timestamp: new Date(),
                confidence: data.confidence || 'medium'
            };
            setMessages(prev => [...prev, aiMessage]);

        } catch (err) {
            console.error('Chat error:', err);
            setError('Failed to get response. Please check your connection and try again.');

            // Add error message to chat
            const errorMessage: Message = {
                id: uuidv4(),
                role: 'system',
                content: 'Sorry, I encountered an error processing your question. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendQuestion(currentQuestion);
        }
    };

    const handleVoiceTranscript = (text: string) => {
        setCurrentQuestion(prev => prev + ' ' + text);
    };

    const clearChat = () => {
        if (window.confirm('Are you sure you want to clear the chat history?')) {
            setMessages([]);
            setError(null);
            // Re-initialize with welcome message
            const welcomeMessage: Message = {
                id: uuidv4(),
                role: 'system',
                content: `Chat cleared. Ready to analyze ${reportIds.length} medical report${reportIds.length > 1 ? 's' : ''}. Ask me anything!`,
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        }
    };

    if (reportIds.length === 0) {
        return (
            <div className="report-chat-container">
                <div className="empty-state">
                    <FileText size={48} className="empty-icon" />
                    <h3>No Reports Selected</h3>
                    <p>Please select or upload medical reports to start asking questions.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="report-chat-container">
            {/* Header */}
            <div className="chat-header">
                <div className="header-left">
                    <h3>Ask About Reports</h3>
                    <span className="report-count">
                        <FileText size={14} />
                        {reportIds.length} report{reportIds.length > 1 ? 's' : ''} loaded
                    </span>
                </div>
                <button onClick={clearChat} className="clear-chat-btn" title="Clear chat history">
                    <X size={16} />
                    Clear
                </button>
            </div>

            {/* Quick Questions - Show only when chat is empty or just has welcome message */}
            {messages.length <= 1 && (
                <div className="quick-questions">
                    <p className="quick-questions-label">Quick questions:</p>
                    <div className="quick-questions-grid">
                        {quickQuestions.map(q => (
                            <button
                                key={q}
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

            {/* Messages Container */}
            <div className="messages-container">
                {messages.map(msg => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}

                {isLoading && (
                    <div className="typing-indicator">
                        <div className="typing-avatar">
                            <span className="avatar-icon">🤖</span>
                        </div>
                        <div className="typing-content">
                            <div className="typing-text">AI is thinking</div>
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
                <VoiceRecorder onTranscript={handleVoiceTranscript} disabled={isLoading} />
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
    );
};

export default ReportChatInterface;

