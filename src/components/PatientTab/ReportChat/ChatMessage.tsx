import React from 'react';
import { User, Bot, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from './ReportChatInterface';

interface ChatMessageProps {
    message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isAssistant = message.role === 'assistant';

    return (
        <div className={`chat-message ${message.role}`}>
            <div className="message-avatar">
                {isUser && <User size={20} />}
                {isAssistant && <Bot size={20} />}
                {isSystem && <AlertCircle size={20} />}
            </div>

            <div className="message-content">
                <div className="message-text">
                    {message.content}
                </div>

                <div className="message-meta">
                    <span className="timestamp">
                        {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </span>

                    {message.confidence && (
                        <span className={`confidence confidence-${message.confidence}`}>
                            {message.confidence === 'high' && '✓ High confidence'}
                            {message.confidence === 'medium' && '⚠ Medium confidence'}
                            {message.confidence === 'low' && '⚠ Low confidence'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;






