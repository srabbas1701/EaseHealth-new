import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceRecorderProps {
    onTranscript: (text: string) => void;
    disabled?: boolean;
}

// Web Speech API types
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscript, disabled = false }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            setIsSupported(false);
            return;
        }

        // Initialize speech recognition
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
            const currentTranscript = Array.from(event.results)
                .map((result: any) => result[0].transcript)
                .join('');
            setTranscript(currentTranscript);
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
            if (transcript.trim()) {
                onTranscript(transcript);
                setTranscript('');
            }
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);

            // Handle specific errors
            if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please allow microphone access in your browser settings.');
            } else if (event.error === 'no-speech') {
                console.log('No speech detected');
            }
        };

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (err) {
                    // Ignore errors when stopping
                }
            }
        };
    }, [transcript, onTranscript]);

    const toggleRecording = () => {
        if (disabled) return;

        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            setTranscript('');
            try {
                recognitionRef.current?.start();
                setIsRecording(true);
            } catch (err) {
                console.error('Failed to start recording:', err);
                alert('Failed to start voice recording. Please try again.');
            }
        }
    };

    if (!isSupported) {
        return (
            <button
                className="voice-button unsupported"
                title="Voice input not supported in this browser"
                disabled
            >
                <MicOff size={20} />
            </button>
        );
    }

    return (
        <button
            onClick={toggleRecording}
            className={`voice-button ${isRecording ? 'recording' : ''}`}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
            disabled={disabled}
        >
            <Mic size={20} className={isRecording ? 'pulse' : ''} />
            {isRecording && <span className="recording-indicator" />}
        </button>
    );
};

export default VoiceRecorder;












