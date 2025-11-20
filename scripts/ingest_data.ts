import { supabase, embedText } from '../api/utils/rag.js'

const knowledgeBase = [
    "UIT là trường Đại học Công nghệ Thông tin, thuộc Đại học Quốc gia TP.HCM. Đây là ngôi trường hàng đầu về đào tạo CNTT tại Việt Nam.",
    "Frontend Developer là lập trình viên chuyên về giao diện người dùng, sử dụng HTML, CSS, JavaScript, React, Vue, Angular.",
    "Backend Developer là lập trình viên chuyên về xử lý logic phía server, cơ sở dữ liệu, API, sử dụng Node.js, Python, Java, Go.",
    "Fullstack Developer là lập trình viên có thể làm cả Frontend và Backend.",
    "React là một thư viện JavaScript phổ biến để xây dựng giao diện người dùng, được phát triển bởi Facebook.",
    "Node.js là môi trường chạy JavaScript phía server, dựa trên V8 engine của Google.",
    "Đỗ Hoàng Bảo là một sinh viên ưu tú của UIT, có niềm đam mê với lập trình Frontend.",
    "SQL (Structured Query Language) là ngôn ngữ truy vấn có cấu trúc dùng để quản lý cơ sở dữ liệu quan hệ.",
    "NoSQL là cơ sở dữ liệu phi quan hệ, ví dụ như MongoDB, Cassandra, Redis.",
    "DevOps là văn hóa và tập hợp các kỹ thuật kết hợp giữa phát triển phần mềm (Dev) và vận hành hệ thống (Ops)."
]

async function ingestData() {
    console.log('Starting data ingestion...')

    for (const item of knowledgeBase) {
        console.log(`Processing: ${item.substring(0, 30)}...`)
        const embedding = await embedText(item)

        if (embedding.length > 0) {
            const { error } = await supabase.from('documents').insert({
                content: item,
                embedding: embedding
            })

            if (error) {
                console.error('Insert error:', error)
            } else {
                console.log('Inserted successfully.')
            }
        } else {
            console.error('Failed to generate embedding.')
        }
    }

    console.log('Ingestion complete.')
}

ingestData()
