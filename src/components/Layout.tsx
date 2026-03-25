import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Calendar, MessageSquare, LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState(auth.currentUser);
  const location = useLocation();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { path: '/', icon: Home, label: 'Trang chủ' },
    { path: '/booking', icon: Calendar, label: 'Đặt lịch' },
    { path: '/chat', icon: MessageSquare, label: 'Tư vấn AI' },
  ];

  if (user) {
    navItems.push({ path: '/admin', icon: LayoutDashboard, label: 'Quản lý' });
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 md:pl-72 hospital-bg">
      {/* Sidebar for Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white/90 backdrop-blur-xl border-r border-slate-200 hidden md:flex flex-col shadow-sm z-40">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
              <Home size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900 leading-tight">BV Đa khoa</span>
              <span className="text-sm font-medium text-blue-600 leading-tight">Liên Chiểu</span>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu chính</div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group",
                location.pathname === item.path 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100 font-medium" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-transform group-hover:scale-110",
                location.pathname === item.path ? "text-white" : "text-slate-400 group-hover:text-blue-600"
              )} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 space-y-4">
          {user ? (
            <div className="space-y-3">
              <div className="px-4 py-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-slate-900 truncate">{user.email}</span>
                  <span className="text-[10px] text-slate-500">Nhân viên</span>
                </div>
              </div>
              <button 
                onClick={() => signOut(auth)}
                className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all group"
              >
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Đăng xuất</span>
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all group"
            >
              <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
              <span className="font-medium text-sm">Nhân viên đăng nhập</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Bottom Nav for Mobile */}
      <nav className="fixed bottom-4 left-4 right-4 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl flex justify-around items-center h-16 rounded-2xl md:hidden z-50">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative",
              location.pathname === item.path 
                ? "text-blue-600 scale-110" 
                : "text-slate-400"
            )}
          >
            <item.icon size={22} />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
            {location.pathname === item.path && (
              <motion.div 
                layoutId="bottomNav"
                className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full"
              />
            )}
          </Link>
        ))}
        {!user && (
          <Link
            to="/login"
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
              location.pathname === '/login' ? "text-blue-600 scale-110" : "text-slate-400"
            )}
          >
            <LogIn size={22} />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Login</span>
          </Link>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-10">
        {children}
      </main>
    </div>
  );
}
