import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, BookOpen, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { getApiBase } from '@/lib/api';

interface FeedbackDialogProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string;
    messages: Array<{ role: string; content: string }>;
    topic: string;
    role: string;
}

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
    isOpen,
    onClose,
    sessionId,
    messages,
    topic,
    role
}) => {
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [error, setError] = useState(false);
    const [relatedLessons, setRelatedLessons] = useState<Array<{ title: string, duration: string }>>([]);

    useEffect(() => {
        if (isOpen) {
            fetchEvaluation();
        }
    }, [isOpen]);

    const fetchEvaluation = async () => {
        setLoading(true);
        setError(false);
        try {
            const evalUrl = `${getApiBase()}/chat/evaluate`;
            const evalRes = await fetch(evalUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    messages,
                    topic,
                    role
                }),
            });

            if (!evalRes.ok) {
                throw new Error(`HTTP ${evalRes.status}`);
            }

            const evalData: {
                success: boolean;
                score?: number;
                feedback?: string;
                suggestions?: string[]
            } = await evalRes.json();

            if (!evalData.success) {
                throw new Error('Evaluation failed');
            }

            setScore(evalData.score || 0);
            setFeedback(evalData.feedback || '');
            setSuggestions(evalData.suggestions || []);

            // Generate mock related lessons based on topic
            setRelatedLessons([
                { title: `Kỹ năng trả lời phỏng vấn ${topic}`, duration: '15 phút' },
                { title: 'Cách tạo ấn tượng với nhà tuyển dụng', duration: '10 phút' },
                { title: 'Xử lý câu hỏi tình huống khó', duration: '20 phút' }
            ]);

        } catch (err) {
            console.error('AI Evaluation error:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-500';
        if (score >= 6) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 8) return 'Xuất sắc!';
        if (score >= 6) return 'Tốt!';
        return 'Cần cải thiện';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] shadow-2xl max-w-3xl w-[90vw] max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                {/* Header - Minimalist & Clean */}
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Kết quả phỏng vấn</h2>
                        <p className="text-slate-500 mt-1">Tổng hợp đánh giá từ AI cho buổi phỏng vấn của bạn</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                        aria-label="Đóng"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#62d0ee] animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-[#62d0ee]/20"></div>
                                </div>
                            </div>
                            <p className="text-slate-600 font-medium mt-6 text-lg">AI đang phân tích câu trả lời...</p>
                            <p className="text-slate-400 mt-2">Quá trình này có thể mất vài giây</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
                                <X className="w-10 h-10 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Không thể tải đánh giá</h3>
                            <p className="text-slate-600 mb-8 max-w-md mx-auto">Hệ thống AI đang gặp sự cố kết nối. Vui lòng thử lại sau ít phút.</p>
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={onClose}>Đóng</Button>
                                <Button
                                    onClick={fetchEvaluation}
                                    className="bg-[#62d0ee] hover:bg-[#62d0ee]/90 text-white"
                                >
                                    Thử lại
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Score & Summary */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-slate-50 rounded-3xl p-8 text-center border border-slate-100">
                                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Điểm số</div>
                                    <div className="relative inline-block">
                                        <svg className="w-40 h-40 transform -rotate-90">
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="70"
                                                stroke="currentColor"
                                                strokeWidth="10"
                                                fill="transparent"
                                                className="text-slate-200"
                                            />
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="70"
                                                stroke="currentColor"
                                                strokeWidth="10"
                                                fill="transparent"
                                                strokeDasharray={440}
                                                strokeDashoffset={440 - (440 * score) / 10}
                                                className={score >= 8 ? 'text-green-500' : score >= 6 ? 'text-yellow-500' : 'text-red-500'}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}</span>
                                            <span className="text-slate-400 text-sm font-medium">/10</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xl font-bold text-slate-800">
                                        {getScoreLabel(score)}
                                    </div>
                                </div>

                                <div className="bg-[#f0fdf4] rounded-2xl p-5 border border-green-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <h3 className="font-semibold text-green-800">Điểm mạnh</h3>
                                    </div>
                                    <p className="text-sm text-green-700 leading-relaxed">
                                        Bạn đã thể hiện sự tự tin và trả lời đúng trọng tâm câu hỏi.
                                    </p>
                                </div>
                            </div>

                            {/* Right Column: Detailed Feedback */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-[#62d0ee]" />
                                        <h3 className="text-lg font-bold text-slate-900">Chi tiết đánh giá</h3>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-line text-base">{feedback}</p>
                                    </div>
                                </div>

                                {suggestions.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-blue-500" />
                                            <h3 className="text-lg font-bold text-slate-900">Gợi ý cải thiện</h3>
                                        </div>
                                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                                            <ul className="space-y-3">
                                                {suggestions.map((suggestion, index) => (
                                                    <li key={index} className="flex gap-3 items-start">
                                                        <span className="text-blue-500 font-bold mt-0.5">•</span>
                                                        <span className="text-slate-700">{suggestion}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Related Lessons - AI Generated */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-purple-500" />
                                        <h3 className="text-lg font-bold text-slate-900">Bài học đề xuất</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {relatedLessons.map((lesson, idx) => (
                                            <div key={idx} className="group p-4 rounded-xl border border-slate-200 hover:border-[#62d0ee] hover:bg-[#f0fbff] transition-all cursor-pointer">
                                                <h4 className="font-semibold text-slate-800 group-hover:text-[#00a3d9] transition-colors line-clamp-1">{lesson.title}</h4>
                                                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                                    <span className="px-2 py-0.5 bg-slate-100 rounded-full group-hover:bg-white">Video</span>
                                                    <span>• {lesson.duration}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-[32px]">
                    <Button
                        className="bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-xl"
                        onClick={onClose}
                    >
                        Hoàn thành
                    </Button>
                </div>
            </div>
        </div>
    );
};
