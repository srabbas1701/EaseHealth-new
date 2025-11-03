// Cleanup utility for EaseHealth
// This handles cleanup of unverified users and other maintenance tasks

import { supabase } from './supabase';

/**
 * Clean up unverified users who haven't verified their email within 5 minutes
 * This function should be called periodically to maintain database hygiene
 */
export const cleanupUnverifiedUsers = async (): Promise<{ success: boolean; deletedCount?: number; error?: string }> => {
    try {
        console.log('🧹 Starting cleanup of unverified users...');

        // Get count of users to be deleted before cleanup
        const { data: profilesToDelete, error: countError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email_verified', false)
            .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 minutes ago

        if (countError) {
            console.error('Error counting profiles to delete:', countError);
            return { success: false, error: countError.message };
        }

        const deletedCount = profilesToDelete?.length || 0;

        // Call the cleanup function
        const { error } = await supabase.rpc('cleanup_unverified_users');

        if (error) {
            console.error('Error cleaning up unverified users:', error);
            return { success: false, error: error.message };
        }

        console.log(`✅ Cleaned up ${deletedCount} unverified users`);
        return { success: true, deletedCount };

    } catch (error: any) {
        console.error('Error in cleanupUnverifiedUsers:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Schedule cleanup to run every minute
 * This ensures unverified users are cleaned up promptly
 */
export const scheduleCleanup = (): NodeJS.Timeout => {
    console.log('⏰ Scheduling cleanup to run every minute...');

    // Run cleanup every minute (60,000 ms)
    return setInterval(async () => {
        const result = await cleanupUnverifiedUsers();
        if (result.success) {
            console.log(`🧹 Cleanup completed: ${result.deletedCount || 0} users deleted`);
        } else {
            console.error('🧹 Cleanup failed:', result.error);
        }
    }, 60 * 1000); // 60 seconds
};

/**
 * Stop the scheduled cleanup
 */
export const stopCleanup = (intervalId: NodeJS.Timeout): void => {
    clearInterval(intervalId);
    console.log('⏹️ Cleanup scheduler stopped');
};

/**
 * Manual cleanup trigger (for testing or immediate cleanup)
 */
export const triggerCleanup = async (): Promise<void> => {
    console.log('🔧 Manual cleanup triggered...');
    const result = await cleanupUnverifiedUsers();

    if (result.success) {
        console.log(`✅ Manual cleanup completed: ${result.deletedCount || 0} users deleted`);
    } else {
        console.error('❌ Manual cleanup failed:', result.error);
    }
};
