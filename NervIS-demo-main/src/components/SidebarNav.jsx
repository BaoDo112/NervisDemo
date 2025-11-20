import './SidebarNav.css'
import AnalyticsIcon from '../assets/icons/analytics_icon.svg?react'
import CalendarIcon from '../assets/icons/calendar_icon.svg?react'
import HelpIcon from '../assets/icons/help_icon.svg?react'
import HomeIcon from '../assets/icons/home_icon.svg?react'
import LessonIcon from '../assets/icons/lesson_icon.svg?react'
import LogoutIcon from '../assets/icons/logout_icon.svg?react'
import SettingIcon from '../assets/icons/setting_icon.svg?react'
import TrainingIcon from '../assets/icons/training1v1_icon.svg?react'
import AvatarImage from '../assets/sidebar-avatar.png'

const NAV_ITEMS = [
  { id: 'home', label: 'Trang chủ', icon: 'home' },
  { id: 'training1v1', label: 'Luyện tập 1v1', icon: 'training1v1' },
  { id: 'library', label: 'Thư viện bài học', icon: 'library' },
  { id: 'calendar', label: 'Lịch luyện tập', icon: 'calendar' },
  { id: 'analytics', label: 'Thống kê', icon: 'analytics' },
]

const FOOTER_ITEMS = [
  { id: 'support', label: 'Hỗ trợ', icon: 'help' },
  { id: 'settings', label: 'Cài đặt', icon: 'settings' },
  { id: 'logout', label: 'Đăng xuất', icon: 'logout', tone: 'danger' },
]
const ICON_COMPONENTS = {
  home: HomeIcon,
  training1v1: TrainingIcon,
  library: LessonIcon,
  calendar: CalendarIcon,
  analytics: AnalyticsIcon,
  help: HelpIcon,
  settings: SettingIcon,
  logout: LogoutIcon,
}

function Icon({ name, active }) {
  const IconComponent = ICON_COMPONENTS[name]
  if (!IconComponent) return null

  return <IconComponent aria-hidden="true" className={`sidebar-icon ${active ? 'is-active' : ''}`} />
}

export function SidebarNav({ activeId = 'library', onChange }) {
  return (
    <aside className="sidebar-nav" aria-label="Thanh tác vụ">
      <div className="sidebar-nav__top">
        <div className="sidebar-nav__avatar" aria-label="Ảnh đại diện tài khoản">
          <img src={AvatarImage} alt="Ảnh đại diện" className="sidebar-nav__avatar-img" draggable="false" />
        </div>

        <div className="sidebar-nav__divider" />

        <nav className="sidebar-nav__stack" aria-label="Điều hướng nhanh">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === activeId
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                className={`sidebar-nav__item ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  if (onChange) onChange(item.id)
                }}
                aria-pressed={isActive}
              >
                <Icon name={item.icon} active={isActive} />
              </button>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-nav__footer" aria-label="Tác vụ bổ sung">
        {FOOTER_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            className={`sidebar-nav__item sidebar-nav__item--small ${item.tone === 'danger' ? 'is-danger' : ''}`}
            onClick={() => {
              if (onChange) onChange(item.id)
            }}
          >
            <Icon name={item.icon} />
          </button>
        ))}
      </div>
    </aside>
  )
}

export default SidebarNav
