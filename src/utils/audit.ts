import { supabase } from './supabase'

export const logAuditEvent = async (
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>,
  allowed: boolean = true
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || {},
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        allowed
      })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch {
    return 'unknown'
  }
}