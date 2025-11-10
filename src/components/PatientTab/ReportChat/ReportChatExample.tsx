/**
 * EXAMPLE INTEGRATION
 * 
 * This file shows how to integrate the ReportChatInterface component
 * into your existing PatientTab or Doctor Dashboard.
 * 
 * Copy the relevant parts to your actual component.
 */

import React from 'react';
import ReportChatInterface from './ReportChatInterface';

// Example 1: Integration in PatientTab component
export function ExamplePatientTabIntegration() {
    // Your existing state
    const patientId = 'patient-123';
    const doctorId = 'doctor-456';
    const reportIds = ['report-1', 'report-2', 'report-3']; // Array of uploaded report IDs
    const reportNames = ['Blood Test Report.pdf', 'X-Ray Results.pdf', 'MRI Scan.pdf'];

    return (
        <div className="patient-tab-container">
            {/* Your existing AI Summary section */}
            <div className="ai-summary-section">
                {/* ... existing AI summary code ... */}
            </div>

            {/* Add Chat Interface */}
            {reportIds.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Ask Questions About Reports</h2>
                    <ReportChatInterface
                        patientId={patientId}
                        reportIds={reportIds}
                        doctorId={doctorId}
                        reportNames={reportNames}
                    />
                </div>
            )}
        </div>
    );
}

// Example 2: Integration as a modal/dialog
export function ExampleModalIntegration() {
    const [isOpen, setIsOpen] = React.useState(false);

    const patientId = 'patient-123';
    const doctorId = 'doctor-456';
    const reportIds = ['report-1', 'report-2'];

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn-primary"
            >
                Chat with AI about Reports
            </button>

            {isOpen && (
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <ReportChatInterface
                            patientId={patientId}
                            reportIds={reportIds}
                            doctorId={doctorId}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

// Example 3: Integration with existing report selection
export function ExampleWithReportSelection() {
    const [selectedReportIds, setSelectedReportIds] = React.useState<string[]>([]);
    const allReports = [
        { id: 'report-1', name: 'Blood Test.pdf' },
        { id: 'report-2', name: 'X-Ray.pdf' },
        { id: 'report-3', name: 'MRI.pdf' },
    ];

    const patientId = 'patient-123';
    const doctorId = 'doctor-456';

    return (
        <div className="report-selection-container">
            {/* Report Selection UI */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Select Reports to Analyze</h3>
                <div className="space-y-2">
                    {allReports.map(report => (
                        <label key={report.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={selectedReportIds.includes(report.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedReportIds([...selectedReportIds, report.id]);
                                    } else {
                                        setSelectedReportIds(selectedReportIds.filter(id => id !== report.id));
                                    }
                                }}
                            />
                            <span>{report.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Chat Interface */}
            {selectedReportIds.length > 0 ? (
                <ReportChatInterface
                    patientId={patientId}
                    reportIds={selectedReportIds}
                    doctorId={doctorId}
                    reportNames={allReports
                        .filter(r => selectedReportIds.includes(r.id))
                        .map(r => r.name)}
                />
            ) : (
                <div className="text-center text-gray-500 py-8">
                    Select at least one report to start chatting
                </div>
            )}
        </div>
    );
}

// Example 4: N8N Webhook Configuration
export const N8N_WEBHOOK_CONFIG = {
    // Replace with your actual n8n webhook URL
    url: 'https://your-n8n-instance.com/webhook/medical-report-chat',

    // Example payload structure
    payloadStructure: {
        question: 'string',
        patientId: 'string',
        reportIds: ['string[]'],
        doctorId: 'string',
        chatHistory: [
            {
                id: 'string',
                role: 'user | assistant | system',
                content: 'string',
                timestamp: 'Date'
            }
        ]
    },

    // Expected response structure
    responseStructure: {
        answer: 'string',
        confidence: 'high | medium | low'
    }
};

/**
 * INTEGRATION STEPS:
 * 
 * 1. Import the component:
 *    import ReportChatInterface from './components/PatientTab/ReportChat/ReportChatInterface';
 * 
 * 2. Set up your n8n webhook:
 *    - Create a webhook node in n8n
 *    - Connect it to your AI processing workflow
 *    - Update the webhook URL in ReportChatInterface.tsx (line 84)
 * 
 * 3. Prepare your data:
 *    - Ensure you have patientId, doctorId, and reportIds
 *    - reportIds should be an array of report identifiers
 *    - Optionally provide reportNames for better UX
 * 
 * 4. Add the component to your page:
 *    <ReportChatInterface
 *      patientId={patientId}
 *      reportIds={reportIds}
 *      doctorId={doctorId}
 *      reportNames={reportNames}
 *    />
 * 
 * 5. Test voice input (requires HTTPS or localhost):
 *    - Click the microphone button
 *    - Allow microphone access when prompted
 *    - Speak your question
 *    - The transcript will appear in the input field
 * 
 * 6. Customize styling:
 *    - Modify report-chat.css for custom colors/spacing
 *    - All styles support dark mode automatically
 *    - Mobile responsive by default
 */


