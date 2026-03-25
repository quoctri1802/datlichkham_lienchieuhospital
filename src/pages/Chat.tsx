import React from 'react';
import { Send, Bot, User, Loader2, Calendar, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { useNavigate } from 'react-router-dom';

const SYSTEM_INSTRUCTION = `
Bạn là trợ lý y tế AI của Bệnh viện Đa khoa Liên Chiểu. 
Nhiệm vụ của bạn là giúp bệnh nhân mô tả triệu chứng, gợi ý chuyên khoa phù hợp và khuyến khích đặt lịch khám.

PHONG CÁCH TRÒ CHUYỆN:
- Điềm tĩnh, thân thiện, sử dụng tiếng Việt đơn giản, dễ hiểu.
- Phù hợp với mọi lứa tuổi, đặc biệt là người cao tuổi (dùng từ ngữ lễ phép, rõ ràng).

QUY TẮC AN TOÀN (BẮT BUỘC):
1. TUYỆT ĐỐI KHÔNG đưa ra chẩn đoán bệnh.
2. TUYỆT ĐỐI KHÔNG kê đơn thuốc hoặc hướng dẫn dùng thuốc.
3. LUÔN LUÔN bao gồm câu miễn trừ trách nhiệm: "Thông tin chỉ mang tính tham khảo, vui lòng đến Bệnh viện Đa khoa Liên Chiểu để được khám trực tiếp."
4. Nếu có dấu hiệu nguy kịch (khó thở, đau ngực dữ dội, co giật), khuyên gọi cấp cứu 115 ngay.

QUY TRÌNH TƯ VẤN (FLOW):
1. Hỏi về triệu chứng: "Bác/Anh/Chị đang gặp triệu chứng gì khó chịu ạ?"
2. Hỏi về thời gian: "Triệu chứng này đã xuất hiện bao lâu rồi ạ?"
3. Hỏi về mức độ: "Mức độ đau hoặc khó chịu như thế nào ạ? Có kèm theo sốt hay biểu hiện gì khác không?"
4. Gợi ý chuyên khoa: Dựa trên thông tin, gợi ý khoa phù hợp (Nội, Ngoại, Nhi, Sản, Tai Mũi Họng, Răng Hàm Mặt, Da liễu, Mắt).
5. Khuyến khích đặt lịch: "Bác/Anh/Chị nên đặt lịch khám để bác sĩ kiểm tra kỹ hơn ạ."

ĐỊNH DẠNG PHẢN HỒI:
Khi đã đủ thông tin để gợi ý, hãy trả về kết quả kèm theo cấu trúc JSON để hệ thống hiển thị thẻ gợi ý.

Cấu trúc JSON (chỉ khi đủ thông tin):
{
  "message": "Tóm tắt triệu chứng và lời khuyên của bạn. Ví dụ: Với triệu chứng bác mô tả, bác nên khám tại khoa Nội. Mức độ: Trung bình. Bác nên đặt lịch khám trong 1-2 ngày tới. Thông tin chỉ mang tính tham khảo, vui lòng đến Bệnh viện Đa khoa Liên Chiểu để được khám trực tiếp.",
  "suggestion": {
    "department": "Tên chuyên khoa",
    "urgency": "Thấp/Trung bình/Cao",
    "symptoms_summary": "Tóm tắt ngắn gọn triệu chứng",
    "cta": "Bạn có muốn đặt lịch khám không?"
  }
}
`;

interface Message {
  role: 'user' | 'bot';
  content: string;
  suggestion?: {
    department: string;
    urgency: string;
    symptoms_summary: string;
    cta?: string;
  };
}

export default function Chat() {
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'bot', content: 'Xin chào! Tôi là trợ lý y tế của Bệnh viện Đa khoa Liên Chiểu. Bác/Anh/Chị đang gặp vấn đề gì về sức khỏe cần em hỗ trợ tư vấn không ạ?' }
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const chatHistory = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await genAI.models.generateContent({
        model,
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "text/plain" // We'll try to parse JSON from text if present
        }
      });

      const text = response.text || "";
      let botContent = text;
      let suggestion = undefined;

      // Try to extract JSON if present
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          botContent = data.message;
          suggestion = data.suggestion;
        }
      } catch (e) {
        // Not JSON or invalid, use as plain text
      }

      setMessages(prev => [...prev, { role: 'bot', content: botContent, suggestion }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', content: 'Xin lỗi, tôi gặp trục trặc kỹ thuật. Bạn có thể thử lại sau hoặc đặt lịch trực tiếp nhé.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
            <Bot size={28} />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Trợ lý Y tế AI</h2>
            <p className="text-xs text-blue-100 font-medium">BV Đa khoa Liên Chiểu</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Trực tuyến</span>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-50/30"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "flex gap-4 max-w-[90%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
              msg.role === 'user' ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-100"
            )}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className="space-y-4 flex-1">
              <div className={cn(
                "p-5 rounded-3xl text-sm leading-relaxed shadow-sm",
                msg.role === 'user' 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
              )}>
                {msg.content}
              </div>

              {msg.suggestion && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-blue-100 rounded-[2rem] p-6 space-y-4 shadow-xl shadow-blue-500/5"
                >
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                      <AlertTriangle size={18} />
                    </div>
                    Gợi ý chuyên khoa phù hợp
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Chuyên khoa</span>
                      <span className="font-bold text-slate-900">{msg.suggestion.department}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mức độ ưu tiên</span>
                      <span className={cn(
                        "font-bold",
                        msg.suggestion.urgency === 'Cao' ? "text-red-600" : "text-orange-600"
                      )}>{msg.suggestion.urgency}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/booking', { 
                      state: { 
                        department: msg.suggestion?.department,
                        symptoms: msg.suggestion?.symptoms_summary
                      } 
                    })}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    <Calendar size={20} />
                    Đặt lịch khám ngay
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-white text-slate-600 border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm">
              <Bot size={20} />
            </div>
            <div className="bg-white p-5 rounded-3xl rounded-tl-none border border-slate-100 shadow-sm">
              <Loader2 size={20} className="animate-spin text-blue-500" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-slate-100 bg-white">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Nhập triệu chứng của bạn..."
            className="flex-1 px-6 py-4 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 transition-all text-sm"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 shrink-0"
          >
            <Send size={24} />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-4 font-medium">
          Thông tin chỉ mang tính tham khảo, vui lòng đến Bệnh viện Đa khoa Liên Chiểu để được khám trực tiếp.
        </p>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
