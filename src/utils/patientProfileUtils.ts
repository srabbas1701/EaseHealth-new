import { supabase } from './supabase';

interface PatientStats {
    totalAppointments: number;
    completedAppointments: number;
    upcomingAppointments: number;
    profileCompletion: number;
}

/**
 * Calculate profile completion percentage
 */
const calculateProfileCompletion = (profile: any): number => {
    console.log('🔍 Calculating profile completion for:', profile);
    if (!profile) return 0;

    const requiredFields = [
        'full_name',
        'email',
        'phone_number',
        'date_of_birth',
        'gender',
        'address'
    ];

    const optionalFields = [
        'city',
        'state',
        'medical_history',
        'allergies',
        'current_medications',
        'blood_type',
        'insurance_provider',
        'insurance_number',
        'profile_image_url',
        'id_proof_urls',
        'lab_report_urls'
    ];

    // Required fields count double in the completion percentage
    const totalWeight = (requiredFields.length * 2) + optionalFields.length;
    let completedWeight = 0;

    // Check required fields (each counts as 2)
    requiredFields.forEach(field => {
        if (profile[field] && typeof profile[field] === 'string' && profile[field].trim()) {
            completedWeight += 2;
        }
    });

    // Check optional fields (each counts as 1)
    optionalFields.forEach(field => {
        if (profile[field]) {
            // For arrays, check if they're not empty
            if (Array.isArray(profile[field])) {
                if (profile[field].length > 0) completedWeight += 1;
            } else if (typeof profile[field] === 'string') {
                // For string fields, check if they're not empty strings
                if (profile[field].trim()) completedWeight += 1;
            } else {
                completedWeight += 1;
            }
        }
    });

    const completion = Math.round((completedWeight / totalWeight) * 100);
    console.log('✅ Profile completion calculated:', {
        completedWeight,
        totalWeight,
        completion,
        requiredFieldsCompleted: requiredFields.filter(field => profile[field]),
        optionalFieldsCompleted: optionalFields.filter(field => profile[field])
    });
    return completion;
};

/**
 * Get patient profile with calculated stats
 */
export const getPatientProfileWithStats = async (userId: string): Promise<{ profile: any, stats: PatientStats }> => {
    try {
        console.log('🔍 Getting patient profile for user:', userId);
        // Get patient profile
        const { data: profile, error: profileError } = await supabase
            .from('patients')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (profileError) {
            console.error('❌ Error getting patient profile:', profileError);
            throw profileError;
        }
        console.log('✅ Found patient profile:', profile);

        // Get appointments for stats
        const now = new Date().toISOString();
        const { data: appointments, error: appointmentsError } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', profile.id);

        if (appointmentsError) {
            console.error('❌ Error getting appointments:', appointmentsError);
            throw appointmentsError;
        }
        console.log('✅ Found appointments:', appointments);

        // Calculate stats
        const stats: PatientStats = {
            totalAppointments: appointments?.length || 0,
            completedAppointments: appointments?.filter(a => a.status === 'completed')?.length || 0,
            upcomingAppointments: appointments?.filter(a =>
                new Date(a.schedule_date + ' ' + a.start_time) > new Date() &&
                a.status !== 'cancelled' &&
                a.status !== 'completed'
            )?.length || 0,
            profileCompletion: calculateProfileCompletion(profile)
        };

        return { profile, stats };
    } catch (error) {
        console.error('Error getting patient profile:', error);
        throw error;
    }
};

/**
 * Get upcoming appointments for a patient
 */
export const getUpcomingAppointments = async (patientId: string) => {
    try {
        console.log('🔍 Getting upcoming appointments for patient:', patientId);
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];

        // Get appointments with doctor details
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
        *,
        doctor:doctor_id (
          full_name,
          specialty
        )
      `)
            .eq('patient_id', patientId)
            .gte('schedule_date', dateString)
            .order('schedule_date', { ascending: true })
            .order('start_time', { ascending: true })
            .limit(5);

        if (error) {
            console.error('❌ Error getting appointments:', error);
            throw error;
        }
        console.log('✅ Found appointments:', appointments);

        return appointments.map(appointment => ({
            id: appointment.id,
            doctor: appointment.doctor.full_name,
            specialty: appointment.doctor.specialty,
            date: new Date(appointment.schedule_date).toLocaleDateString(),
            time: appointment.start_time.slice(0, 5),
            status: appointment.status,
            queue_token: appointment.queue_token,
            notes: appointment.notes,
            duration_minutes: appointment.duration_minutes,
            payment_status: appointment.payment_status
        }));
    } catch (error) {
        console.error('Error getting upcoming appointments:', error);
        throw error;
    }
};

/**
 * Get patient's appointment history
 */
export const getAppointmentHistory = async (patientId: string, limit = 10) => {
    try {
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
        *,
        doctor:doctor_id (
          full_name,
          specialty
        )
      `)
            .eq('patient_id', patientId)
            .order('schedule_date', { ascending: false })
            .order('start_time', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return appointments;
    } catch (error) {
        console.error('Error getting appointment history:', error);
        throw error;
    }
};
