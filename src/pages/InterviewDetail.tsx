import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { InterviewAiCardProps } from '../components/InterviewAiCard';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';

// Icons
const BackArrowIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[18px] h-[18px] stroke-current stroke-2 fill-none">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);

const InfoUserIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 stroke-[#2e3a4b] stroke-[1.8] fill-none">
        <path d="M12 12.5c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6zm0 3c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z" />
    </svg>
);

const InfoCheckIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 stroke-[#2e3a4b] stroke-[1.8] fill-none">
        <path d="M15 2a5 5 0 0 1 5 5v1.4a5 5 0 0 1-.8 2.7l-.3.5m-4.2 5.4H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5h8" />
        <path d="M16 19l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const BookmarkIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-7 h-7 stroke-current stroke-[1.8] fill-none">
        <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
);

const StarIcon = ({ filled = false }: { filled?: boolean }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`w-6 h-6 stroke-[0.7] ${filled ? 'fill-brand-cyan stroke-brand-cyan' : 'fill-[#d0f3ff] stroke-brand-cyan'}`}>
        <path d="M12 2l2.955 6.352 6.742.559-5.12 4.49 1.557 6.599L12 16.958 5.866 20l1.557-6.599-5.12-4.49 6.742-.559z" />
    </svg>
);

const PlayIcon = () => (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="w-7 h-7">
        <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M13 10l10 6-10 6z" fill="currentColor" />
    </svg>
);

const ShareIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-7 h-7 stroke-current stroke-[1.8] fill-none">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
);

// Constants & Helpers
const FALLBACK_REVIEWS = [
    {
        id: 'review-01',
        name: 'Thảo Ly',
        role: 'Product Manager @ GHTK',
        timeAgo: '3 ngày trước',
        rating: 5,
        comment: 'Bộ câu hỏi giúp mình nhìn rõ phần phản xạ và được AI góp ý cực cụ thể. Sau 2 lần luyện tập đã tự tin hơn hẳn khi trả lời câu hỏi mở.',
        avatarColor: '#ecfdf3',
    },
    {
        id: 'review-02',
        name: 'Quang Huy',
        role: 'Senior Backend Engineer',
        timeAgo: '1 tuần trước',
        rating: 4.8,
        comment: 'Các tình huống hành vi được mô phỏng sát thực tế và transcript lưu lại rất tiện để xem lại từng câu trả lời.',
        avatarColor: '#e0f2fe',
    },
    {
        id: 'review-03',
        name: 'Minh Châu',
        role: 'Fresher Developer',
        timeAgo: '2 tuần trước',
        rating: 4.6,
        comment: 'Rất thích phần hướng dẫn cấu trúc trả lời. Mình dễ dàng luyện nói trôi chảy hơn và timing cũng chuẩn xác.',
        avatarColor: '#fdf2f8',
    },
];

const SIDEBAR_REVIEWS_PER_PAGE = 2;

const AUDIENCE_BY_DIFFICULTY: Record<string, string> = {
    'Dễ': 'Sinh viên IT mới ra trường, Junior Developer',
    'Trung cấp': 'Ứng viên Mid-level muốn tăng tốc',
    'Nâng cao': 'Senior Engineer / Tech Lead chuẩn bị onsite',
};

const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value || 0);

const clampRating = (value: number) => {
    if (Number.isNaN(Number(value))) return 0;
    return Math.max(0, Math.min(5, Number(value)));
};

const createStars = (rating: number) => {
    const filledCount = Math.round(clampRating(rating));
    return Array.from({ length: 5 }, (_, index) => (
        <StarIcon key={`star-${index}`} filled={index + 1 <= filledCount} />
    ));
};

const resolveAudience = (lesson: InterviewAiCardProps | undefined) => {
    if (!lesson?.difficulty) return 'Phù hợp mọi đối tượng';
    return AUDIENCE_BY_DIFFICULTY[lesson.difficulty] || 'Phù hợp mọi đối tượng';
};

