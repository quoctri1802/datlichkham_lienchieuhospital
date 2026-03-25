import { Link } from 'react-router-dom';
import { Calendar, MessageSquare, ArrowRight, ShieldCheck, Clock, Users } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="text-center space-y-8 pt-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000')] bg-center bg-no-repeat opacity-[0.03] pointer-events-none blur-sm"></div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-100"
        >
          <ShieldCheck size={14} />
          Bệnh viện Đa khoa Liên Chiểu
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]"
        >
          Chăm sóc sức khỏe <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Toàn diện & Hiện đại</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
        >
          Hệ thống đặt lịch khám thông minh và tư vấn sức khỏe AI 24/7. 
          Chúng tôi cam kết mang lại dịch vụ y tế chất lượng cao nhất cho cộng đồng.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
        >
          <Link 
            to="/booking"
            className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
          >
            Đặt lịch khám ngay
            <Calendar size={20} className="group-hover:rotate-12 transition-transform" />
          </Link>
          <Link 
            to="/chat"
            className="px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            Tư vấn với AI
            <MessageSquare size={20} className="text-blue-600" />
          </Link>
        </motion.div>
      </section>

      {/* Stats/Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        {[
          { icon: Clock, title: "Tiết kiệm thời gian", desc: "Đặt lịch trực tuyến, không còn cảnh chờ đợi mệt mỏi tại bệnh viện." },
          { icon: Users, title: "Đội ngũ chuyên gia", desc: "Y bác sĩ giàu kinh nghiệm, tận tâm với từng bệnh nhân." },
          { icon: ShieldCheck, title: "An toàn & Bảo mật", desc: "Hệ thống quản lý thông tin bệnh án hiện đại, bảo mật tuyệt đối." }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-blue-100 transition-all group"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <feature.icon size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
            <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Quick Access Cards */}
      <section className="bg-blue-600 rounded-[2rem] p-8 md:p-12 text-white overflow-hidden relative">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl font-bold mb-4">Bạn đang cảm thấy không khỏe?</h2>
          <p className="text-blue-100 mb-8">
            Hãy trò chuyện với trợ lý AI của chúng tôi để được gợi ý chuyên khoa phù hợp 
            và đánh giá mức độ khẩn cấp của các triệu chứng.
          </p>
          <Link 
            to="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors"
          >
            Bắt đầu tư vấn ngay
            <ArrowRight size={18} />
          </Link>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-blue-500 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/4 w-96 h-96 bg-blue-400 rounded-full opacity-30 blur-3xl"></div>
      </section>
    </div>
  );
}
