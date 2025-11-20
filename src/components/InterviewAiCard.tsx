import React from 'react';

const ACCENT_COLOR = '#62d1ee';

const UserIcon = () => (
    <svg
        className="w-[18px] h-[18px]"
        viewBox="0 0 24 24"
        role="img"
        aria-hidden="true"
    >
        <path
            d="M12 12.5c3.313 0 6-2.687 6-6s-2.687-6-6-6-6 2.687-6 6 2.687 6 6 6zm0 3c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z"
            fill="none"
            stroke={ACCENT_COLOR}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg
        className={`w-4 h-4 ${filled ? 'fill-brand-cyan stroke-brand-cyan' : 'fill-[rgba(98,209,238,0.2)] stroke-brand-cyan'} stroke-[0.7]`}
        viewBox="0 0 24 24"
        role="img"
        aria-hidden="true"
    >
        <path d="M12 2l2.955 6.352 6.742.559-5.12 4.49 1.557 6.599L12 16.958 5.866 20l1.557-6.599-5.12-4.49 6.742-.559z" />
    </svg>
);

const PlayIcon = () => (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M13 10l10 6-10 6z" fill="currentColor" />
    </svg>
);

const formatViews = (views: number) =>
    new Intl.NumberFormat('vi-VN').format(views).replace(/\s/g, '\u00A0');

export interface InterviewAiCardProps {
    id: string;
    title: string;
    views: number;
    rating: number;
    reviewCount: number;
    description?: string;
    duration?: string;
    difficulty?: string;
    tags?: string[];
    category?: string;
    questions?: string[];
    onOpen?: () => void;
}

export function InterviewAiCard({
    title,
    views,
    rating,
    reviewCount,
    duration,
    difficulty,
    tags = [],
    onOpen = () => { },
}: InterviewAiCardProps) {
    const roundedRating = Math.round(rating * 10) / 10;
    const stars = Array.from({ length: 5 }, (_, index) => (
        <StarIcon key={index} filled={index + 1 <= Math.round(rating)} />
    ));

    return (
        <article className="flex flex-col gap-3 bg-white border border-brand-cyan rounded-[16px] p-[1rem_1.25rem] shadow-[0_14px_25px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_30px_45px_rgba(0,0,0,0.08)] h-full">
            <div className="flex flex-col gap-2">
                <h3 className="text-[clamp(1.05rem,0.95rem+0.4vw,1.4rem)] font-semibold text-brand-dark m-0 leading-[1.2] line-clamp-2 min-h-[3rem]">{title}</h3>

                <div className="flex flex-wrap items-center gap-[0.35rem_0.85rem] text-brand-muted text-[0.8rem]">
                    <div className="inline-flex items-center gap-[0.35rem]">
                        <UserIcon />
                        <span>{formatViews(views)} lượt xem</span>
                    </div>
                    {duration && <span className="inline-flex items-center px-[0.7rem] py-[0.2rem] rounded-full bg-[rgba(98,209,238,0.12)] text-brand-cyan font-medium">⏱ {duration}</span>}
                    {difficulty && (
                        <span className="inline-flex items-center px-[0.7rem] py-[0.2rem] rounded-full bg-[rgba(16,24,40,0.05)] text-brand-dark font-medium">
                            {difficulty}
                        </span>
                    )}
                </div>

                {tags.length > 0 && (
                    <ul className="flex flex-wrap gap-[0.3rem] m-[0.1rem_0_0] p-0 list-none">
                        {tags.map((tag) => (
                            <li key={tag} className="px-[0.6rem] py-[0.18rem] rounded-full bg-[#f4f8fb] text-brand-gray text-[0.75rem]">
                                {tag}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex items-center justify-between gap-3 mt-auto">
                <div className="flex items-center gap-2 text-brand-muted text-[0.85rem]">
                    <div className="inline-flex gap-[0.2rem]">{stars}</div>
                    <strong className="text-[1.25rem] text-brand-cyan">{roundedRating.toFixed(1)}</strong>
                    {typeof reviewCount === 'number' && <span>({reviewCount} đánh giá)</span>}
                </div>
                <button
                    className="w-[38px] h-[38px] rounded-full border-[1.5px] border-[rgba(98,209,238,0.6)] bg-transparent text-brand-cyan grid place-items-center cursor-pointer transition-all duration-180 hover:bg-brand-cyan hover:text-white"
                    type="button"
                    aria-label="Xem nội dung"
                    onClick={onOpen}
                >
                    <PlayIcon />
                </button>
            </div>
        </article>
    );
}

export default InterviewAiCard;