// Component
export default function InterviewDetail() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const lessonId = searchParams.get('id');

    const [lesson, setLesson] = useState<InterviewAiCardProps | null>(location.state?.lesson || null);
    const [reviewPage, setReviewPage] = useState(0);
    const [loading, setLoading] = useState(!lesson);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);

    useEffect(() => {
        const fetchLesson = async () => {
            if (!lessonId) return;

            try {
                const { data, error } = await supabase
                    .from('question_buckets')
                    .select('*')
                    .eq('id', lessonId)
                    .single();

                if (error) throw error;

                if (data) {
                    setLesson({
                        id: data.id,
                        title: data.title,
                        description: data.description,
                        difficulty: data.difficulty,
                        duration: data.duration,
                        category: data.category,
                        tags: data.tags,
                        views: data.views,
                        rating: data.rating,
                        reviewCount: data.review_count
                    });
                    setFileUrl(data.file_url);
                    setQuestions(data.questions || []);
                }
            } catch (err) {
                console.error('Error fetching lesson:', err);
            } finally {
                setLoading(false);
            }
        };

        if (!lesson && lessonId) {
            fetchLesson();
        } else if (lesson) {
            // If we have lesson from state, try to fetch extra details like file_url
            const fetchDetails = async () => {
                const { data } = await supabase
                    .from('question_buckets')
                    .select('file_url, questions')
                    .eq('id', lesson.id)
                    .single();
                if (data) {
                    setFileUrl(data.file_url);
                    setQuestions(data.questions || []);
                }
            };
            fetchDetails();
        }
    }, [lessonId, lesson]);

    const totalReviews = FALLBACK_REVIEWS.length;
    const totalPages = Math.ceil(totalReviews / SIDEBAR_REVIEWS_PER_PAGE);
    const currentReviews = FALLBACK_REVIEWS.slice(
        reviewPage * SIDEBAR_REVIEWS_PER_PAGE,
        (reviewPage + 1) * SIDEBAR_REVIEWS_PER_PAGE
    );

    const handleBack = () => navigate(-1);

    const handleStartInterview = () => {
        if (!lesson) return;
        navigate(`/interview/voice?topic=${encodeURIComponent(lesson.title)}&role=interviewee`);
    };

    const handleViewFile = () => {
        if (fileUrl) {
            window.open(fileUrl, '_blank');
        }
    };

    if (loading) {
        return <div className="p-20 text-center text-brand-muted">Đang tải thông tin...</div>;
    }

    if (!lesson) {
        return <div className="p-10 text-center text-brand-muted">Không tìm thấy thông tin bài học.</div>;
    }

    const tags = new Set<string>();
    if (lesson.category) tags.add(lesson.category);
    if (lesson.difficulty) tags.add(`Độ khó: ${lesson.difficulty}`);
    if (lesson.duration) tags.add(`~${lesson.duration}`);
    if (lesson.tags) lesson.tags.forEach((t) => tags.add(t));

    const infoItems = [
        { id: 'views', icon: 'users', label: `${formatNumber(lesson?.views || 356)} lượt phỏng vấn` },
        { id: 'audience', icon: 'audience', label: `Đối tượng phù hợp: ${resolveAudience(lesson)}` },
    ];

    return (
        <div className="w-[min(1200px,92vw)] mx-auto py-10 pb-16 flex flex-col gap-10">
            {/* Context Bar */}
            <div className="flex items-center gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
                <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-[0.35rem] border border-[rgba(16,24,40,0.12)] rounded-full px-[0.95rem] py-[0.45rem] bg-white/80 text-brand-dark font-semibold cursor-pointer hover:bg-white disabled:opacity-60 disabled:cursor-default"
                >
                    <BackArrowIcon />
                    <span>Quay lại</span>
                </button>
                <span className="text-brand-muted">/</span>
                <h2 className="flex-1 m-0 font-semibold text-brand-dark text-base whitespace-nowrap overflow-hidden text-ellipsis">
                    {lesson.title}
                </h2>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-10 items-start max-lg:grid-cols-1">
                {/* Left Column */}
                <div className="flex flex-col gap-8">
                    {/* Hero Panel */}
                    <header className="card-panel p-8 flex flex-col gap-4">
                        <p className="text-[0.9rem] uppercase tracking-[0.08em] text-brand-cyan font-semibold m-[0_0_0.35rem]">
                            Luyện tập tức thời
                        </p>
                        <h1 className="text-[clamp(2rem,2.5vw,2.75rem)] text-[#101828] m-[0_0_0.75rem] font-bold leading-tight">
                            {lesson.title}
                        </h1>
                        <p className="m-0 text-brand-gray leading-[1.7] max-w-[520px]">
                            {lesson.description || 'Tạo phiên mock-interview cá nhân hóa với AI coach, theo dõi điểm phản xạ và nhận feedback theo thời gian thực.'}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                onClick={handleStartInterview}
                                className="border-none bg-gradient-to-br from-brand-cyan to-brand-blue text-white px-7 py-[0.85rem] rounded-full font-semibold cursor-pointer shadow-glow hover:shadow-lg transition-shadow"
                            >
                                Bắt đầu phiên 15 phút
                            </button>
                            <button className="border border-[rgba(16,24,40,0.2)] text-brand-dark bg-white/80 px-6 py-[0.85rem] rounded-full font-semibold cursor-pointer hover:bg-white">
                                <span className="inline-flex items-center gap-2"><PlayIcon /> Xem demo video</span>
                            </button>
                        </div>

                        <div className="mt-3 text-[0.9rem] text-brand-dark px-4 py-3 rounded-xl bg-[rgba(98,209,238,0.12)]">
                            Không giới hạn lượt luyện tập • Lưu transcript tự động
                        </div>
                    </header>

                    {/* Detail Panel */}
                    <section className="card-panel p-10 flex flex-col gap-8">
                        <div className="flex flex-wrap gap-3 max-sm:justify-start">
                            {Array.from(tags).map((tag) => (
                                <span key={tag} className="rounded-full px-5 py-2 bg-[#e9f7ff] text-[#2e90a5] font-semibold text-[0.95rem]">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="m-0 text-brand-gray leading-[1.7] text-[1.05rem]">
                            <p>
                                Bộ câu hỏi "{lesson.title}" được thiết kế nhằm mô phỏng sát quá trình tuyển dụng tại các tập đoàn công nghệ lớn.
                                Nội dung bao gồm phần kiểm tra thuật toán, cấu trúc dữ liệu, thiết kế hệ thống và cả câu hỏi hành vi để đánh giá khả năng làm việc nhóm, tư duy logic và khả năng thích ứng.
                                Đây là bước chuẩn bị quan trọng trước khi bước vào vòng phỏng vấn thực sự.
                            </p>
                        </div>

                        {/* Question File / Content Section */}
                        {(fileUrl || questions.length > 0) && (
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-brand-blue" />
                                    Tài liệu đính kèm
                                </h3>

                                {fileUrl && (
                                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                                                <span className="text-red-500 font-bold text-xs">PDF</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">File câu hỏi chi tiết</p>
                                                <p className="text-xs text-slate-500">Nhấn để xem hoặc tải về</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={handleViewFile}>
                                                <Eye className="w-4 h-4 mr-2" /> Xem
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, '_blank')}>
                                                <Download className="w-4 h-4 mr-2" /> Tải về
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {questions.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="font-medium text-slate-700">Danh sách câu hỏi mẫu:</p>
                                        <ul className="space-y-2">
                                            {questions.slice(0, 5).map((q, idx) => (
                                                <li key={idx} className="flex gap-3 items-start text-slate-600 text-sm">
                                                    <span className="font-bold text-brand-cyan mt-0.5">{idx + 1}.</span>
                                                    <span>{typeof q === 'string' ? q : q.question}</span>
                                                </li>
                                            ))}
                                            {questions.length > 5 && (
                                                <li className="text-center pt-2 text-brand-blue font-medium cursor-pointer hover:underline">
                                                    Xem thêm {questions.length - 5} câu hỏi khác...
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            {infoItems.map((item) => (
                                <div key={item.id} className="flex gap-4 items-center px-4 py-[0.85rem] rounded-2xl bg-[rgba(98,209,238,0.08)]">
                                    <div className="w-12 h-12 rounded-full bg-white grid place-items-center border border-[rgba(98,209,238,0.5)] shrink-0">
                                        {item.icon === 'users' ? <InfoUserIcon /> : <InfoCheckIcon />}
                                    </div>
                                    <p className="m-0 text-brand-dark font-semibold">{item.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center gap-4 flex-wrap">
                            <div className="flex gap-6">
                                <button className="p-0 border-none bg-transparent cursor-pointer flex items-center gap-2 text-brand-gray hover:text-brand-dark transition-colors" aria-label="Lưu">
                                    <BookmarkIcon />
                                    <span className="font-semibold">Lưu</span>
                                </button>
                                <button className="p-0 border-none bg-transparent cursor-pointer flex items-center gap-2 text-brand-gray hover:text-brand-dark transition-colors" aria-label="Chia sẻ">
                                    <ShareIcon />
                                    <span className="font-semibold">Chia sẻ</span>
                                </button>
                            </div>
                            <button
                                onClick={handleStartInterview}
                                className="px-5 py-2 border-none bg-gradient-to-br from-brand-cyan to-brand-blue text-white rounded-full cursor-pointer font-bold text-base shadow-[0_10px_25px_rgba(76,161,247,0.35)] hover:shadow-[0_12px_30px_rgba(76,161,247,0.45)] hover:scale-105 transition-all duration-200">
                                Bắt đầu phỏng vấn
                            </button>
                        </div>
                    </section>
                </div>

                {/* Right Sidebar */}
                <aside className="sticky top-8 flex flex-col gap-6 max-lg:static">
                    <div className="card-panel p-7">
                        <p className="text-[0.85rem] uppercase tracking-[0.08em] text-brand-cyan font-bold m-[0_0_0.5rem]">
                            Đánh giá tổng quan
                        </p>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-5">
                                <div className="flex gap-[0.35rem]">{createStars(lesson.rating)}</div>
                                <div className="flex items-baseline gap-1 text-brand-dark">
                                    <strong className="text-[2.25rem] leading-none">{lesson.rating}</strong>
                                    <span className="font-semibold text-slate-400">/ 5.0</span>
                                </div>
                            </div>
                            <p className="m-0 text-[0.95rem] text-brand-gray font-semibold">
                                {formatNumber(lesson.reviewCount || 128)} lượt đánh giá
                            </p>
                        </div>

                        {/* Reviews List */}
                        <div className="flex flex-col gap-5 mt-5 pt-5 border-t border-[rgba(15,23,42,0.08)]">
                            <p className="m-0 text-[0.8rem] tracking-[0.08em] uppercase font-bold text-slate-400">
                                Đánh giá từ người dùng
                            </p>
                            {currentReviews.map((review) => (
                                <article key={review.id} className="flex flex-col gap-3 pb-5 border-b border-[rgba(15,23,42,0.06)] last:border-none last:pb-0">
                                    <div className="flex gap-[0.85rem] items-start">
                                        <div
                                            className="w-12 h-12 rounded-[14px] grid place-items-center font-bold text-brand-dark shrink-0"
                                            style={{ backgroundColor: review.avatarColor }}
                                        >
                                            {review.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="m-0 font-bold text-brand-dark">{review.name}</h4>
                                            <p className="m-[0.15rem_0_0] text-brand-gray text-[0.9rem]">{review.role}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 min-w-[72px]">
                                            <div className="flex gap-[0.15rem]">
                                                {createStars(review.rating)}
                                            </div>
                                            <span className="font-bold text-[0.95rem] text-brand-dark">{clampRating(review.rating).toFixed(1)}</span>
                                        </div>
                                    </div>
                                    <p className="m-0 text-[#344054] leading-[1.6]">{review.comment}</p>
                                </article>
                            ))}
                        </div>

                        {/* Pager */}
                        <div className="flex items-center justify-center gap-[0.35rem] mt-1">
                            <button
                                disabled={reviewPage === 0}
                                onClick={() => setReviewPage((p) => Math.max(0, p - 1))}
                                className="border border-[rgba(15,23,42,0.2)] bg-[#f8fafc]/95 text-brand-dark rounded-[9px] w-8 h-8 grid place-items-center text-[1.1rem] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                ‹
                            </button>
                            <div className="flex gap-1 flex-wrap justify-center">
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setReviewPage(i)}
                                        className={`border border-[rgba(15,23,42,0.2)] rounded-[9px] min-w-[32px] h-8 px-[0.15rem] grid place-items-center font-semibold text-[0.9rem] cursor-pointer ${reviewPage === i ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white/92 text-brand-dark'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                disabled={reviewPage >= totalPages - 1}
                                onClick={() => setReviewPage((p) => Math.min(totalPages - 1, p + 1))}
                                className="border border-[rgba(15,23,42,0.2)] bg-[#f8fafc]/95 text-brand-dark rounded-[9px] w-8 h-8 grid place-items-center text-[1.1rem] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                ›
                            </button>
                        </div>
                    </div>

                    <p className="m-0 text-[0.85rem] text-[#344054] bg-[rgba(98,209,238,0.12)] rounded-2xl p-[1rem_1.25rem] border border-dashed border-[rgba(98,209,238,0.6)]">
                        Dữ liệu cập nhật hàng tuần và tự động đồng bộ sau mỗi phiên mock interview bạn thực hiện.
                    </p>
                </aside>
            </div>
        </div>
    );
}
