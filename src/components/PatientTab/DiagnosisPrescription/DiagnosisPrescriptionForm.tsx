import React, { memo, useState } from 'react';
import { FileText, Save, Printer, Bot, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { usePrescriptionForm } from '../../../hooks/patient/usePrescriptionForm';
import PrescriptionTable from './PrescriptionTable';
import PrescriptionActions from './PrescriptionActions';
import PrintPrescription from '../Print/PrintPrescription';
import AICollapsibleChat from '../AICollapsibleChat';
import '../../medical-summary.css';

interface DiagnosisPrescriptionFormProps {
  patientId: string;
  doctorId: string;
  patientName: string;
  onAfterSave?: (consultationId: string | null) => void;
  selectedReportIds?: string[];
  onGenerateAI?: (reportIds: string[]) => Promise<string | void> | string | void;
  isGeneratingAI?: boolean;
  aiError?: string | null;
}

const DiagnosisPrescriptionForm: React.FC<DiagnosisPrescriptionFormProps> = memo(({
  patientId,
  doctorId,
  patientName,
  onAfterSave,
  selectedReportIds = [],
  onGenerateAI,
  isGeneratingAI = false,
  aiError = null,
}) => {
  const {
    formData,
    updateField,
    addMedicationRow,
    removeMedicationRow,
    updateMedication,
    resetForm,
    savePrescription,
    isSaving,
  } = usePrescriptionForm();

  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [savedConsultationId, setSavedConsultationId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [chatEnabled, setChatEnabled] = useState<boolean>(false);

  const handleSave = async () => {
    setSaveMessage(null);

    const result = await savePrescription(patientId, doctorId);

    if (result.success) {
      setSavedConsultationId(result.consultationId || null);
      try { onAfterSave && onAfterSave(result.consultationId || null); } catch { }
      setSaveMessage({
        type: 'success',
        text: 'Prescription saved successfully!',
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } else {
      setSaveMessage({
        type: 'error',
        text: result.error || 'Failed to save prescription',
      });
    }
  };

  const handlePrint = () => {
    if (!formData.chief_complaint || !formData.diagnosis) {
      alert('Please fill in Chief Complaint and Diagnosis before printing');
      return;
    }
    setShowPrintModal(true);
  };

  const handlePrintAISummary = () => {
    if (!aiSummary) {
      alert('No AI summary to print. Please generate a summary first.');
      return;
    }

    // Create a print-friendly window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the AI summary.');
      return;
    }

    // Get current date for the report
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create HTML content with proper styling
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI Summary Report - ${patientName}</title>
          <style>
            @media print {
              @page { margin: 1.5cm; }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              border-bottom: 3px solid #0A2647;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header h1 {
              color: #0A2647;
              margin: 0 0 5px 0;
              font-size: 28px;
            }
            .header .subtitle {
              color: #666;
              font-size: 14px;
              margin: 0;
            }
            .meta-info {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 25px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .meta-item {
              font-size: 14px;
            }
            .meta-label {
              font-weight: 600;
              color: #0A2647;
            }
            .content {
              background: white;
              padding: 20px;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
            }
            .ai-summary-html h1, .ai-summary-html h2, .ai-summary-html h3 {
              color: #0A2647;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            .ai-summary-html h1 { font-size: 24px; }
            .ai-summary-html h2 { font-size: 20px; }
            .ai-summary-html h3 { font-size: 18px; }
            .ai-summary-html table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            .ai-summary-html th,
            .ai-summary-html td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            .ai-summary-html th {
              background-color: #0A2647;
              color: white;
              font-weight: 600;
            }
            .ai-summary-html tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .ai-summary-html p {
              margin: 10px 0;
            }
            .ai-summary-html strong {
              color: #0A2647;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AI Summary Report</h1>
            <p class="subtitle">Clinical Analysis & Recommendations</p>
          </div>
          
          <div class="meta-info">
            <div class="meta-item">
              <span class="meta-label">Patient:</span> ${patientName}
            </div>
            <div class="meta-item">
              <span class="meta-label">Generated:</span> ${currentDate}
            </div>
          </div>

          <div class="content ai-summary-html">
            ${aiSummary}
          </div>

          <div class="footer">
            <p>This is an AI-generated summary. Please verify all information before making clinical decisions.</p>
            <p>Generated by EaseHealth - Healthcare Management System</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleDownloadAISummary = () => {
    if (!aiSummary) {
      alert('No AI summary to download. Please generate a summary first.');
      return;
    }

    // Get current date for filename
    const currentDate = new Date().toISOString().split('T')[0];
    const fileName = `AI_Summary_${patientName.replace(/\s+/g, '_')}_${currentDate}.html`;

    // Create HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>AI Summary Report - ${patientName}</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 900px;
        margin: 0 auto;
        padding: 30px;
        background-color: #f5f5f5;
      }
      .container {
        background: white;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .header {
        border-bottom: 3px solid #0A2647;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .header h1 {
        color: #0A2647;
        margin: 0 0 10px 0;
        font-size: 32px;
      }
      .header .subtitle {
        color: #666;
        font-size: 16px;
        margin: 0;
      }
      .meta-info {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      .meta-item {
        font-size: 15px;
      }
      .meta-label {
        font-weight: 600;
        color: #0A2647;
        display: inline-block;
        min-width: 100px;
      }
      .content {
        padding: 20px 0;
      }
      .ai-summary-html h1, .ai-summary-html h2, .ai-summary-html h3 {
        color: #0A2647;
        margin-top: 25px;
        margin-bottom: 15px;
      }
      .ai-summary-html h1 { font-size: 26px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
      .ai-summary-html h2 { font-size: 22px; }
      .ai-summary-html h3 { font-size: 19px; }
      .ai-summary-html table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .ai-summary-html th,
      .ai-summary-html td {
        border: 1px solid #ddd;
        padding: 12px;
        text-align: left;
      }
      .ai-summary-html th {
        background-color: #0A2647;
        color: white;
        font-weight: 600;
      }
      .ai-summary-html tr:nth-child(even) {
        background-color: #f8f9fa;
      }
      .ai-summary-html p {
        margin: 12px 0;
      }
      .ai-summary-html strong {
        color: #0A2647;
        font-weight: 600;
      }
      .ai-summary-html ul, .ai-summary-html ol {
        margin: 10px 0;
        padding-left: 25px;
      }
      .ai-summary-html li {
        margin: 5px 0;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e0e0e0;
        text-align: center;
        font-size: 13px;
        color: #666;
      }
      .disclaimer {
        background-color: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 6px;
        padding: 15px;
        margin-top: 20px;
        font-size: 14px;
      }
      @media print {
        body { background: white; }
        .container { box-shadow: none; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>AI Summary Report</h1>
        <p class="subtitle">Clinical Analysis & Recommendations</p>
      </div>
      
      <div class="meta-info">
        <div class="meta-item">
          <span class="meta-label">Patient:</span> ${patientName}
        </div>
        <div class="meta-item">
          <span class="meta-label">Generated:</span> ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
        </div>
      </div>

      <div class="content ai-summary-html">
        ${aiSummary}
      </div>

      <div class="disclaimer">
        <strong>⚠️ Disclaimer:</strong> This is an AI-generated summary based on the provided medical reports. 
        Please verify all information and consult with healthcare professionals before making any clinical decisions.
      </div>

      <div class="footer">
        <p><strong>Generated by EaseHealth</strong> - Healthcare Management System</p>
        <p>Report Date: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}</p>
      </div>
    </div>
  </body>
</html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success message
    setSaveMessage({ type: 'success', text: `AI Summary downloaded as ${fileName}` });
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleGenerateAI = async () => {
    if (!selectedReportIds || selectedReportIds.length === 0) {
      setSaveMessage({ type: 'error', text: 'Select at least one report to generate AI analysis.' });
      setTimeout(() => setSaveMessage(null), 4000);
      return;
    }

    // Clear previous AI summary before generating new one
    setAiSummary('');
    
    // Reset chat state
    setExtractedText('');
    setChatEnabled(false);

    // Clear the old cache for this report selection to force fresh generation
    try {
      const reportKey = selectedReportIds.sort().join('_');
      const cacheKey = `ai_summary_${patientId}_${reportKey}`;
      sessionStorage.removeItem(cacheKey);
    } catch { }

    try {
      const result = await onGenerateAI?.(selectedReportIds);
      
      // Handle both string and object response
      let summaryText = '';
      let extractedTextFromResponse = '';
      
      if (typeof result === 'string') {
        // Legacy: only summary returned
        summaryText = result;
      } else if (result && typeof result === 'object' && 'summary' in result) {
        // New format: { summary, extractedText }
        summaryText = (result as any).summary || '';
        extractedTextFromResponse = (result as any).extractedText || '';
      }
      
      if (summaryText.trim().length > 0) {
        // sanitize AI output: remove surrounding ``` fences (```html or ```), trim
        const stripFences = (s: string) => {
          let out = s.trim();
          out = out.replace(/^\s*```(?:html|text)?\s*/i, '');
          out = out.replace(/\s*```\s*$/i, '');
          return out.trim();
        };
        const cleaned = stripFences(summaryText);

        // Helper: sanitize HTML using DOMParser (browser) - remove scripts and unsafe attributes
        const sanitizeHtml = (htmlString: string) => {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');
            const allowedTags = new Set(['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'UL', 'OL', 'LI', 'STRONG', 'B', 'EM', 'I', 'BR', 'SPAN', 'TD', 'SECTION', 'ASIDE']);
            const walk = (node: Node) => {
              const children = Array.from(node.childNodes);
              for (const child of children) {
                if (child.nodeType === Node.ELEMENT_NODE) {
                  const el = child as HTMLElement;
                  // remove script/style
                  if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') {
                    el.remove();
                    continue;
                  }
                  if (!allowedTags.has(el.tagName)) {
                    // replace disallowed element with its text content
                    const text = document.createTextNode(el.textContent || '');
                    el.parentNode?.replaceChild(text, el);
                    continue;
                  }
                  // strip unsafe attributes
                  const attrs = Array.from(el.attributes).map(a => a.name);
                  for (const attr of attrs) {
                    if (attr.startsWith('on')) el.removeAttribute(attr);
                    if (['src', 'href', 'style'].includes(attr)) el.removeAttribute(attr);
                  }
                  walk(el);
                }
              }
            };
            walk(doc.body);
            return doc.body.innerHTML;
          } catch (e) {
            return '';
          }
        };

        // Basic Markdown -> HTML converter for tables and simple formatting
        const markdownToHtml = (md: string) => {
          // Detect table
          const lines = md.split(/\r?\n/);
          let i = 0;
          // find table start: header line with '|' and separator line with ---
          while (i < lines.length && !/\|/.test(lines[i])) i++;
          if (i < lines.length && /\|/.test(lines[i]) && i + 1 < lines.length && /^(\s*\|?[\s:-]+\|[\s:-]+\|?)/.test(lines[i + 1])) {
            // parse table
            const headerLine = lines[i];
            const sepLine = lines[i + 1];
            const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
            const rows: string[][] = [];
            let j = i + 2;
            while (j < lines.length && /\|/.test(lines[j])) {
              const cols = lines[j].split('|').map(c => c.trim()).filter((_, idx, arr) => idx < headers.length);
              rows.push(cols);
              j++;
            }
            const th = headers.map(h => `<th>${h}</th>`).join('');
            const trs = rows.map(r => `<tr>${r.map((c, idx) => `<td>${c || ''}</td>`).join('')}</tr>`).join('');
            // replace the block in md with table html
            const before = lines.slice(0, i).join('\n');
            const after = lines.slice(j).join('\n');
            const tableHtml = `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
            const rest = [before, tableHtml, after].filter(Boolean).join('\n\n');
            // simple replacements for headings and bold/italic
            return rest.replace(/^### (.+)$/gm, '<h3>$1</h3>')
              .replace(/^## (.+)$/gm, '<h2>$1</h2>')
              .replace(/^# (.+)$/gm, '<h1>$1</h1>')
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
              .replace(/\n{2,}/g, '</p><p>');
          }
          // fallback: simple paragraphs and inline formatting
          const html = md.split(/\n{2,}/).map(p => {
            const inline = p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
            return `<p>${inline}</p>`;
          }).join('');
          return html;
        };

        let finalHtml = '';
        if (cleaned.trim().startsWith('<')) {
          finalHtml = sanitizeHtml(cleaned);
        } else {
          // convert markdown (if any) to html then sanitize
          const converted = markdownToHtml(cleaned);
          finalHtml = sanitizeHtml(converted);
        }

        // if finalHtml is empty, fallback to cleaned plain text escaped
        const safeOutput = finalHtml || cleaned.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        setAiSummary(safeOutput);

        // Store extracted text and enable chat if available
        if (extractedTextFromResponse && extractedTextFromResponse.trim().length > 0) {
          setExtractedText(extractedTextFromResponse);
          setChatEnabled(true);
          console.log('✅ Chat enabled. Extracted text length:', extractedTextFromResponse.length);
        }

        // Cache with report selection in the key to avoid stale data when selection changes
        try {
          if (patientId) {
            const reportKey = selectedReportIds.sort().join('_');
            const cacheKey = `ai_summary_${patientId}_${reportKey}`;
            sessionStorage.setItem(cacheKey, safeOutput);
            
            // Cache extracted text as well
            if (extractedTextFromResponse) {
              sessionStorage.setItem(`${cacheKey}_extracted`, extractedTextFromResponse);
            }
          }
        } catch { }
      } else {
        // Fallback placeholder until the backend is wired
        setAiSummary('AI summary generated. (Integration placeholder)');
      }
      setSaveMessage({ type: 'success', text: 'AI summary generated.' });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (e) {
      setSaveMessage({ type: 'error', text: 'Failed to start AI analysis.' });
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  // Restore cached AI summary when component mounts OR when report selection changes
  React.useEffect(() => {
    try {
      if (patientId && selectedReportIds.length > 0) {
        const reportKey = selectedReportIds.sort().join('_');
        const cacheKey = `ai_summary_${patientId}_${reportKey}`;
        const cached = sessionStorage.getItem(cacheKey);
        const cachedExtracted = sessionStorage.getItem(`${cacheKey}_extracted`);

        if (cached) {
          // sanitize cached as well (in case older value had fences)
          const sanitize = (s: string) => s.replace(/^\s*```(?:html|text)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
          setAiSummary(sanitize(cached));
          
          // Restore extracted text and enable chat if available
          if (cachedExtracted) {
            setExtractedText(cachedExtracted);
            setChatEnabled(true);
          }
        } else {
          // Different selection or no cache - clear previous summary
          setAiSummary('');
          setExtractedText('');
          setChatEnabled(false);
        }
      } else {
        // No reports selected - clear summary
        setAiSummary('');
        setExtractedText('');
        setChatEnabled(false);
      }
    } catch (e) {
      // ignore
    }
  }, [patientId, selectedReportIds]);

  return (
    <>
      {/* Standalone AI Summary card above the Diagnosis & Prescription card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">AI Summary</h3>
              <p className="text-sm text-theme-muted dark:text-gray-400 mt-1">Concise clinical summary with highlighted abnormalities and recommendations</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isSaving || isGeneratingAI || (selectedReportIds?.length ?? 0) === 0}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              title={selectedReportIds.length === 0 ? 'Select report(s) to summarize' : isGeneratingAI ? 'Generating summary...' : 'Generate AI summary from selected reports'}
            >
              {isGeneratingAI ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Bot className="w-5 h-5" />
                  <span>Generate AI Summary</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrintAISummary}
              disabled={!aiSummary || isGeneratingAI}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 dark:bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-700 dark:hover:bg-teal-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              title={!aiSummary ? 'Generate a summary first to print' : 'Print AI Summary'}
            >
              <Printer className="w-5 h-5" />
              <span>Print</span>
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownloadAISummary}
              disabled={!aiSummary || isGeneratingAI}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              title={!aiSummary ? 'Generate a summary first to download' : 'Download AI Summary as HTML'}
            >
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>
          </div>
        </div>
        <div className="relative bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 max-h-96 overflow-auto ai-summary-box" style={{ minHeight: '140px' }}>
          {isGeneratingAI && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-black/40 rounded-lg">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 flex items-center justify-center animate-spin-slow">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">Generating AI summary...</div>
              </div>
            </div>
          )}
          {aiSummary ? (
            aiSummary.trim().startsWith('<') ? (
              <div className="ai-summary-html text-sm text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: aiSummary }} />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 ai-summary-content">{aiSummary}</pre>
            )
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No AI summary yet. Select report(s) and click "Generate AI Summary".</p>
          )}
          {aiError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{aiError}</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Chat Component - Only enabled after AI Summary is generated */}
      <AICollapsibleChat
        patientId={patientId}
        reportIds={selectedReportIds}
        doctorId={doctorId}
        isEnabled={!!aiSummary && !isGeneratingAI && chatEnabled}
        extractedText={extractedText}
      />

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-teal-500 dark:border-teal-600">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="text-2xl font-bold text-[#0A2647] dark:text-gray-100">
            Diagnosis & Prescription
          </h3>
        </div>

        {/* Save Success/Error Messages */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${saveMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
              }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={
                saveMessage.type === 'success'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }
            >
              {saveMessage.text}
            </p>
          </div>
        )}

        {/* Row 1: Chief Complaint & Diagnosis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Chief Complaint <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.chief_complaint}
              onChange={(e) => updateField('chief_complaint', e.target.value)}
              placeholder="e.g., Fever and cough for 3 days"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Diagnosis <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => updateField('diagnosis', e.target.value)}
              placeholder="e.g., Upper Respiratory Tract Infection"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Row 2: Clinical Notes */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Clinical Notes
          </label>
          <textarea
            value={formData.clinical_notes}
            onChange={(e) => updateField('clinical_notes', e.target.value)}
            placeholder="Detailed clinical observations, examination findings, and notes..."
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
            style={{ minHeight: '100px' }}
          />
        </div>

        {/* Prescription Table */}
        <PrescriptionTable
          medications={formData.medications}
          onAdd={addMedicationRow}
          onRemove={removeMedicationRow}
          onUpdate={updateMedication}
        />

        {/* Follow-up Date & Additional Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Follow-up Date
            </label>
            <input
              type="date"
              value={formData.follow_up_date}
              onChange={(e) => updateField('follow_up_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Additional Instructions
            </label>
            <input
              type="text"
              value={formData.additional_instructions}
              onChange={(e) => updateField('additional_instructions', e.target.value)}
              placeholder="Diet, exercise, precautions"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
          {/* Generate AI Summary button moved to AI Summary header */}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Prescription</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-2 px-6 py-3 bg-teal-600 dark:bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-700 dark:hover:bg-teal-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          >
            <Printer className="w-5 h-5" />
            <span>Print Prescription</span>
          </button>
        </div>
      </div>

      {showPrintModal && (
        <PrintPrescription
          formData={formData}
          patientName={patientName}
          patientId={patientId}
          doctorId={doctorId}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </>
  );
});

DiagnosisPrescriptionForm.displayName = 'DiagnosisPrescriptionForm';

export default DiagnosisPrescriptionForm;
