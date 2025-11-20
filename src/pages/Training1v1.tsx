import React, { useState } from 'react';
import { WaitingRoom } from '@/components/training/WaitingRoom';
import { VideoCallInterface } from '@/components/training/VideoCallInterface';

export const Training1v1: React.FC = () => {
    const [activeCall, setActiveCall] = useState<{ roomId: string; partnerId: string } | null>(null);

    const handleJoinCall = (roomId: string, partnerId: string) => {
        setActiveCall({ roomId, partnerId });
    };

    const handleEndCall = () => {
        setActiveCall(null);
    };

    return (
        <div className="p-8 h-full">
            {activeCall ? (
                <VideoCallInterface
                    roomId={activeCall.roomId}
                    partnerId={activeCall.partnerId}
                    onEndCall={handleEndCall}
                />
            ) : (
                <div className="max-w-6xl mx-auto">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900">Luyện tập 1v1</h1>
                        <p className="text-slate-500 mt-2">
                            Kết nối trực tiếp với nhà tuyển dụng hoặc ứng viên khác để luyện tập phỏng vấn.
                        </p>
                    </header>

                    <WaitingRoom onJoinCall={handleJoinCall} />
                </div>
            )}
        </div>
    );
};
