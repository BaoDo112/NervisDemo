export type Difficulty = 'easy' | 'medium' | 'hard'

export interface QuestionItem { q: string; diff: Difficulty; tags: string[] }

export const QUESTION_BANK: QuestionItem[] = [
  { q: 'Giới thiệu ngắn gọn về bản thân và mục tiêu nghề nghiệp trong lĩnh vực CNTT.', diff: 'easy', tags: ['it'] },
  { q: 'Mô tả dự án phần mềm gần đây nhất bạn tham gia và vai trò của bạn.', diff: 'medium', tags: ['it'] },
  { q: 'Thiết kế hệ thống xử lý lượng truy cập cao: bạn chọn kiến trúc nào và lý do?', diff: 'hard', tags: ['it'] },
  { q: 'Kế hoạch du học CNTT của bạn: trường, chuyên ngành, lý do lựa chọn.', diff: 'easy', tags: ['study'] },
  { q: 'Bạn dự định tận dụng chương trình du học để phát triển kỹ năng gì trong AI/ML?', diff: 'medium', tags: ['study','it'] },
  { q: 'So sánh các hướng nghiên cứu bạn quan tâm khi du học (NLP, CV, Systems).', diff: 'hard', tags: ['study','it'] },
]

export function pickQuestions(diff: Difficulty, count = 5) {
  const pool = QUESTION_BANK.filter(x => x.diff === diff)
  const out: QuestionItem[] = []
  const a = [...pool]
  while (out.length < Math.min(count, a.length)) {
    const i = Math.floor(Math.random() * a.length)
    out.push(a.splice(i,1)[0])
  }
  return out
}

