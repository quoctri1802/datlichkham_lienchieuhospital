import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-slate-200/50 border border-slate-100 text-center space-y-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck size={48} />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hệ thống Quản trị</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Dành cho nhân viên <span className="font-bold text-blue-600">Bệnh viện Đa khoa Liên Chiểu</span>. 
            Vui lòng đăng nhập để tiếp tục.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100"
          >
            {error}
          </motion.div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-5 px-8 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 flex items-center justify-center gap-4 hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm group active:scale-95"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Tiếp tục với Google
            </>
          )}
        </button>

        <div className="pt-4">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-relaxed">
            Chỉ những tài khoản được cấp quyền <br /> mới có thể truy cập hệ thống.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
