'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { backupApi } from '@/lib/api/backup';
import { toast } from 'react-hot-toast';
import { Database, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TriggerBackupButtonProps {
  onSuccess: () => void;
}

export function TriggerBackupButton({ onSuccess }: TriggerBackupButtonProps) {
  const [isTriggering, setIsTriggering] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);

  const handleTrigger = async () => {
    try {
      setIsTriggering(true);
      const res = await backupApi.triggerBackup();
      if (res.success) {
        toast.success(res.data?.message || 'Backup started successfully');
        onSuccess();
        
        // Cooldown for 60 seconds
        setIsCooldown(true);
        setTimeout(() => setIsCooldown(false), 60000);
      } else {
        toast.error(res.error?.message || 'Failed to start backup');
      }
    } catch (err) {
      toast.error('An unexpected error occurred while starting backup');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          className="flex items-center gap-2" 
          disabled={isTriggering || isCooldown}
        >
          {isTriggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {isTriggering ? 'Starting...' : isCooldown ? 'Cooling down...' : 'Trigger Backup Now'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Trigger Manual Backup?</AlertDialogTitle>
          <AlertDialogDescription>
            This will start a database backup immediately. This operation might take a few minutes depending on the database size and may slightly impact database performance during execution. Continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleTrigger} className="bg-blue-600 hover:bg-blue-700">
            Start Backup
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
