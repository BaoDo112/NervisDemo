import { useState } from 'react'
import './App.css'
import { LessonLibraryPage } from './pages/LessonLibraryPage'
import { SidebarNav } from './components/SidebarNav'
import { InterviewAiPage } from './pages/InterviewAiPage'

const PAGE_LABELS = {
  home: 'Trang chủ',
  training1v1: 'Luyện tập 1v1',
  library: 'Thư viện bài học',
  calendar: 'Lịch luyện tập',
  analytics: 'Thống kê',
}

function App() {
  const [activeNav, setActiveNav] = useState('library')
  const [view, setView] = useState({ type: 'library' })

  const handleNavChange = (nextId) => {
    setActiveNav(nextId)
    if (nextId === 'library') {
      setView({ type: 'library' })
      return
    }

    setView({ type: 'placeholder', navId: nextId })
  }

  const handleOpenLesson = (lesson) => {
    setActiveNav('library')
    setView({ type: 'interview', lesson })
  }

  const handleBackToLibrary = () => {
    setView({ type: 'library' })
  }

  const renderContent = () => {
    if (view.type === 'interview') {
      return <InterviewAiPage lesson={view.lesson} onBack={handleBackToLibrary} />
    }

    if (view.type === 'library') {
      return <LessonLibraryPage onOpenLesson={handleOpenLesson} />
    }

    const pendingLabel = PAGE_LABELS[view.navId] || view.navId
    return (
      <section className="app-placeholder" aria-live="polite">
        <p>Tính năng “{pendingLabel}” sẽ ra mắt sớm.</p>
      </section>
    )
  }

  return (
    <div className="app-shell">
      <SidebarNav activeId={activeNav} onChange={handleNavChange} />
      <main className="app-main">{renderContent()}</main>
    </div>
  )
}

export default App
