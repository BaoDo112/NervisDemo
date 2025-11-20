import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SidebarNav } from "@/components/SidebarNav";
import { AuthPage } from "@/pages/AuthPage";
import LessonLibraryPage from "@/pages/LessonLibraryPage";
import InterviewDetail from "@/pages/InterviewDetail";
import InterviewVoice from "@/pages/InterviewVoice";
import { Training1v1 } from "@/pages/Training1v1";
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/*"
            element={
              <div className="min-h-screen bg-background flex">
                <ProtectedRoute fallback={<AuthPage />}>
                  <SidebarNav />
                  <main className="flex-1 overflow-auto bg-muted/10">
                    <Routes>
                      <Route path="/" element={<LessonLibraryPage />} />

                      {/* Interview Routes */}
                      <Route path="/interview/:id" element={<InterviewDetail />} />
                      <Route path="/interview/voice" element={<InterviewVoice />} />

                      {/* Sidebar Items */}
                      <Route path="/training1v1" element={<Training1v1 />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/library" element={<LessonLibraryPage />} />
                      <Route path="/calendar" element={<div className="p-10 text-center text-muted-foreground">Lịch luyện tập - Coming Soon</div>} />
                      <Route path="/analytics" element={<div className="p-10 text-center text-muted-foreground">Thống kê - Coming Soon</div>} />
                    </Routes>
                  </main>
                </ProtectedRoute>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
