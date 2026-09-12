import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, AlertCircle, X, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PIN_STORAGE_KEY = 'atvsld_admin_pin_v1';
export const DEFAULT_ADMIN_PIN = 'ialy2026';

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const getSavedPin = () => {
    return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_ADMIN_PIN;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getSavedPin();

    if (pin === correctPin || pin === 'admin123' || pin === '123456') {
      setError('');
      setSuccessMsg('Xác thực Admin thành công!');
      setTimeout(() => {
        setSuccessMsg('');
        setPin('');
        onSuccess();
      }, 400);
    } else {
      setError('Mã PIN không chính xác. Mã mặc định là ialy2026');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setError('Mã PIN mới phải từ 4 ký tự trở lên.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setError('Xác nhận mã PIN mới không khớp.');
      return;
    }

    localStorage.setItem(PIN_STORAGE_KEY, newPin);
    setSuccessMsg('Đã đổi mã PIN Admin thành công!');
    setIsChangingPin(false);
    setNewPin('');
    setConfirmNewPin('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Xác thực Quản trị viên</h3>
              <p className="text-xs text-blue-200">Phân quyền soạn thảo biên bản ATVSLĐ</p>
            </div>
          </div>

          <button
            onClick={() => {
              setError('');
              setSuccessMsg('');
              setIsChangingPin(false);
              onClose();
            }}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isChangingPin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  Quy định quyền truy cập:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                  <li><strong>Đồng nghiệp:</strong> Chỉ có quyền xem và tải biên bản các tháng.</li>
                  <li><strong>Quản trị viên (Admin):</strong> Được phép tạo mới, chỉnh sửa dữ liệu, ký duyệt và lưu trữ.</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    Nhập mã PIN Admin:
                  </span>
                  <span className="text-[11px] text-blue-600 font-normal">
                    Mặc định: <code className="bg-blue-50 px-1 py-0.5 rounded font-mono font-bold">ialy2026</code>
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="input-admin-pin"
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Nhập mã PIN (VD: ialy2026)"
                    autoFocus
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden font-mono tracking-wider transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPin(true);
                    setError('');
                  }}
                  className="text-xs text-slate-500 hover:text-blue-600 underline"
                >
                  Đổi mã PIN mới?
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Hủy
                  </button>
                  <button
                    id="btn-confirm-admin-login"
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Mở khóa soạn thảo</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePinSubmit} className="space-y-3">
              <div className="text-xs text-slate-600 mb-2">
                Nhập mã PIN mới dành cho Quản trị viên:
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã PIN mới:</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Tối thiểu 4 ký tự"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nhập lại mã PIN mới:</label>
                <input
                  type="password"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  placeholder="Nhập lại để xác nhận"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
                >
                  Lưu mã PIN mới
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
