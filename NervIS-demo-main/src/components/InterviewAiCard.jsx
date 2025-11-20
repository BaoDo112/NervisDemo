import './InterviewAiCard.css'

const ACCENT_COLOR = '#62d1ee'

const UserIcon = () => (
  <svg
    className="interview-card__icon"
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
)

const StarIcon = ({ filled }) => (
  <svg
    className={`interview-card__star ${filled ? 'is-filled' : ''}`}
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
  >
    <path d="M12 2l2.955 6.352 6.742.559-5.12 4.49 1.557 6.599L12 16.958 5.866 20l1.557-6.599-5.12-4.49 6.742-.559z" />
  </svg>
)

const PlayIcon = () => (
  <svg className="interview-card__play-icon" viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M13 10l10 6-10 6z" fill="currentColor" />
  </svg>
)

const formatViews = (views) =>
  new Intl.NumberFormat('vi-VN').format(views).replace(/\s/g, '\u00A0')

export function InterviewAiCard({
  title,
  views,
  rating,
  reviewCount,
  duration,
  difficulty,
  tags = [],
  onOpen = () => {},
}) {
  const roundedRating = Math.round(rating * 10) / 10
  const stars = Array.from({ length: 5 }, (_, index) => (
    <StarIcon key={index} filled={index + 1 <= Math.round(rating)} />
  ))

  return (
    <article className="interview-card">
      <div className="interview-card__body">
        <h3 className="interview-card__title">{title}</h3>

        <div className="interview-card__meta">
          <div className="interview-card__meta-item">
            <UserIcon />
            <span>{formatViews(views)} lượt xem</span>
          </div>
          {duration && <span className="interview-card__meta-pill">⏱ {duration}</span>}
          {difficulty && (
            <span className="interview-card__meta-pill interview-card__meta-pill--ghost">
              {difficulty}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <ul className="interview-card__tags">
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="interview-card__footer">
        <div className="interview-card__rating">
          <div className="interview-card__stars">{stars}</div>
          <strong>{roundedRating.toFixed(1)}</strong>
          {typeof reviewCount === 'number' && <span>({reviewCount} đánh giá)</span>}
        </div>
        <button
          className="interview-card__play"
          type="button"
          aria-label="Xem nội dung"
          onClick={onOpen}
        >
          <PlayIcon />
        </button>
      </div>
    </article>
  )
}

export default InterviewAiCard
