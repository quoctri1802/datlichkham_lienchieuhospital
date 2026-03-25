import React from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Calendar as CalendarIcon, Clock, User, Phone, Stethoscope, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

const DEPARTMENTS = [
  "Nội tổng quát",
  "Ngoại khoa",
  "Nhi khoa",
  "Sản phụ khoa",
  "Tai Mũi Họng",
  "Răng Hàm Mặt",
  "Da liễu",
  "Mắt"
];

const TIME_SLOTS = [
  "08:00 - 08:30", "08:30 - 09:00", "09:00 - 09:30", "09:30 - 10:00",
  "10:00 - 10:30", "10:30 - 11:00", "13:30 - 14:00", "14:00 - 14:30",
  "14:30 - 15:00", "15:00 - 15:30", "15:30 - 16:00", "16:00 - 16:30"
];

export default function Booking() {
  const location = useLocation();
  const initialSymptoms = location.state?.symptoms || "";
  const initialDept = location.state?.department || "";

  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    patientName: '',
    phoneNumber: '',
    dob: '',
    patientIdentifier: '',
    date: format(addDays(startOfToday(), 1), 'yyyy-MM-dd'),
    timeSlot: '',
    department: initialDept || DEPARTMENTS[0],
    symptoms: initialSymptoms
  });

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = React.useState<Record<string, number>>({});

  // Fetch booked slots for selected date and department
  React.useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!formData.date || !formData.department) return;
      
      try {
        const q = query(
          collection(db, 'appointments'),
          where('date', '==', formData.date),
          where('department', '==', formData.department),
          where('status', '!=', 'cancelled')
        );
        
        const snapshot = await getDocs(q);
        const counts: Record<string, number> = {};
        snapshot.docs.forEach(doc => {
          const slot = doc.data().timeSlot;
          counts[slot] = (counts[slot] || 0) + 1;
        });
        setBookedSlots(counts);
      } catch (err) {
        console.error("Error fetching slots:", err);
      }
    };

    fetchBookedSlots();
  }, [formData.date, formData.department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    setLoading(true);
    setError(null);

    const path = 'appointments';
    try {
      // Get existing appointments for the same date to calculate sequence number
      const q = query(collection(db, path), where('date', '==', formData.date));
      const querySnapshot = await getDocs(q);
      const sequenceNumber = querySnapshot.size + 1;
      
      // Format the appointment code: e.g., LC-20260325-001
      const dateStr = formData.date.replace(/-/g, '');
      const formattedSequence = sequenceNumber.toString().padStart(3, '0');
      const appointmentCode = `LC-${dateStr}-${formattedSequence}`;

      const docRef = await addDoc(collection(db, path), {
        ...formData,
        appointmentCode,
        sequenceNumber,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSuccess(appointmentCode);
    } catch (err) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.CREATE, path);
      } catch (formattedErr: any) {
        setError(formattedErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white rounded-[2rem] p-8 text-center shadow-xl border border-slate-100"
      >
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Đặt lịch thành công!</h2>
        <p className="text-slate-600 mb-6">
          Mã số lịch hẹn của bạn là: <br />
          <span className="text-blue-600 font-mono font-bold text-xl">{success}</span>
        </p>
        <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 mb-8">
          <p className="text-sm text-slate-500">Thông tin chi tiết:</p>
          <p className="font-medium text-slate-900">Bệnh nhân: {formData.patientName}</p>
          <p className="font-medium text-slate-900">Ngày sinh: {formData.dob ? format(new Date(formData.dob), 'dd/MM/yyyy') : 'N/A'}</p>
          <p className="font-medium text-slate-900">Mã BN/CCCD: {formData.patientIdentifier}</p>
          <p className="font-medium text-slate-900">Thời gian: {formData.timeSlot}, {format(new Date(formData.date), 'dd/MM/yyyy')}</p>
          <p className="font-medium text-slate-900">Chuyên khoa: {formData.department}</p>
        </div>
        <div className="flex flex-col gap-3">
          <a
            href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Khám bệnh: ${formData.department}`)}&details=${encodeURIComponent(`Bệnh nhân: ${formData.patientName}\nTriệu chứng: ${formData.symptoms}`)}&dates=${formData.date.replace(/-/g, '')}T080000Z/${formData.date.replace(/-/g, '')}T090000Z`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <CalendarIcon size={18} className="text-blue-600" />
            Thêm vào Google Calendar
          </a>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </motion.div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  Họ và tên
                </label>
                <input
                  required
                  type="text"
                  placeholder="NGUYỄN VĂN A"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase"
                  value={formData.patientName}
                  onChange={e => setFormData({ ...formData, patientName: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Phone size={16} className="text-blue-600" />
                  Số điện thoại (Bắt đầu bằng số 0, 10 chữ số)
                </label>
                <input
                  required
                  type="tel"
                  pattern="0[0-9]{9}"
                  title="Số điện thoại phải bắt đầu bằng số 0 và gồm 10 chữ số"
                  placeholder="0901234567"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={formData.phoneNumber}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phoneNumber: val });
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <CalendarIcon size={16} className="text-blue-600" />
                  Ngày tháng năm sinh (Bắt buộc)
                </label>
                <input
                  required
                  type="date"
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <AlertCircle size={16} className="text-blue-600" />
                  Mã BN (8 số) hoặc Số CCCD (12 số)
                </label>
                <input
                  required
                  type="text"
                  pattern="([0-9]{8}|0[0-9]{11})"
                  title="Mã BN phải gồm 8 chữ số hoặc Số CCCD phải bắt đầu bằng số 0 và gồm 12 chữ số"
                  placeholder="Nhập Mã BN (8 số) hoặc Số CCCD (12 số)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={formData.patientIdentifier}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setFormData({ ...formData, patientIdentifier: val });
                  }}
                />
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <CalendarIcon size={16} className="text-blue-600" />
                  Ngày khám
                </label>
                <input
                  required
                  type="date"
                  min={format(addDays(startOfToday(), 1), 'yyyy-MM-dd')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Stethoscope size={16} className="text-blue-600" />
                  Chuyên khoa
                </label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                Chọn khung giờ (Tối đa 10 lượt/khung giờ)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {TIME_SLOTS.map(slot => {
                  const count = bookedSlots[slot] || 0;
                  const isFull = count >= 10;
                  
                  // Check if date is Sunday
                  const selectedDate = new Date(formData.date);
                  const dayOfWeek = selectedDate.getDay(); // 0 is Sunday, 6 is Saturday
                  
                  const isSunday = dayOfWeek === 0;
                  const isSaturday = dayOfWeek === 6;
                  const isAfternoon = slot.startsWith('13') || slot.startsWith('14') || slot.startsWith('15') || slot.startsWith('16');
                  
                  const isDisabled = isSunday || (isSaturday && isAfternoon) || isFull;

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setFormData({ ...formData, timeSlot: slot })}
                      className={cn(
                        "py-3 px-2 rounded-xl text-sm font-medium border transition-all relative",
                        isDisabled 
                          ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                          : formData.timeSlot === slot
                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                      )}
                    >
                      <div className="flex flex-col items-center">
                        <span>{slot}</span>
                        {isFull && <span className="text-[10px] text-red-400">Hết chỗ</span>}
                        {isSunday && <span className="text-[10px] text-red-400">Nghỉ CN</span>}
                        {isSaturday && isAfternoon && <span className="text-[10px] text-red-400">Nghỉ chiều T7</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              {new Date(formData.date).getDay() === 0 && (
                <p className="text-sm text-red-500 font-medium">Bệnh viện nghỉ Chủ Nhật. Vui lòng chọn ngày khác.</p>
              )}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <AlertCircle size={16} className="text-blue-600" />
                Triệu chứng / Lý do khám
              </label>
              <textarea
                rows={5}
                placeholder="Mô tả ngắn gọn tình trạng sức khỏe của bạn..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                value={formData.symptoms}
                onChange={e => setFormData({ ...formData, symptoms: e.target.value })}
              />
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="space-y-3 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100">
          Hệ thống đặt lịch trực tuyến
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Đặt lịch khám bệnh</h1>
        <p className="text-slate-500 text-sm md:text-base">
          Vui lòng điền đầy đủ thông tin bên dưới. <br className="md:hidden" />
          <span className="font-semibold text-blue-600">Bệnh viện Đa khoa Liên Chiểu</span> luôn sẵn sàng phục vụ bạn.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between px-4 md:px-0">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-300",
              step === s ? "bg-blue-600 text-white shadow-xl shadow-blue-200 scale-110" : 
              step > s ? "bg-green-500 text-white shadow-lg shadow-green-100" : "bg-white text-slate-300 border border-slate-100"
            )}>
              {step > s ? <CheckCircle2 size={24} /> : s}
            </div>
            {s < 3 && (
              <div className={cn(
                "h-1.5 flex-1 mx-2 rounded-full transition-all duration-500",
                step > s ? "bg-green-500" : "bg-slate-100"
              )} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-2xl"></div>
        
        <div className="min-h-[320px] relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900">
              {step === 1 ? "Thông tin bệnh nhân" : step === 2 ? "Chi tiết lịch hẹn" : "Triệu chứng & Ghi chú"}
            </h2>
          </div>
          {renderStep()}
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-3 border border-red-100"
          >
            <AlertCircle size={20} />
            {error}
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all border border-slate-100"
            >
              Quay lại
            </button>
          )}
          <button
            type="submit"
            disabled={loading || (step === 2 && !formData.timeSlot)}
            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang xử lý...
              </div>
            ) : step === 3 ? "Xác nhận đặt lịch" : "Tiếp tục"}
          </button>
        </div>
      </form>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
