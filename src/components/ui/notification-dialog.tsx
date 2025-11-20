import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NotificationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    type?: 'success' | 'error' | 'info';
}

export const NotificationDialog: React.FC<NotificationDialogProps> = ({
    isOpen,
    onClose,
    title,
    description,
    type = 'info'
}) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className={
                        type === 'error' ? 'text-red-600' :
                            type === 'success' ? 'text-green-600' : 'text-slate-900'
                    }>
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-600 text-base">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={onClose} className="rounded-full px-6">
                        Đóng
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
