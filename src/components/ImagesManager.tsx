import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  Maximize2,
  X,
  Loader2,
  Building2,
  HelpCircle
} from 'lucide-react';
import heic2any from 'heic2any';
import { ReportImage } from '../types';

interface ImagesManagerProps {
  images: ReportImage[];
  onChange: (images: ReportImage[]) => void;
}

export const ImagesManager: React.FC<ImagesManagerProps> = ({ images, onChange }) => {
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [convertingMessage, setConvertingMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Process File with HEIC/HEIF conversion & Canvas resizing
  const processImageFile = async (file: File): Promise<string> => {
    let sourceBlob: Blob = file;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isHeic = ['heic', 'heif'].includes(ext) || ['image/heic', 'image/heif'].includes(file.type);

    if (isHeic) {
      try {
        setIsConverting(true);
        setConvertingMessage(`Đang chuyển đổi định dạng ảnh iPhone (HEIC) ${file.name}...`);
        const conversion = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.88,
        });
        sourceBlob = Array.isArray(conversion) ? conversion[0] : conversion;
      } catch (err) {
        console.error('HEIC conversion failed:', err);
      } finally {
        setIsConverting(false);
        setConvertingMessage('');
      }
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(sourceBlob);
    });
  };

  // Bulk Upload Multiple Files via Drag & Drop or Input Selection
  const handleProcessMultipleFiles = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;

    setIsConverting(true);
    setConvertingMessage(`Đang tối ưu hóa ${fileList.length} ảnh hiện trường...`);

    try {
      const nextImages = [...images];
      // Calculate current max STT
      let currentMaxStt = nextImages.length > 0 ? Math.max(...nextImages.map((x) => Number(x.stt))) : 0;

      // Check existing unpaired STTs
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.heic')) {
          continue;
        }

        const dataUrl = await processImageFile(file);
        
        // Find next appropriate slot
        // Try pairing into an existing STT that only has ST or MR
        let chosenStt = 0;
        let chosenSide: 'ST' | 'MR' = 'ST';

        for (let s = 1; s <= currentMaxStt; s++) {
          const hasST = nextImages.some((x) => x.stt === s && x.side === 'ST');
          const hasMR = nextImages.some((x) => x.stt === s && x.side === 'MR');
          if (!hasST) {
            chosenStt = s;
            chosenSide = 'ST';
            break;
          } else if (!hasMR) {
            chosenStt = s;
            chosenSide = 'MR';
            break;
          }
        }

        if (chosenStt === 0) {
          currentMaxStt += 1;
          chosenStt = currentMaxStt;
          chosenSide = 'ST';
        }

        const sideName = chosenSide === 'ST' ? 'NMTĐ Ialy' : 'NMTĐ Ialy MR';
        // Auto extract caption hint from filename if reasonable
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const caption = cleanName.length > 3 && cleanName.length < 50 
          ? `${cleanName} (${sideName})`
          : `Hiện trường kiểm tra vị trí ${chosenStt} (${sideName})`;

        nextImages.push({
          id: `img_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          stt: chosenStt,
          side: chosenSide,
          caption,
          dataUrl,
          filename: file.name,
        });
      }

      nextImages.sort((a, b) => a.stt - b.stt || (a.side === 'ST' ? -1 : 1));
      onChange(nextImages);
    } catch (e) {
      console.error('Error handling files upload:', e);
    } finally {
      setIsConverting(false);
      setConvertingMessage('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleProcessMultipleFiles(e.dataTransfer.files);
    }
  };

  const handleUpdateCaption = (id: string, caption: string) => {
    const nextImages = images.map((img) => (img.id === id ? { ...img, caption } : img));
    onChange(nextImages);
  };

  const handleToggleSide = (id: string) => {
    const nextImages = images.map((img) => {
      if (img.id === id) {
        const nextSide: 'ST' | 'MR' = img.side === 'ST' ? 'MR' : 'ST';
        const nextSideName = nextSide === 'ST' ? 'NMTĐ Ialy' : 'NMTĐ Ialy MR';
        return {
          ...img,
          side: nextSide,
          caption: img.caption.includes('(')
            ? img.caption.replace(/\(NMTĐ Ialy.*?\)/, `(${nextSideName})`)
            : `${img.caption} (${nextSideName})`,
        };
      }
      return img;
    });
    nextImages.sort((a, b) => a.stt - b.stt || (a.side === 'ST' ? -1 : 1));
    onChange(nextImages);
  };

  const handleUpdateStt = (id: string, newStt: number) => {
    if (newStt < 1) return;
    const nextImages = images.map((img) => (img.id === id ? { ...img, stt: newStt } : img));
    nextImages.sort((a, b) => a.stt - b.stt || (a.side === 'ST' ? -1 : 1));
    onChange(nextImages);
  };

  const handleDeleteImage = (id: string) => {
    const nextImages = images.filter((img) => img.id !== id);
    onChange(nextImages);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs" id="images">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              5. Phụ lục: Các hình ảnh kiểm tra thực tế ({images.length} ảnh)
            </h2>
            <p className="text-xs text-slate-500">
              Hỗ trợ kéo thả nhiều ảnh cùng lúc, tự động ghép đôi NMTĐ Ialy và Ialy Mở Rộng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {images.length > 0 && (
            showClearConfirm ? (
              <div className="flex items-center gap-1.5 p-1 bg-red-50 border border-red-200 rounded-lg text-xs animate-in fade-in duration-150">
                <span className="text-red-700 font-semibold px-1">Xóa toàn bộ {images.length} ảnh?</span>
                <button
                  type="button"
                  onClick={() => {
                    onChange([]);
                    setShowClearConfirm(false);
                  }}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-[11px] transition shadow-2xs"
                >
                  Đồng ý xóa
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] transition"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition"
              >
                Xóa tất cả ảnh
              </button>
            )
          )}
        </div>
      </div>

      {/* Converting notification */}
      {isConverting && (
        <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs font-medium text-blue-800 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
          <span>{convertingMessage || 'Đang xử lý hình ảnh...'}</span>
        </div>
      )}

      {/* Modern Multi-File Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-6 border-2 border-dashed rounded-2xl text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">
            Kéo thả nhiều ảnh vào đây, hoặc{' '}
            <label className="text-blue-600 hover:underline cursor-pointer">
              bấm để chọn ảnh từ máy
              <input
                type="file"
                multiple
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => handleProcessMultipleFiles(e.target.files || [])}
              />
            </label>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Chọn cùng lúc nhiều file ảnh (JPG, PNG, HEIC iPhone). Hệ thống tự động nén dung lượng và ghép theo cặp STT.
          </p>
        </div>
      </div>

      {/* Compact Image Gallery with dedicated Caption Input for each image */}
      {images.length > 0 ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pb-1">
            <span>Danh sách ảnh đã tải lên ({images.length} ảnh) — Nhập chú thích trực tiếp dưới từng hình:</span>
            <span className="text-slate-400 font-normal text-[11px]">Bấm vào thẻ nhà máy để đổi giữa Ialy & Ialy MR</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img) => {
              const isST = img.side === 'ST';

              return (
                <div
                  key={img.id}
                  className="bg-slate-50 border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs flex flex-col hover:border-slate-300 transition"
                >
                  {/* Image Preview thumbnail with actions */}
                  <div className="relative h-44 bg-slate-900/5 group flex items-center justify-center overflow-hidden">
                    {img.dataUrl ? (
                      <img
                        src={img.dataUrl}
                        alt={img.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}

                    {/* Top overlay badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                        Vị trí #{img.stt}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleSide(img.id)}
                        title="Bấm để đổi giữa Ialy Thường và Ialy Mở Rộng"
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold shadow-xs transition flex items-center gap-1 ${
                          isST
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        <Building2 className="w-3 h-3" />
                        <span>{isST ? 'NMTĐ Ialy' : 'NMTĐ Ialy MR'}</span>
                      </button>
                    </div>

                    {/* Action buttons on image */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {img.dataUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewModalUrl(img.dataUrl)}
                          title="Xem phóng to ảnh"
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        title="Xóa ảnh này"
                        className="p-1.5 rounded-lg bg-red-600/90 hover:bg-red-700 text-white backdrop-blur-xs transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Caption & Position Controls */}
                  <div className="p-3 bg-white flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Chú thích hình ảnh:</span>
                        <div className="flex items-center gap-1 text-slate-500 font-normal">
                          <span>Cặp số:</span>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={img.stt}
                            onChange={(e) => handleUpdateStt(img.id, parseInt(e.target.value, 10) || 1)}
                            className="w-10 px-1 py-0.5 text-center text-xs border border-slate-200 rounded font-bold"
                          />
                        </div>
                      </label>
                      <input
                        type="text"
                        value={img.caption}
                        onChange={(e) => handleUpdateCaption(img.id, e.target.value)}
                        placeholder="Nhập chú thích hiện trường kiểm tra..."
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500 border border-slate-100">
          Chưa có hình ảnh hiện trường nào được tải lên cho biên bản tháng này.
        </div>
      )}

      {/* Image Preview Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewModalUrl} alt="Phóng to" className="max-w-full max-h-[85vh] object-contain mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};
