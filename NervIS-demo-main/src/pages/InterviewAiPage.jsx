import { useState } from 'react'
import ShareIcon from '../assets/icons/share_icon.svg?react'
import './InterviewAiPage.css'

const FALLBACK_REVIEWS = [
  {
    id: 'review-01',
    name: 'Thảo Ly',
    role: 'Product Manager @ GHTK',
    timeAgo: '3 ngày trước',
    rating: 5,
    comment:
      'Bộ câu hỏi giúp mình nhìn rõ phần phản xạ và được AI góp ý cực cụ thể. Sau 2 lần luyện tập đã tự tin hơn hẳn khi trả lời câu hỏi mở.',
    avatarColor: '#ecfdf3',
  },
  {
    id: 'review-02',
    name: 'Quang Huy',
    role: 'Senior Backend Engineer',
    timeAgo: '1 tuần trước',
    rating: 4.8,
    comment:
      'Các tình huống hành vi được mô phỏng sát thực tế và transcript lưu lại rất tiện để xem lại từng câu trả lời.',
    avatarColor: '#e0f2fe',
  },
  {
    id: 'review-03',
    name: 'Minh Châu',
    role: 'Fresher Developer',
    timeAgo: '2 tuần trước',
    rating: 4.6,
    comment:
      'Rất thích phần hướng dẫn cấu trúc trả lời. Mình dễ dàng luyện nói trôi chảy hơn và timing cũng chuẩn xác.',
    avatarColor: '#fdf2f8',
  },
]

const SIDEBAR_REVIEWS_PER_PAGE = 2

const CATEGORY_LABELS = {
  jobs: 'Phỏng vấn xin việc',
  scholarship: 'Học bổng / Du học',
  startup: 'Pitching / Startup',
  softskills: 'Kỹ năng mềm',
}

const AUDIENCE_BY_DIFFICULTY = {
  Dễ: 'Sinh viên IT mới ra trường, Junior Developer',
  'Trung cấp': 'Ứng viên Mid-level muốn tăng tốc',
  'Nâng cao': 'Senior Engineer / Tech Lead chuẩn bị onsite',
}

const BackArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="interview-ai__back-icon">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

const InfoUserIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="interview-ai__info-svg">
    <path d="M12 12.5c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6zm0 3c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z" />
  </svg>
)

const InfoCheckIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="interview-ai__info-svg">
    <path d="M15 2a5 5 0 0 1 5 5v1.4a5 5 0 0 1-.8 2.7l-.3.5m-4.2 5.4H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5h8" />
    <path d="M16 19l2 2 4-4" />
  </svg>
)

const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 3h12v18l-6-4-6 4z" />
  </svg>
)

const StarIcon = ({ filled = false }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`interview-ai__star ${filled ? 'is-filled' : ''}`}>
    <path d="M12 2l2.955 6.352 6.742.559-5.12 4.49 1.557 6.599L12 16.958 5.866 20l1.557-6.599-5.12-4.49 6.742-.559z" />
  </svg>
)

const PlayIcon = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M13 10l10 6-10 6z" fill="currentColor" />
  </svg>
)

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(value || 0)

const clampRating = (value) => {
  if (Number.isNaN(Number(value))) return 0
  return Math.max(0, Math.min(5, Number(value)))
}

const createStars = (rating) => {
  const filledCount = Math.round(clampRating(rating))
  return Array.from({ length: 5 }, (_, index) => (
    <StarIcon key={`${rating}-${index}`} filled={index + 1 <= filledCount} />
  ))
}

const buildInitials = (name = '') => {
  const parts = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
  const initials = parts.map((part) => part[0] || '').join('')
  return initials.toUpperCase() || 'AI'
}

const buildDescription = (topic) =>
  `Bộ câu hỏi “${topic}” được thiết kế nhằm mô phỏng sát quá trình tuyển dụng tại các tập đoàn công nghệ lớn. Nội dung bao gồm phần kiểm tra thuật toán, cấu trúc dữ liệu, thiết kế hệ thống và cả câu hỏi hành vi để đánh giá khả năng làm việc nhóm, tư duy logic và khả năng thích ứng. Đây là bước chuẩn bị quan trọng trước khi bước vào vòng phỏng vấn thực sự.`

