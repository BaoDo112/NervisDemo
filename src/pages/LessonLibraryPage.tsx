import React, { useMemo, useState, useEffect } from 'react';
import { InterviewAiCard, InterviewAiCardProps } from '@/components/InterviewAiCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { QuestionBucketForm } from '../components/library/QuestionBucketForm';

const FILTER_CHIPS = [
    { id: 'jobs', label: 'Phỏng vấn xin việc' },
    { id: 'scholarship', label: 'Học bổng / Du học' },
    { id: 'startup', label: 'Pitching / Startup' },
    { id: 'softskills', label: 'Kỹ năng mềm' },
];

const ARTICLES = [
    {
        id: 'article-hero-questions',
        title: 'Top 10 câu hỏi phỏng vấn xin việc phổ biến nhất 2025',
        description: 'Chuẩn bị trước những câu hỏi thường gặp giúp bạn tự tin hơn khi bước vào vòng phỏng vấn.',
        imageUrl:
            'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=700&q=80',
        rating: 4.3,
    },
    {
        id: 'article-scholarship',
        title: 'Cách luyện tập phỏng vấn học bổng hiệu quả',
        description: 'Tìm hiểu chiến lược để thuyết phục ban giám khảo trong buổi phỏng vấn học bổng.',
        imageUrl:
            'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=700&q=80',
        rating: 4.3,
    },
    {
        id: 'article-star-method',
        title: 'Hướng dẫn STAR Method để trả lời phỏng vấn tình huống',
        description: 'Công thức S.T.A.R giúp bạn kể chuyện mạch lạc và thuyết phục.',
        imageUrl:
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=700&q=80',
        rating: 4.3,
    },
    {
        id: 'article-body-language',
        title: 'Ngôn ngữ cơ thể trong phỏng vấn: Nên và không nên',
        description: 'Ánh mắt, tư thế và nụ cười có thể quyết định 50% thành công của bạn.',
        imageUrl:
            'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=700&q=80',
        rating: 4.3,
    },
];

const ArrowIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 stroke-current stroke-[1.8] fill-none">
        <path d="M5 12h14" />
        <path d="M13 6l6 6-6 6" />
    </svg>
);

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 stroke-[#0f172a] stroke-[1.6] fill-none">
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5 21 21" />
    </svg>
);

const FilterIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 stroke-[#62d1ee] stroke-[1.8] fill-none">
        <path d="M4 5h16" />
        <path d="M7 12h10" />
        <path d="M10 19h4" />
    </svg>
);

const ArticleCard = ({ title, description, imageUrl, rating }: { title: string; description: string; imageUrl: string; rating: number }) => (
    <article className="flex flex-col bg-white border border-[#10182814] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.08)] h-full">
        <div className="relative pt-[55%] bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }}>
            <span className="absolute top-4 left-4 bg-[#101828bf] text-white text-xs px-3 py-1 rounded-full">Bài viết</span>
        </div>
        <div className="flex flex-col flex-1 p-5 pb-2 gap-2">
            <h3 className="text-[1.1rem] font-semibold m-0 text-[#0f172a]">{title}</h3>
            <p className="text-[#475467] leading-relaxed m-0">{description}</p>
        </div>
        <div className="flex items-center justify-between gap-4 p-6 pt-3 border-t border-[#10182814] mt-auto">
            <div className="inline-flex items-center gap-1.5 text-[0.9rem] text-[#62d1ee]">
                <span className="tracking-wide text-[0.95rem]" aria-hidden="true">
                    ★★★★☆
                </span>
                <span className="text-[#0f172a] text-[0.9rem]">{rating.toFixed(1)}</span>
            </div>
            <button type="button" className="inline-flex items-center justify-center min-w-[110px] px-3.5 py-1 border border-[#62d1ee] text-[#0f172a] rounded-full bg-[#62d1ee26] font-semibold text-[0.9rem] cursor-pointer hover:bg-[#62d1ee40] transition-colors" aria-label="Đọc bài viết">
                Đọc ngay
            </button>
        </div>
    </article>
);

