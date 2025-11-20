import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Play, BookOpen, Calendar, TrendingUp } from 'lucide-react';

export default function Dashboard() {
    const { profile } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="w-[min(1200px,92vw)] mx-auto py-10 flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">
                    Xin chào, {profile?.full_name || 'User'}
                </h1>
                <p className="text-slate-500 mt-2">
                    Chào mừng bạn quay trở lại. Hôm nay bạn muốn làm gì?
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-brand-cyan" onClick={() => navigate('/training1v1')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Luyện tập 1v1</CardTitle>
                        <Play className="h-4 w-4 text-brand-cyan" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Bắt đầu ngay</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Phỏng vấn thử với người thật hoặc AI
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500" onClick={() => navigate('/library')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Thư viện bài học</CardTitle>
                        <BookOpen className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Khám phá</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Hàng trăm bộ câu hỏi và bài viết
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500" onClick={() => navigate('/calendar')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lịch luyện tập</CardTitle>
                        <Calendar className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Xem lịch</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Quản lý các buổi phỏng vấn sắp tới
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500" onClick={() => navigate('/analytics')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Thống kê</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Tiến độ</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Theo dõi sự cải thiện của bạn
                        </p>
                    </CardContent>
                </Card>
            </div>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Hoạt động gần đây</h2>
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                    <p>Chưa có hoạt động nào gần đây.</p>
                    <Button variant="link" className="text-brand-cyan mt-2" onClick={() => navigate('/library')}>
                        Tìm bài học mới
                    </Button>
                </div>
            </section>
        </div>
    );
}
