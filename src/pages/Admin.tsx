import React from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, where, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter, 
  Search, 
  MoreVertical,
  Calendar as CalendarIcon,
  Users,
  TrendingUp,
  ChevronRight,
  UserPlus,
  Trash2,
  UserCheck,
  ClipboardList,
  UserCog
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Appointment {
  id: string;
  patientName: string;
  phoneNumber: string;
  dob: string;
  patientIdentifier: string;
  date: string;
  timeSlot: string;
  department: string;
  symptoms: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: any;
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
}

export default function Admin() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [activeTab, setActiveTab] = React.useState<'appointments' | 'users' | 'patients'>('appointments');
  const [filter, setFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPatientDate, setSelectedPatientDate] = React.useState('');
  
  // User management states
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState<'admin' | 'staff'>('staff');
  const [isAddingUser, setIsAddingUser] = React.useState(false);

  React.useEffect(() => {
    const q = query(
      collection(db, 'appointments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      setAppointments(data);
    });

    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (activeTab === 'users') {
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        setUsers(data);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
    } catch (err) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
      } catch (formattedErr: any) {
        alert("Lỗi: " + formattedErr.message);
      }
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;
    
    try {
      await addDoc(collection(db, 'users'), {
        email: newUserEmail,
        role: newUserRole
      });
      setNewUserEmail('');
      setIsAddingUser(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         app.phoneNumber.includes(searchTerm);
    const matchesStatus = filter === 'all' || app.status === filter;
    const matchesDate = app.date === selectedDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Unique patients list
  const patients = React.useMemo(() => {
    const patientMap = new Map<string, Appointment>();
    appointments.forEach(app => {
      const key = app.patientIdentifier || app.phoneNumber;
      if (!patientMap.has(key)) {
        patientMap.set(key, app);
      }
    });
    return Array.from(patientMap.values());
  }, [appointments]);

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.phoneNumber.includes(searchTerm) ||
                         p.patientIdentifier?.includes(searchTerm);
    const matchesDate = !selectedPatientDate || p.date === selectedPatientDate;
    return matchesSearch && matchesDate;
  });

  const stats = {
    total: appointments.filter(a => a.date === selectedDate).length,
    pending: appointments.filter(a => a.date === selectedDate && a.status === 'pending').length,
    confirmed: appointments.filter(a => a.date === selectedDate && a.status === 'confirmed').length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {activeTab === 'appointments' ? 'Quản lý lịch hẹn' : 
             activeTab === 'users' ? 'Quản lý người dùng' : 'Danh sách bệnh nhân'}
          </h1>
          <p className="text-slate-500">
            {activeTab === 'appointments' ? 'Chào mừng trở lại, đây là lịch trình hôm nay của bạn.' :
             activeTab === 'users' ? 'Quản lý quyền truy cập hệ thống cho nhân viên.' :
             'Thông tin chi tiết các bệnh nhân đã đăng ký khám.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('appointments')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'appointments' ? "bg-blue-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <CalendarIcon size={16} />
            Lịch hẹn
          </button>
          <button 
            onClick={() => setActiveTab('patients')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'patients' ? "bg-blue-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Users size={16} />
            Bệnh nhân
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'users' ? "bg-blue-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <UserCog size={16} />
            Người dùng
          </button>
        </div>
      </div>

      {activeTab === 'appointments' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: "Tổng bệnh nhân", value: stats.total, icon: Users, color: "blue" },
              { label: "Chờ xác nhận", value: stats.pending, icon: Clock, color: "orange" },
              { label: "Đã xác nhận", value: stats.confirmed, icon: CheckCircle2, color: "green" }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
            <input 
              type="date" 
              className="px-4 py-2 outline-none text-sm font-medium text-slate-700"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Tìm theo tên hoặc số điện thoại..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {['all', 'pending', 'confirmed', 'cancelled'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                    filter === s 
                      ? "bg-blue-600 text-white" 
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {s === 'all' ? 'Tất cả' : s === 'pending' ? 'Chờ' : s === 'confirmed' ? 'Xác nhận' : 'Đã hủy'}
                </button>
              ))}
            </div>
          </div>

          {/* Appointments List */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bệnh nhân</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Chuyên khoa</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode='popLayout'>
                    {filteredAppointments.map((app) => (
                      <motion.tr 
                        key={app.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{app.patientName}</div>
                          <div className="text-[10px] font-mono text-blue-600 font-bold mt-0.5">
                            {app.appointmentCode || `ID: ${app.id.substring(0, 8)}...`}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {app.phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            NS: {app.dob ? format(new Date(app.dob), 'dd/MM/yyyy') : 'N/A'} | CCCD: {app.patientIdentifier || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-700">{app.timeSlot}</div>
                          <div className="text-xs text-slate-500">{format(new Date(app.date), 'dd/MM/yyyy')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                            {app.department}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold",
                            app.status === 'confirmed' ? "bg-green-50 text-green-600" :
                            app.status === 'cancelled' ? "bg-red-50 text-red-600" :
                            "bg-orange-50 text-orange-600"
                          )}>
                            {app.status === 'confirmed' ? 'Đã xác nhận' :
                             app.status === 'cancelled' ? 'Đã hủy' : 'Đang chờ'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {app.status === 'pending' && (
                              <button 
                                onClick={() => updateStatus(app.id, 'confirmed')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Xác nhận"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                            )}
                            {app.status !== 'cancelled' && (
                              <button 
                                onClick={() => updateStatus(app.id, 'cancelled')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hủy lịch"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Không tìm thấy lịch hẹn nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Danh sách nhân viên</h2>
            <button 
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
            >
              <UserPlus size={18} />
              Thêm người dùng
            </button>
          </div>

          {isAddingUser && (
            <motion.form 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={addUser}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email Google</label>
                  <input 
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Vai trò</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as any)}
                  >
                    <option value="staff">Nhân viên (Staff)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
                >
                  Lưu người dùng
                </button>
              </div>
            </motion.form>
          )}

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        user.role === 'admin' ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa người dùng"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                      Chưa có người dùng nào được thêm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Tìm bệnh nhân theo tên, SĐT hoặc CCCD..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              <CalendarIcon size={18} className="text-slate-400" />
              <input 
                type="date" 
                className="bg-transparent outline-none text-sm font-medium text-slate-700"
                value={selectedPatientDate}
                onChange={e => setSelectedPatientDate(e.target.value)}
              />
              {selectedPatientDate && (
                <button 
                  onClick={() => setSelectedPatientDate('')}
                  className="text-xs text-blue-600 font-bold hover:underline ml-2"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Họ tên</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Số điện thoại</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày sinh</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">CCCD/ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lần khám gần nhất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{patient.patientName}</td>
                      <td className="px-6 py-4 text-slate-600">{patient.phoneNumber}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {patient.dob ? format(new Date(patient.dob), 'dd/MM/yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                        {patient.patientIdentifier || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-700">{patient.department}</div>
                        <div className="text-xs text-slate-500">{format(new Date(patient.date), 'dd/MM/yyyy')}</div>
                      </td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Không tìm thấy bệnh nhân nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
