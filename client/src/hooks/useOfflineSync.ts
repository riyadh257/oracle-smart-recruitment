import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  getPendingFeedback,
  markFeedbackAsSynced,
  getPendingFeedbackCount,
  cleanupOldFeedback,
} from '@/lib/offlineStorage';
import { toast } from 'sonner';

/**
 * Hook to manage offline feedback synchronization
 */
export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const createFeedback = trpc.feedback.create.useMutation();

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending count
  const updatePendingCount = async () => {
    try {
      const count = await getPendingFeedbackCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  };

  // Sync pending feedback when online
  const syncPendingFeedback = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const pending = await getPendingFeedback();
      
      if (pending.length === 0) {
        setIsSyncing(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const feedback of pending) {
        try {
          await createFeedback.mutateAsync({
            interviewId: feedback.interviewId,
            candidateId: feedback.candidateId,
            interviewerId: feedback.interviewerId,
            overallRating: feedback.overallRating,
            technicalSkillsRating: feedback.technicalSkillsRating,
            communicationRating: feedback.communicationRating,
            problemSolvingRating: feedback.problemSolvingRating,
            cultureFitRating: feedback.cultureFitRating,
            recommendation: feedback.recommendation as any,
            strengths: feedback.strengths,
            weaknesses: feedback.weaknesses,
            detailedNotes: feedback.detailedNotes,
          });

          await markFeedbackAsSynced(feedback.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync feedback ${feedback.id}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Synced ${successCount} feedback submission(s)`);
        await updatePendingCount();
      }

      if (failCount > 0) {
        toast.error(`Failed to sync ${failCount} feedback submission(s)`);
      }

      // Cleanup old synced feedback
      await cleanupOldFeedback(7);
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync offline feedback');
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      syncPendingFeedback();
    }
  }, [isOnline]);

  // Update pending count on mount
  useEffect(() => {
    updatePendingCount();
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncPendingFeedback,
    updatePendingCount,
  };
}
