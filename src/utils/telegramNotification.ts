/**
 * Fallback Telegram notification function
 * Primary notification is handled by Supabase Database Webhook → n8n
 * This is a backup in case the webhook fails
 */
export const sendTelegramNotificationFallback = async (
  appointmentData: {
    appointmentId: string;
    queueToken: string;
    patientId: string;
    doctorName: string;
    date: string;
    time: string;
  }
) => {
  // Only call if n8n webhook URL is configured
  const n8nWebhookUrl = import.meta.env.VITE_N8N_APPOINTMENT_WEBHOOK;

  if (!n8nWebhookUrl) {
    console.log('📱 Telegram notification: n8n webhook not configured, skipping fallback');
    return;
  }

  try {
    // Use proxy path in development to avoid CORS issues
    // In production, use direct URL
    const isDevelopment = import.meta.env.DEV;
    const webhookUrl = isDevelopment
      ? '/api/n8n/appointment-notification'  // Use Vite proxy (avoids CORS)
      : n8nWebhookUrl;  // Use direct URL in production

    // Format payload to match Supabase webhook format exactly
    const payload = {
      type: 'INSERT',
      table: 'appointments',
      record: {
        id: appointmentData.appointmentId,
        queue_token: appointmentData.queueToken,
        patient_id: appointmentData.patientId,
        doctor_name: appointmentData.doctorName,
        schedule_date: appointmentData.date,
        start_time: appointmentData.time
      }
    };

    console.log('📤 Sending fallback notification payload:', {
      url: webhookUrl,
      appointmentId: appointmentData.appointmentId,
      patientId: appointmentData.patientId
    });

    // Simple call to n8n webhook (same endpoint as database webhook)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.text();
        errorMessage = `${errorMessage}: ${errorData.substring(0, 200)}`;
      } catch (e) {
        // Ignore if we can't read error body
      }
      throw new Error(errorMessage);
    }

    console.log('✅ Fallback Telegram notification sent successfully');
  } catch (error) {
    // Log error details for debugging but don't break appointment booking
    console.warn('⚠️ Fallback Telegram notification failed (non-critical):', {
      error: error instanceof Error ? error.message : String(error),
      appointmentId: appointmentData.appointmentId,
      patientId: appointmentData.patientId
    });
  }
};

