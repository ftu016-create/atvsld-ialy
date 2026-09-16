import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Eraser, 
  Check, 
  Upload, 
  PenTool, 
  Image as ImageIcon, 
  Trash2, 
  ShieldCheck
} from 'lucide-react';
import { Member } from '../types';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  memberIndex: number | null;
  onSaveSignature: (memberIndex: number, signatureDataUrl: string) => void;
  onRemoveSignature?: (memberIndex: number) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  member,
  memberIndex,
  onSaveSignature,
  onRemoveSignature,
}) => {
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>('#1e3a8a');
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isLeader = member?.role?.toLowerCase().includes('trưởng đoàn');

  useEffect(() => {
    if (isOpen) {
      setUploadedPreview(null);
      setHasDrawn(false);
      setTimeout(() => {
        clearCanvas();
      }, 50);
    }
  }, [isOpen, memberIndex, mode]);

  if (!isOpen || memberIndex === null) return null;

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = ('touches' in e && e.touches.length > 0) 
      ? e.touches[0].clientX 
      : (e as React.MouseEvent).clientX;
    const clientY = ('touches' in e && e.touches.length > 0) 
      ? e.touches[0].clientY 
      : (e as React.MouseEvent).clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const dataUrl = canvas.toDataURL('image/png');
      onSaveSignature(memberIndex, dataUrl);
      onClose();
    } else if (mode === 'upload' && uploadedPreview) {
      onSaveSignature(memberIndex, uploadedPreview);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedPreview(dataUrl);
      onSaveSignature(memberIndex, dataUrl);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteExistingSignature = () => {
    if (onRemoveSignature && memberIndex !== null) {
      onRemoveSignature(memberIndex);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              ✍️
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chữ ký điện tử
              </h3>
              <p className="text-xs text-slate-500">
                Ký trực tiếp hoặc tải ảnh chữ ký có sẵn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Target Member Banner */}
          <div className="flex items-center gap-3 p-3.5 bg-blue-50/80 border border-blue-200/90 rounded-xl shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-xs">
              {member?.name ? member.name.charAt(0).toUpperCase() : `${memberIndex + 1}`}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide">
                  Người ký (#{memberIndex + 1}):
                </span>
                {isLeader && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                    <ShieldCheck className="w-3 h-3 text-amber-800" />
                    Trưởng đoàn
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                {member?.name || `Thành viên ${memberIndex + 1}`}
              </p>
              <p className="text-xs text-slate-600 truncate">
                {member?.role || 'Thành viên đoàn kiểm tra'}
              </p>
            </div>

            {member?.signatureUrl && (
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                  ✓ Đã có chữ ký
                </span>
                <button
                  type="button"
                  onClick={handleDeleteExistingSignature}
                  className="text-[11px] text-red-600 hover:text-red-700 hover:underline flex items-center gap-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa chữ ký</span>
                </button>
              </div>
            )}
          </div>

          {/* If already has signature, show preview */}
          {member?.signatureUrl && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-600">Chữ ký hiện tại:</span>
                <img 
                  src={member.signatureUrl} 
                  alt={`Chữ ký của ${member.name}`} 
                  className="h-10 max-w-[120px] object-contain bg-white px-2 py-1 rounded border border-slate-200" 
                />
              </div>
              <span className="text-[11px] text-slate-500 italic">
                (Ký đè bên dưới nếu muốn thay đổi)
              </span>
            </div>
          )}

          {/* Mode Switcher: Draw vs Upload */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('draw')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                mode === 'draw' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Vẽ ký trực tiếp</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                mode === 'upload' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải file ảnh chữ ký</span>
            </button>
          </div>

          {mode === 'draw' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Màu mực:</span>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#1e3a8a', label: 'Xanh mực công văn' },
                    { color: '#000000', label: 'Mực đen' },
                    { color: '#dc2626', label: 'Mực đỏ' },
                  ].map((item) => (
                    <button
                      key={item.color}
                      type="button"
                      onClick={() => setPenColor(item.color)}
                      style={{ backgroundColor: item.color }}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        penColor === item.color ? 'ring-2 ring-blue-500 scale-110 border-white' : 'border-transparent opacity-80'
                      }`}
                      title={item.label}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Xóa nét</span>
                  </button>
                </div>
              </div>

              {/* Canvas Area */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-2 overflow-hidden flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={420}
                  height={160}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="bg-white rounded-lg shadow-inner cursor-crosshair touch-none w-full max-w-[420px] h-[160px]"
                />
              </div>
              <p className="text-[11px] text-center text-slate-400">
                Dùng chuột hoặc ngón tay (màn hình cảm ứng) để ký vào ô trên
              </p>
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Tải ảnh chữ ký của {member?.name || 'thành viên'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hỗ trợ PNG, JPG, HEIC. Khuyên dùng ảnh nền trong suốt (PNG)
                </p>
              </div>

              {uploadedPreview ? (
                <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block max-w-[200px] mx-auto">
                  <img src={uploadedPreview} alt="Xem trước chữ ký" className="max-h-20 mx-auto object-contain" />
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">Đã sẵn sàng chèn</p>
                </div>
              ) : null}

              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer transition shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>Chọn ảnh chữ ký từ máy</span>
                  <input
                    type="file"
                    accept="image/*,.heic,.heif"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition"
          >
            Đóng
          </button>
          {mode === 'draw' && (
            <button
              type="button"
              disabled={!hasDrawn}
              onClick={handleSave}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition shadow-xs ${
                hasDrawn 
                  ? 'text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 cursor-pointer' 
                  : 'text-slate-400 bg-slate-200 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Chèn chữ ký cho {member?.name?.split(' ').pop() || 'thành viên'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
