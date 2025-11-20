import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload } from 'lucide-react';
import { NotificationDialog } from '@/components/ui/notification-dialog';

interface QuestionBucketFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const QuestionBucketForm: React.FC<QuestionBucketFormProps> = ({ onSuccess, onCancel }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'Trung cấp',
        duration: '30 phút',
        category: 'jobs',
        tags: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [notification, setNotification] = useState<{ isOpen: boolean; title: string; description: string; type: 'success' | 'error' | 'info' }>({
        isOpen: false,
        title: '',
        description: '',
        type: 'info'
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!file) {
            setNotification({
                isOpen: true,
                title: 'Thiếu tệp tin',
                description: 'Vui lòng tải lên tệp PDF hoặc Word chứa câu hỏi.',
                type: 'error'
            });
            return;
        }

        setLoading(true);
        try {
            // 1. Upload File
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('question-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('question-files')
                .getPublicUrl(filePath);

            // 2. Insert Record
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);

            const { error } = await supabase.from('question_buckets').insert({
                title: formData.title,
                description: formData.description,
                difficulty: formData.difficulty,
                duration: formData.duration,
                category: formData.category,
                tags: tagsArray,
                file_url: publicUrl,
                creator_id: user.id,
                questions: [] // Empty array as we use file now
            });

            if (error) throw error;

            setNotification({
                isOpen: true,
                title: 'Thành công!',
                description: 'Bộ câu hỏi đã được tạo thành công.',
                type: 'success'
            });

            setTimeout(() => {
                onSuccess();
            }, 1500);

        } catch (error: any) {
            console.error('Error creating bucket:', error);
            setNotification({
                isOpen: true,
                title: 'Lỗi',
                description: error.message || 'Không thể tạo bộ câu hỏi. Vui lòng thử lại.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-200">
            <NotificationDialog
                isOpen={notification.isOpen}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
                title={notification.title}
                description={notification.description}
                type={notification.type}
            />

            <h2 className="text-2xl font-bold text-slate-900 mb-6">Tạo bộ câu hỏi mới</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề</label>
                        <Input
                            required
                            placeholder="Ví dụ: Phỏng vấn ReactJS Senior"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                        <Textarea
                            placeholder="Mô tả ngắn về bộ câu hỏi này..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Độ khó</label>
                            <Select
                                value={formData.difficulty}
                                onValueChange={v => setFormData({ ...formData, difficulty: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Dễ">Dễ</SelectItem>
                                    <SelectItem value="Trung cấp">Trung cấp</SelectItem>
                                    <SelectItem value="Nâng cao">Nâng cao</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
                            <Select
                                value={formData.category}
                                onValueChange={v => setFormData({ ...formData, category: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="jobs">Phỏng vấn xin việc</SelectItem>
                                    <SelectItem value="scholarship">Học bổng / Du học</SelectItem>
                                    <SelectItem value="startup">Pitching / Startup</SelectItem>
                                    <SelectItem value="softskills">Kỹ năng mềm</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Thời lượng (ước tính)</label>
                            <Input
                                placeholder="Ví dụ: 45 phút"
                                value={formData.duration}
                                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tags (phân cách bằng dấu phẩy)</label>
                            <Input
                                placeholder="React, Frontend, System Design"
                                value={formData.tags}
                                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tải lên tài liệu câu hỏi (PDF/Word)</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-brand-cyan transition-colors cursor-pointer relative">
                            <Input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center pointer-events-none">
                                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-600">
                                    {file ? file.name : 'Kéo thả hoặc nhấp để chọn tệp'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <Button type="button" variant="ghost" onClick={onCancel}>Hủy bỏ</Button>
                    <Button type="submit" disabled={loading} className="bg-brand-cyan hover:bg-brand-cyan/90">
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Tạo bộ câu hỏi
                    </Button>
                </div>
            </form>
        </div>
    );
};
