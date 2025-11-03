// Manual cleanup utility for EaseHealth
// Simple functions to run cleanup manually

import { supabase } from './supabase';

/**
 * Manually trigger cleanup of unverified users
 * Call this function when you want to clean up unverified accounts
 */
export const runManualCleanup = async (): Promise<{ success: boolean; message: string; deletedCount?: number }> => {
    try {
        console.log('🧹 Starting manual cleanup of unverified users...');

        // Get count of users to be deleted before cleanup
        const { data: profilesToDelete, error: countError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email_verified', false)
            .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 minutes ago

        if (countError) {
            console.error('Error counting profiles to delete:', countError);
            return { success: false, message: `Error counting profiles: ${countError.message}` };
        }

        const deletedCount = profilesToDelete?.length || 0;

        if (deletedCount === 0) {
            return { success: true, message: 'No unverified users to clean up', deletedCount: 0 };
        }

        // Call the cleanup function
        const { error } = await supabase.rpc('cleanup_unverified_users');

        if (error) {
            console.error('Error cleaning up unverified users:', error);
            return { success: false, message: `Cleanup failed: ${error.message}` };
        }

        console.log(`✅ Cleaned up ${deletedCount} unverified users`);
        return { success: true, message: `Successfully cleaned up ${deletedCount} unverified users`, deletedCount };

    } catch (error: any) {
        console.error('Error in runManualCleanup:', error);
        return { success: false, message: `Unexpected error: ${error.message}` };
    }
};

/**
 * Check how many unverified users exist
 */
export const checkUnverifiedUsers = async (): Promise<{ total: number; unverified: number; expired: number }> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('email_verified, created_at');

        if (error) throw error;

        const total = data?.length || 0;
        const unverified = data?.filter(p => !p.email_verified).length || 0;
        const expired = data?.filter(p =>
            !p.email_verified &&
            new Date(p.created_at) < new Date(Date.now() - 5 * 60 * 1000)
        ).length || 0;

        return { total, unverified, expired };
    } catch (error: any) {
        console.error('Error checking unverified users:', error);
        return { total: 0, unverified: 0, expired: 0 };
    }
};