export function LessonLibraryPage() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('');
    const [search, setSearch] = useState('');
    const [lessons, setLessons] = useState<InterviewAiCardProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const MOCK_LESSONS: InterviewAiCardProps[] = [
        {
            id: 'mock-1',
            title: 'Phỏng vấn Frontend Developer (ReactJS)',
            description: 'Bộ câu hỏi phỏng vấn cho vị trí Senior Frontend Developer với ReactJS, TypeScript và System Design.',
            difficulty: 'Nâng cao',
            duration: '45 phút',
            tags: ['React', 'Frontend', 'System Design'],
            category: 'jobs',
            questions: [],
            rating: 4.8,
            reviewCount: 120,
            views: 1500,
        },
        {
            id: 'mock-2',
            title: 'Phỏng vấn học bổng Chevening',
            description: 'Các câu hỏi thường gặp khi phỏng vấn học bổng chính phủ Anh Chevening.',
            difficulty: 'Nâng cao',
            duration: '60 phút',
            tags: ['Scholarship', 'Chevening', 'UK'],
            category: 'scholarship',
            questions: [],
            rating: 4.9,
            reviewCount: 85,
            views: 2300,
        },
        {
            id: 'mock-3',
            title: 'Kỹ năng đàm phán lương',
            description: 'Luyện tập các tình huống đàm phán lương và phúc lợi với nhà tuyển dụng.',
            difficulty: 'Trung cấp',
            duration: '30 phút',
            tags: ['Soft Skills', 'Negotiation', 'Salary'],
            category: 'softskills',
            questions: [],
            rating: 4.5,
            reviewCount: 210,
            views: 5000,
        }
    ];

    const fetchLessons = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('question_buckets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching lessons:', error);
            setLessons(MOCK_LESSONS); // Fallback to mock data on error
        } else {
            // Merge real data with mock data
            setLessons([...(data || []), ...MOCK_LESSONS]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLessons();
    }, []);

    const filteredLessons = useMemo(() => {
        return lessons.filter((lesson) => {
            const matchesSearch = lesson.title.toLowerCase().includes(search.trim().toLowerCase());
            const matchesFilter = !activeFilter || lesson.category === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [search, activeFilter, lessons]);

    const handleOpenLesson = (lesson: InterviewAiCardProps) => {
        navigate(`/interview/${lesson.id}`, { state: { lesson } });
    };

    const handleCreateSuccess = () => {
        setShowCreateForm(false);
        fetchLessons();
    };

    if (showCreateForm) {
        return (
            <div className="w-[min(1200px,92vw)] mx-auto py-10">
                <QuestionBucketForm
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setShowCreateForm(false)}
                />
            </div>
        );
    }

    return (
        <section className="w-[min(1200px,92vw)] mx-auto py-10 pb-16 flex flex-col gap-10">
            <header className="flex flex-col gap-6">
                <div className="flex gap-4 items-center max-sm:flex-col">
                    <div className="flex-1 flex items-center gap-3 px-6 h-12 rounded-full border border-[#dde3ea] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)] w-full">
                        <SearchIcon />
                        <input
                            type="search"
                            placeholder="Tìm tài liệu / bài viết / bộ câu hỏi nhanh"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Tìm kiếm nội dung"
                            className="border-none outline-none flex-1 text-base text-[#0f172a] placeholder-[#b1b5c3]"
                        />
                    </div>
                    <button type="button" className="w-12 h-12 rounded-full border border-[#dde3ea] bg-white grid place-items-center cursor-pointer shadow-[0_4px_20px_rgba(15,23,42,0.06)] max-sm:w-full" aria-label="Bộ lọc nâng cao">
                        <FilterIcon />
                    </button>
                </div>

                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-4" role="tablist" aria-label="Bộ lọc nội dung">
                        {FILTER_CHIPS.map((chip) => (
                            <button
                                key={chip.id}
                                type="button"
                                className={`border rounded-full px-7 py-2.5 font-semibold cursor-pointer transition-all duration-150 ${activeFilter === chip.id
                                    ? 'border-[#62d1ee] text-[#101828] bg-[#62d1ee26]'
                                    : 'border-[#cfd6e4] bg-white text-[#475467]'
                                    }`}
                                onClick={() => setActiveFilter((prev) => (prev === chip.id ? '' : chip.id))}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>

                    {/* Recruiter Action */}
                    {(profile?.role === 'recruiter' || profile?.role === 'admin') && (
                        <Button
                            onClick={() => setShowCreateForm(true)}
                            className="rounded-full bg-brand-cyan hover:bg-brand-cyan/90 shadow-lg shadow-cyan-100"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Tạo bộ câu hỏi
                        </Button>
                    )}
                </div>
            </header>

            <section className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="m-0 text-2xl text-[#101828] font-bold">Bộ câu hỏi</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-7">
                        {filteredLessons.map((lesson) => (
                            <InterviewAiCard
                                key={lesson.id}
                                {...lesson}
                                onOpen={() => handleOpenLesson(lesson)}
                            />
                        ))}

                        {filteredLessons.length === 0 && (
                            <div className="col-span-full border border-dashed border-[#62d1ee99] rounded-3xl p-8 text-center text-[#475467]">
                                <p>Không tìm thấy bài học phù hợp. Thử bộ lọc khác nhé!</p>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <section className="flex flex-col gap-6 mt-4">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="m-0 text-2xl text-[#101828] font-bold">Bài viết</h2>
                    <button type="button" className="inline-flex items-center gap-1.5 text-[#62d1ee] font-semibold bg-none border-none cursor-pointer p-0 hover:underline">
                        <span>Xem thêm</span>
                        <ArrowIcon />
                    </button>
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-8 items-stretch">
                    {ARTICLES.map((article) => (
                        <ArticleCard key={article.id} {...article} />
                    ))}
                </div>
            </section>
        </section>
    );
}

export default LessonLibraryPage;
