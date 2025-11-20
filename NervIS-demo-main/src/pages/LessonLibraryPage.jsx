import { useMemo, useState } from 'react'
import { InterviewAiCard } from '../components/InterviewAiCard'
import './LessonLibraryPage.css'

const LESSONS = [
  {
    id: 'algorithms-01',
    title: 'Bộ 7 câu hỏi giải thuật vấn đáp cho phỏng vấn IT',
    views: 356,
    rating: 4.9,
    reviewCount: 128,
    duration: '45 phút',
    difficulty: 'Trung cấp',
    tags: ['Giải thuật', 'Mock interview'],
    category: 'jobs',
  },
  {
    id: 'system-design',
    title: 'Bí kíp hệ thống hóa câu trả lời System Design chỉ trong 4 bước',
    views: 512,
    rating: 4.8,
    reviewCount: 96,
    duration: '60 phút',
    difficulty: 'Nâng cao',
    tags: ['System Design', 'Architecture'],
    category: 'jobs',
  },
  {
    id: 'behavioral',
    title: '35 tình huống hành vi thường gặp và cách xử lý ấn tượng',
    views: 908,
    rating: 4.7,
    reviewCount: 211,
    duration: '30 phút',
    difficulty: 'Dễ',
    tags: ['Soft skills'],
    category: 'softskills',
  },
  {
    id: 'frontend',
    title: 'Checklist tối ưu React + TypeScript cho vòng onsite',
    views: 274,
    rating: 4.95,
    reviewCount: 64,
    duration: '50 phút',
    difficulty: 'Nâng cao',
    tags: ['Frontend', 'Performance'],
    category: 'startup',
  },
  {
    id: 'datastructures',
    title: 'Luyện tập cấu trúc dữ liệu với 20 bài whiteboard',
    views: 622,
    rating: 4.6,
    reviewCount: 173,
    duration: '40 phút',
    difficulty: 'Trung cấp',
    tags: ['DSA'],
    category: 'jobs',
  },
  {
    id: 'ai',
    title: 'Ứng dụng AI hỗ trợ trả lời câu hỏi mở trong 15 phút',
    views: 189,
    rating: 4.5,
    reviewCount: 42,
    duration: '25 phút',
    difficulty: 'Dễ',
    tags: ['AI', 'Product sense'],
    category: 'scholarship',
  },
]
const FILTER_CHIPS = [
  { id: 'jobs', label: 'Phỏng vấn xin việc' },
  { id: 'scholarship', label: 'Học bổng / Du học' },
  { id: 'startup', label: 'Pitching / Startup' },
  { id: 'softskills', label: 'Kỹ năng mềm' },
]

const ARTICLES = [
  {
    id: 'article-hero-questions',
    title: 'Top 10 câu hỏi phỏng vấn xin việc phổ biến nhất 2025',
    description: 'Chuẩn bị trước những câu hỏi thường gặp giúp bạn tự tin hơn khi bước vào buổi phỏng vấn.',
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
]

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="lesson-library__arrow-icon">
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
)

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="lesson-library__search-icon">
    <circle cx="11" cy="11" r="7" />
    <path d="M16.5 16.5 21 21" />
  </svg>
)

const FilterIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="lesson-library__filter-icon">
    <path d="M4 5h16" />
    <path d="M7 12h10" />
    <path d="M10 19h4" />
  </svg>
)

const ArticleCard = ({ title, description, imageUrl, rating }) => (
  <article className="article-card">
    <div className="article-card__media" style={{ backgroundImage: `url(${imageUrl})` }}>
      <span className="article-card__chip">Bài viết</span>
    </div>
    <div className="article-card__content">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
    <div className="article-card__footer">
      <div className="article-card__rating">
        <span className="article-card__rating-stars" aria-hidden="true">
          ★★★★☆
        </span>
        <span className="article-card__rating-value">{rating.toFixed(1)}</span>
      </div>
      <button type="button" className="article-card__cta" aria-label="Đọc bài viết">
        Đọc ngay
      </button>
    </div>
  </article>
)

export function LessonLibraryPage({ onOpenLesson = () => {} }) {
  const [activeFilter, setActiveFilter] = useState('')
  const [search, setSearch] = useState('')

  const filteredLessons = useMemo(() => {
    return LESSONS.filter((lesson) => {
      const matchesSearch = lesson.title.toLowerCase().includes(search.trim().toLowerCase())
      const matchesFilter = !activeFilter || lesson.category === activeFilter
      return matchesSearch && matchesFilter
    })
  }, [search, activeFilter])

  return (
    <section className="lesson-library">
      <header className="lesson-library__search-panel">
        <div className="lesson-library__search-row">
          <div className="lesson-library__search-field">
            <SearchIcon />
            <input
              type="search"
              placeholder="Tìm tài liệu / bài viết / bộ câu hỏi nhanh"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Tìm kiếm nội dung"
            />
          </div>
          <button type="button" className="lesson-library__filter-button" aria-label="Bộ lọc nâng cao">
            <FilterIcon />
          </button>
        </div>

        <div className="lesson-library__chips" role="tablist" aria-label="Bộ lọc nội dung">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={`lesson-library__chip ${activeFilter === chip.id ? 'is-active' : ''}`}
              onClick={() => setActiveFilter((prev) => (prev === chip.id ? '' : chip.id))}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </header>

      <section className="lesson-library__section">
        <div className="lesson-library__section-heading">
          <h2>Bộ câu hỏi</h2>
        </div>

        <div className="lesson-library__grid">
          {filteredLessons.map((lesson) => (
            <InterviewAiCard
              key={lesson.id}
              {...lesson}
              onOpen={() => onOpenLesson && onOpenLesson(lesson)}
            />
          ))}

          {filteredLessons.length === 0 && (
            <div className="lesson-library__empty">
              <p>Không tìm thấy bài học phù hợp. Thử bộ lọc khác nhé!</p>
            </div>
          )}
        </div>
      </section>

      <section className="lesson-library__section lesson-library__section--articles">
        <div className="lesson-library__section-heading">
          <h2>Bài viết</h2>
          <button type="button" className="lesson-library__link-button">
            <span>Xem thêm</span>
            <ArrowIcon />
          </button>
        </div>

        <div className="lesson-library__articles">
          {ARTICLES.map((article) => (
            <ArticleCard key={article.id} {...article} />
          ))}
        </div>
      </section>
    </section>
  )
}

export default LessonLibraryPage
