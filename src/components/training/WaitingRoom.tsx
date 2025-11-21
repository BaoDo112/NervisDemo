import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Video, Users, Loader2, Phone, PhoneOff, PhoneIncoming } from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { NotificationDialog } from '@/components/ui/notification-dialog';

interface WaitingRoomProps {
    onJoinCall: (roomId: string, partnerId: string) => void;
}

interface OnlineUser {
    user_id: string;
    full_name: string;
    role: 'recruiter' | 'job_seeker';
    online_at: string;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ onJoinCall }) => {
    const { user, profile } = useAuth();
    const [isOnline, setIsOnline] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);
    const [incomingCall, setIncomingCall] = useState<{ callerId: string; callerName: string; roomId: string } | null>(null);
    const [callingUser, setCallingUser] = useState<string | null>(null);

    // Notification State
    const [notification, setNotification] = useState<{ isOpen: boolean; title: string; description: string; type: 'success' | 'error' | 'info' }>({
        isOpen: false,
        title: '',
        description: '',
        type: 'info'
    });

    useEffect(() => {
        if (!user || !profile) return;

        const newChannel = supabase.channel('training_lobby', {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        newChannel
            .on('presence', { event: 'sync' }, () => {
                const state = newChannel.presenceState<{ user_id: string; full_name: string; role: string; online_at: string }>();
                const users = Object.values(state).flat().map(u => ({
                    user_id: u.user_id,
                    full_name: u.full_name,
                    role: u.role as 'recruiter' | 'job_seeker',
                    online_at: u.online_at,
                }));
                setOnlineUsers(users.filter(u => u.user_id !== user.id));
            })
            .on('broadcast', { event: 'call_request' }, ({ payload }) => {
                if (payload.receiverId === user.id) {
                    setIncomingCall({
                        callerId: payload.callerId,
                        callerName: payload.callerName,
                        roomId: payload.roomId,
                    });
                }
            })
            .on('broadcast', { event: 'call_accepted' }, ({ payload }) => {
                if (payload.receiverId === user.id) {
                    onJoinCall(payload.roomId, payload.accepterId);
                }
            })
            .on('broadcast', { event: 'call_rejected' }, ({ payload }) => {
                if (payload.receiverId === user.id) {
                    setCallingUser(null);
                    setNotification({
                        isOpen: true,
                        title: 'Cuộc gọi bị từ chối',
                        description: 'Đối phương hiện không thể nghe máy.',
                        type: 'info'
                    });
                }
            });

        newChannel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                setChannel(newChannel);
            }
        });

        return () => {
            supabase.removeChannel(newChannel);
        };
    }, [user, profile, onJoinCall]);

    const toggleOnline = async () => {
        if (!channel || !user || !profile) return;

        if (isOnline) {
            await channel.untrack();
            setIsOnline(false);
        } else {
            await channel.track({
                user_id: user.id,
                full_name: profile.full_name,
                role: profile.role,
                online_at: new Date().toISOString(),
            });
            setIsOnline(true);
        }
    };

    const startCall = async (targetUserId: string) => {
        if (!channel || !user || !profile) return;

        const roomId = `room_${user.id}_${targetUserId}_${Date.now()}`;
        setCallingUser(targetUserId);

        await channel.send({
            type: 'broadcast',
            event: 'call_request',
            payload: {
                callerId: user.id,
                callerName: profile.full_name,
                receiverId: targetUserId,
                roomId: roomId,
            },
        });
    };

    const acceptCall = async () => {
        if (!channel || !incomingCall || !user) return;

        await channel.send({
            type: 'broadcast',
            event: 'call_accepted',
            payload: {
                callerId: incomingCall.callerId,
                receiverId: incomingCall.callerId,
                accepterId: user.id,
                roomId: incomingCall.roomId,
            },
        });

        onJoinCall(incomingCall.roomId, incomingCall.callerId);
    };

    const rejectCall = async () => {
        if (!channel || !incomingCall || !user) return;

        await channel.send({
            type: 'broadcast',
            event: 'call_rejected',
            payload: {
                receiverId: incomingCall.callerId,
            },
        });
        setIncomingCall(null);
    };

    const availableRecruiters = onlineUsers.filter(u => u.role === 'recruiter');
    const availableCandidates = onlineUsers.filter(u => u.role === 'job_seeker');

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <NotificationDialog
                isOpen={notification.isOpen}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
                title={notification.title}
                description={notification.description}
                type={notification.type}
            />

            {/* Incoming Call Modal */}
            {incomingCall && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 flex flex-col items-center">
                        <div className="w-24 h-24 bg-brand-cyan/10 rounded-full flex items-center justify-center mb-6 relative">
                            <div className="absolute inset-0 rounded-full bg-brand-cyan/20 animate-ping" />
                            <PhoneIncoming className="w-10 h-10 text-brand-cyan relative z-10" />
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{incomingCall.callerName}</h3>
                        <p className="text-slate-500 mb-8">đang gọi video cho bạn...</p>

                        <div className="flex items-center gap-6 w-full justify-center">
                            <button onClick={rejectCall} className="flex flex-col items-center gap-2 group">
                                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center transition-all group-hover:bg-red-200">
                                    <PhoneOff className="w-8 h-8 text-red-600" />
                                </div>
                                <span className="text-sm font-medium text-slate-600">Từ chối</span>
                            </button>

                            <button onClick={acceptCall} className="flex flex-col items-center gap-2 group">
                                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center transition-all group-hover:bg-green-200">
                                    <Phone className="w-8 h-8 text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-slate-600">Trả lời</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Card */}
            <Card className="col-span-full bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-slate-800">Sảnh chờ 1v1</CardTitle>
                        <CardDescription>Kết nối trực tiếp với {profile?.role === 'job_seeker' ? 'Nhà tuyển dụng' : 'Ứng viên'}</CardDescription>
                    </div>
                    <Button
                        onClick={toggleOnline}
                        variant={isOnline ? "destructive" : "default"}
                        className={isOnline ? "bg-red-500 hover:bg-red-600 rounded-full px-6" : "bg-brand-cyan hover:bg-brand-cyan/90 rounded-full px-6"}
                    >
                        {isOnline ? 'Rời sảnh chờ' : 'Tham gia sảnh chờ'}
                    </Button>
                </CardHeader>
            </Card>

            {/* Users List */}
            <div className="col-span-full grid gap-6 md:grid-cols-3">
                <Card className="col-span-2 h-[500px] flex flex-col border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="w-5 h-5 text-brand-cyan" />
                            {profile?.role === 'job_seeker' ? 'Nhà tuyển dụng đang online' : 'Ứng viên đang online'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {!isOnline ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                                </div>
                                <p>Vui lòng tham gia sảnh chờ để thấy danh sách</p>
                            </div>
                        ) : (profile?.role === 'job_seeker' ? availableRecruiters : availableCandidates).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <p>Chưa có ai online</p>
                            </div>
                        ) : (
                            (profile?.role === 'job_seeker' ? availableRecruiters : availableCandidates).map((u) => (
                                <div key={u.user_id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-cyan/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user_id}`} />
                                            <AvatarFallback>{u.full_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-slate-900">{u.full_name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-xs font-medium text-green-600">Đang rảnh</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => startCall(u.user_id)}
                                        disabled={callingUser === u.user_id}
                                        size="sm"
                                        className="rounded-full bg-brand-cyan hover:bg-brand-cyan/90 shadow-lg shadow-cyan-100"
                                    >
                                        {callingUser === u.user_id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Đang gọi...
                                            </>
                                        ) : (
                                            <>
                                                <Video className="w-4 h-4 mr-2" />
                                                Gọi video
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-gradient-to-br from-brand-cyan/5 to-blue-50 border-brand-cyan/20 h-fit">
                    <CardHeader>
                        <CardTitle className="text-brand-cyan text-lg">Lưu ý nhanh</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-slate-600 text-sm">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 text-brand-cyan font-bold shadow-sm">1</div>
                            <p className="pt-1">Chọn người dùng từ danh sách để bắt đầu cuộc gọi.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 text-brand-cyan font-bold shadow-sm">2</div>
                            <p className="pt-1">Cuộc gọi sẽ được tự động ghi hình để bạn xem lại sau.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 text-brand-cyan font-bold shadow-sm">3</div>
                            <p className="pt-1">Giữ thái độ chuyên nghiệp và lịch sự.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