const buildTopicTags = (lesson) => {
  if (!lesson) {
    return ['Phỏng vấn xin việc', 'Công nghệ', 'Problem Solving', 'Kỹ sư phần mềm']
  }

  const tags = new Set()
  if (lesson.category && CATEGORY_LABELS[lesson.category]) {
    tags.add(CATEGORY_LABELS[lesson.category])
  }
  lesson.tags?.forEach((tag) => tags.add(tag))
  if (lesson.difficulty) tags.add(`Độ khó: ${lesson.difficulty}`)
  if (lesson.duration) tags.add(`~${lesson.duration}`)

  return Array.from(tags).slice(0, 4)
}

const resolveAudience = (lesson) => {
  if (!lesson?.difficulty) return 'Ứng viên muốn luyện mock interview bài bản'
  return AUDIENCE_BY_DIFFICULTY[lesson.difficulty] || 'Ứng viên muốn luyện mock interview bài bản'
}

export function InterviewAiPage({ lesson, onBack }) {
  const [reviewPageByLesson, setReviewPageByLesson] = useState({})
  const topic = lesson?.title || 'Interview with AI'
  const topicTags = buildTopicTags(lesson)
  const description = buildDescription(topic)
  const infoItems = [
    { id: 'views', icon: 'users', label: `${formatNumber(lesson?.views)} lượt phỏng vấn` },
    { id: 'audience', icon: 'audience', label: `Đối tượng phù hợp: ${resolveAudience(lesson)}` },
  ]
  const overallScore = Math.round(((lesson?.rating ?? 4.9) * 10)) / 10
  const totalReviews = lesson?.reviewCount ?? 128
  const ratingStars = createStars(overallScore)
  const reviews = lesson?.reviews?.length ? lesson.reviews : FALLBACK_REVIEWS
  const lessonReviewKey = lesson?.id || 'default'
  const storedPage = reviewPageByLesson[lessonReviewKey] ?? 0
  const totalReviewPages = Math.max(1, Math.ceil(reviews.length / SIDEBAR_REVIEWS_PER_PAGE))
  const safePage = Math.max(0, Math.min(storedPage, totalReviewPages - 1))
  const pageStart = safePage * SIDEBAR_REVIEWS_PER_PAGE
  const visibleReviews = reviews.slice(pageStart, pageStart + SIDEBAR_REVIEWS_PER_PAGE)

  const handleSelectReviewPage = (pageIndex) => {
    setReviewPageByLesson((prev) => {
      if (prev[lessonReviewKey] === pageIndex) {
        return prev
      }
      return { ...prev, [lessonReviewKey]: pageIndex }
    })
  }

  return (
    <section className="interview-ai" aria-label="Interview with AI">
      <div className="interview-ai__context">
        <button
          type="button"
          className="interview-ai__back-button"
          onClick={() => onBack && onBack()}
          disabled={!onBack}
          aria-label="Quay lại thư viện bài học"
        >
          <BackArrowIcon />
          <span>Quay lại</span>
        </button>
        <p className="interview-ai__topic" title={topic}>
          {topic}
        </p>
      </div>
      <div className="interview-ai__layout">
        <div className="interview-ai__main">
          <header className="interview-ai__panel interview-ai__hero">
            <p className="interview-ai__eyebrow">Luyện tập tức thời</p>
            <h1>Interview with AI</h1>
            <p className="interview-ai__subtitle">
              Tạo phiên mock-interview cá nhân hóa với AI coach, theo dõi điểm phản xạ và nhận feedback theo thời gian thực.
            </p>
            <div className="interview-ai__hero-ctas">
              <button type="button" className="interview-ai__primary-cta">
                Bắt đầu phiên 15 phút
              </button>
              <button type="button" className="interview-ai__ghost-cta">
                Xem demo video
              </button>
            </div>
            <div className="interview-ai__guarantee" role="note">
              <span>Không giới hạn lượt luyện tập • Lưu transcript tự động</span>
            </div>
          </header>

          <section className="interview-ai__panel interview-ai__detail-panel">
            <div className="interview-ai__tag-row">
              {topicTags.map((tag) => (
                <span key={tag} className="interview-ai__tag">
                  {tag}
                </span>
              ))}
            </div>

            <p className="interview-ai__description">{description}</p>

            <div className="interview-ai__info-list">
              {infoItems.map((item) => (
                <div key={item.id} className="interview-ai__info-item">
                  <span className="interview-ai__info-icon" aria-hidden="true">
                    {item.icon === 'users' ? <InfoUserIcon /> : <InfoCheckIcon />}
                  </span>
                  <p>{item.label}</p>
                </div>
              ))}
            </div>

            <div className="interview-ai__actions">
              <div className="interview-ai__action-buttons">
                <button type="button" className="interview-ai__icon-button" aria-label="Lưu bộ câu hỏi">
                  <BookmarkIcon />
                </button>
                <button type="button" className="interview-ai__icon-button" aria-label="Chia sẻ bộ câu hỏi">
                  <ShareIcon />
                </button>
              </div>
              <button type="button" className="interview-ai__cta-wide">
                Tạo cuộc phỏng vấn với AI
                <PlayIcon />
              </button>
            </div>
          </section>
        </div>
        <aside className="interview-ai__sidebar" aria-label="Đánh giá tổng quan">
          <div className="interview-ai__sidebar-card">
            <p className="interview-ai__sidebar-eyebrow">Overall score</p>
            <div className="interview-ai__rating-block">
              <div className="interview-ai__rating-row">
                <div className="interview-ai__rating-stars" aria-hidden="true">
                  {ratingStars}
                </div>
                <div className="interview-ai__rating-value" aria-label={`Điểm trung bình ${overallScore.toFixed(1)} trên 5`}>
                  <strong>{overallScore.toFixed(1)}</strong>
                  <span>/5.0</span>
                </div>
              </div>
              <p className="interview-ai__rating-reviews">{formatNumber(totalReviews)} lượt đánh giá</p>
            </div>
            <div className="interview-ai__review-list" role="list" aria-label="Danh sách review từ người dùng">
              <p className="interview-ai__review-heading">User reviews</p>
              {visibleReviews.map((review) => {
                const initials = review.initials || buildInitials(review.name)
                const reviewStars = createStars(review.rating)
                const meta = [review.role, review.timeAgo].filter(Boolean).join(' • ')
                return (
                  <article key={review.id} className="interview-ai__review" role="listitem">
                    <div className="interview-ai__review-header">
                      <div
                        className="interview-ai__review-avatar"
                        aria-hidden="true"
                        style={review.avatarColor ? { backgroundColor: review.avatarColor } : undefined}
                      >
                        {initials}
                      </div>
                      <div className="interview-ai__review-meta">
                        <p className="interview-ai__review-name">{review.name}</p>
                        {meta && <p className="interview-ai__review-role">{meta}</p>}
                      </div>
                      <div className="interview-ai__review-score" aria-label={`Đánh giá ${clampRating(review.rating).toFixed(1)} trên 5`}>
                        <div className="interview-ai__review-stars" aria-hidden="true">
                          {reviewStars}
                        </div>
                        <span>{clampRating(review.rating).toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="interview-ai__review-comment">{review.comment}</p>
                  </article>
                )
              })}
              <div className="interview-ai__review-pager" role="group" aria-label="Chuyển trang review">
                <button
                  type="button"
                  className="interview-ai__pager-arrow"
                  onClick={() => handleSelectReviewPage(Math.max(0, safePage - 1))}
                  disabled={safePage === 0}
                  aria-label="Trang trước"
                >
                  ‹
                </button>
                <div className="interview-ai__pager-numbers">
                  {Array.from({ length: totalReviewPages }).map((_, index) => (
                    <button
                      key={`review-page-${index}`}
                      type="button"
                      className={`interview-ai__pager-number ${safePage === index ? 'is-active' : ''}`}
                      onClick={() => handleSelectReviewPage(index)}
                      aria-current={safePage === index ? 'page' : undefined}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="interview-ai__pager-arrow"
                  onClick={() => handleSelectReviewPage(Math.min(totalReviewPages - 1, safePage + 1))}
                  disabled={safePage >= totalReviewPages - 1}
                  aria-label="Trang sau"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
          <p className="interview-ai__sidebar-note">
            Dữ liệu cập nhật hàng tuần và tự động đồng bộ sau mỗi phiên mock interview bạn thực hiện.
          </p>
        </aside>
      </div>
    </section>
  )
}

export default InterviewAiPage
