import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Video, VideoOff, Disc, Volume2 } from 'lucide-react';
import { NotificationDialog } from '@/components/ui/notification-dialog';

interface VideoCallInterfaceProps {
    roomId: string;
    partnerId: string;
    onEndCall: () => void;
}

const STUN_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({ roomId, partnerId, onEndCall }) => {
    const { user } = useAuth();
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [volume, setVolume] = useState(100);

    // Notification State
    const [notification, setNotification] = useState<{ isOpen: boolean; title: string; description: string; type: 'success' | 'error' | 'info' }>({
        isOpen: false,
        title: '',
        description: '',
        type: 'info'
    });

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const recordedChunks = useRef<Blob[]>([]);

    useEffect(() => {
        const initCall = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                const pc = new RTCPeerConnection(STUN_SERVERS);
                peerConnection.current = pc;

                stream.getTracks().forEach((track) => {
                    pc.addTrack(track, stream);
                });

                pc.ontrack = (event) => {
                    setRemoteStream(event.streams[0]);
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                };

                pc.onicecandidate = async (event) => {
                    if (event.candidate) {
                        await supabase.channel(roomId).send({
                            type: 'broadcast',
                            event: 'ice-candidate',
                            payload: event.candidate,
                        });
                    }
                };

                const channel = supabase.channel(roomId);

                channel
                    .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
                        if (pc.remoteDescription) {
                            await pc.addIceCandidate(new RTCIceCandidate(payload));
                        }
                    })
                    .on('broadcast', { event: 'offer' }, async ({ payload }) => {
                        if (!pc.currentRemoteDescription) {
                            await pc.setRemoteDescription(new RTCSessionDescription(payload));
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);
                            await channel.send({
                                type: 'broadcast',
                                event: 'answer',
                                payload: answer,
                            });
                        }
                    })
                    .on('broadcast', { event: 'answer' }, async ({ payload }) => {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload));
                    })
                    .subscribe(async (status) => {
                        if (status === 'SUBSCRIBED') {
                            setTimeout(async () => {
                                if (!pc.currentRemoteDescription && pc.signalingState === 'stable') {
                                    const offer = await pc.createOffer();
                                    await pc.setLocalDescription(offer);
                                    await channel.send({
                                        type: 'broadcast',
                                        event: 'offer',
                                        payload: offer,
                                    });
                                }
                            }, 1000);
                        }
                    });

            } catch (err) {
                console.error('Error initializing call:', err);
            }
        };

        initCall();

        return () => {
            localStream?.getTracks().forEach(t => t.stop());
            peerConnection.current?.close();
            supabase.removeChannel(supabase.channel(roomId));
        };
    }, [roomId]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(t => t.enabled = !isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(t => t.enabled = !isCameraOff);
            setIsCameraOff(!isCameraOff);
        }
    };

    const startRecording = () => {
        if (!remoteStream && !localStream) return;

        const streamToRecord = remoteStream || localStream;
        if (!streamToRecord) return;

        const recorder = new MediaRecorder(streamToRecord);
        mediaRecorder.current = recorder;
        recordedChunks.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                recordedChunks.current.push(e.data);
            }
        };

        recorder.onstop = async () => {
            const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
            const fileName = `recording_${roomId}_${Date.now()}.webm`;

            const { error } = await supabase.storage
                .from('call_recordings')
                .upload(`${user?.id}/${fileName}`, blob);

            if (error) {
                console.error('Error uploading recording:', error);
                setNotification({
                    isOpen: true,
                    title: 'Lỗi lưu bản ghi',
                    description: 'Không thể lưu video ghi hình. Vui lòng thử lại.',
                    type: 'error'
                });
            } else {
                setNotification({
                    isOpen: true,
                    title: 'Đã lưu bản ghi',
                    description: 'Video cuộc gọi đã được lưu thành công vào lịch sử.',
                    type: 'success'
                });
            }
            setIsRecording(false);
        };

        recorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        mediaRecorder.current?.stop();
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-white p-4">
            <NotificationDialog
                isOpen={notification.isOpen}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
                title={notification.title}
                description={notification.description}
                type={notification.type}
            />

            <div className="w-[min(1440px,95vw)] rounded-[64px] p-8 bg-gradient-to-br from-white to-[#ecfbff] grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-8 lg:gap-16 shadow-2xl border border-slate-100">
                {/* Left: Main Video (Remote) */}
                <div className="flex flex-col gap-6">
                    <div className="relative rounded-[32px] overflow-hidden shadow-md border border-slate-200 aspect-video bg-slate-100">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {!remoteStream && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-2">
                                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-brand-cyan animate-spin" />
                                <p className="font-medium">Đang kết nối với đối phương...</p>
                            </div>
                        )}

                        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-sm font-medium border border-white/10">
                            Đối phương
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-[24px] border border-slate-100">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <Volume2 className="w-5 h-5 text-slate-400" />
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={volume}
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                    className="w-24 lg:w-[140px] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-cyan"
                                />
                            </div>

                            <div className="h-8 w-[1px] bg-slate-200" />

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleMute}
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                        isMuted ? "bg-red-100 text-red-500" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    )}
                                >
                                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={toggleCamera}
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                        isCameraOff ? "bg-red-100 text-red-500" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    )}
                                >
                                    {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all",
                                    isRecording
                                        ? "bg-red-50 text-red-500 border border-red-200 animate-pulse"
                                        : "bg-white text-slate-600 border border-slate-200 hover:border-brand-cyan hover:text-brand-cyan"
                                )}
                            >
                                <Disc className="w-4 h-4" />
                                {isRecording ? "Đang ghi..." : "Ghi hình"}
                            </button>

                            <button
                                onClick={onEndCall}
                                className="px-6 py-2 rounded-full bg-[#ff5a5d] hover:bg-[#ff4246] text-white font-medium shadow-lg shadow-red-200 transition-all"
                            >
                                Kết thúc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Local Video (Self) & Info */}
                <div className="flex flex-col gap-6">
                    <div className="rounded-[32px] overflow-hidden shadow-md border border-slate-200 bg-white aspect-video relative group">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={cn("w-full h-full object-cover mirror transition-opacity", isCameraOff && "opacity-0")}
                        />
                        {isCameraOff && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50">
                                <div className="flex flex-col items-center gap-2">
                                    <VideoOff className="w-8 h-8 opacity-50" />
                                    <span className="text-sm font-medium">Camera đang tắt</span>
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-sm font-medium border border-white/10">
                            Bạn (Tôi)
                        </div>
                    </div>

                    {/* Info Panel (Simplified) */}
                    <div className="flex-1 rounded-[32px] bg-[#e6faff] border border-[#b8eaff] p-6">
                        <h3 className="text-lg font-semibold text-brand-blue mb-4">Thông tin cuộc gọi</h3>
                        <div className="space-y-4">
                            <div className="bg-white/60 rounded-2xl p-4">
                                <p className="text-sm text-slate-500 mb-1">Trạng thái</p>
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2.5 h-2.5 rounded-full", remoteStream ? "bg-green-500" : "bg-yellow-500 animate-pulse")} />
                                    <span className="font-medium text-slate-700">
                                        {remoteStream ? "Đã kết nối" : "Đang chờ đối phương..."}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
