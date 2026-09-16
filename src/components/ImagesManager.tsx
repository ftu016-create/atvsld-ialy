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
  ArrowRight,
  ArrowLeft,
  Building2,
  HardHat,
  ChevronUp,
  ChevronDown,
  Columns,
  Eye,
  CheckCircle2
} from 'lucide-react';
import heic2any from 'heic2any';
import { ReportImage } from '../types';

interface ImagesManagerProps {
  images: ReportImage[];
  onChange: (images: ReportImage[]) => void;
}

/**
 * Lấy nội dung chú thích tự động từ tên file ảnh,
 * loại bỏ phần đuôi mở rộng (.jpg, .png, .heic,...)
 */
export const cleanCaptionFromFilename = (filename: string): string => {
  if (!filename) return '';
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  return withoutExt.trim();
};

export const ImagesManager: React.FC<ImagesManagerProps> = ({ images, onChange }) => {
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [convertingMessage, setConvertingMessage] = useState<string>('');
  
  // Tab hiển thị: 'both' (song song 2 bên) | 'ST' (chỉ Ialy) | 'MR' (chỉ Ialy MR)
  const [activeViewTab, setActiveViewTab] = useState<'both' | 'ST' | 'MR'>('both');

  // Lọc danh sách ảnh theo từng nhà máy
  const ialyImages = images
    .filter((img) => img.side === 'ST')
    .sort((a, b) => (Number(a.stt) || 0) - (Number(b.stt) || 0));

  const imrImages = images
    .filter((img) => img.side === 'MR')
    .sort((a, b) => (Number(a.stt) || 0) - (Number(b.stt) || 0));

  // Xử lý nén ảnh & chuyển đổi định dạng HEIC iPhone sang JPEG
  const processImageFile = async (file: File): Promise<string> => {
    let sourceBlob: Blob = file;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isHeic = ['heic', 'heif'].includes(ext) || ['image/heic', 'image/heif'].includes(file.type);

    if (isHeic) {
      try {
        setIsConverting(true);
        setConvertingMessage(`Đang xử lý ảnh iPhone: ${file.name}...`);
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

  // Tải hàng loạt ảnh dành riêng cho 1 bên (ST: Ialy hoặc MR: IMR)
  const handleBulkUploadForSide = async (files: FileList | null, side: 'ST' | 'MR') => {
    if (!files || files.length === 0) return;

    const sideName = side === 'ST' ? 'NMTĐ Ialy' : 'NMTĐ Ialy Mở Rộng (IMR)';
    setIsConverting(true);
    setConvertingMessage(`Đang tải ${files.length} ảnh cho ${sideName}...`);

    try {
      const otherSideImages = images.filter((x) => x.side !== side);
      const currentSideKept = images.filter((x) => x.side === side && x.dataUrl);
      const currentMaxStt = currentSideKept.length > 0 ? Math.max(...currentSideKept.map((x) => Number(x.stt) || 0)) : 0;

      const newlyAdded: ReportImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await processImageFile(file);
        const stt = currentMaxStt + i + 1;
        const caption = cleanCaptionFromFilename(file.name);

        newlyAdded.push({
          id: `img_${Date.now()}_${side}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          stt,
          side,
          caption,
          dataUrl,
          filename: file.name,
        });
      }

      const combined = [...otherSideImages, ...currentSideKept, ...newlyAdded];
      // Chuẩn hóa lại STT cho bên được thêm
      const reindexed = reindexSide(combined, side);
      onChange(reindexed);
    } catch (e) {
      console.error(e);
    } finally {
      setIsConverting(false);
      setConvertingMessage('');
    }
  };

  // Tải đè 1 ảnh đơn vào vị trí cụ thể
  const handleSingleReplaceUpload = async (file: File, imageId: string, side: 'ST' | 'MR') => {
    const dataUrl = await processImageFile(file);
    const captionFromFilename = cleanCaptionFromFilename(file.name);

    const nextImages = images.map((img) => {
      if (img.id === imageId) {
        return {
          ...img,
          dataUrl,
          filename: file.name,
          caption: img.caption || captionFromFilename,
        };
      }
      return img;
    });

    onChange(nextImages);
  };

  // Cập nhật chú thích ảnh
  const handleUpdateCaption = (imageId: string, caption: string) => {
    const nextImages = images.map((img) => {
      if (img.id === imageId) {
        return { ...img, caption };
      }
      return img;
    });
    onChange(nextImages);
  };

  // Thêm 1 vị trí ảnh trống cho 1 bên
  const handleAddEmptySlot = (side: 'ST' | 'MR') => {
    const sideImages = images.filter((x) => x.side === side);
    const newStt = sideImages.length + 1;
    const newImage: ReportImage = {
      id: `img_${Date.now()}_${side}_empty`,
      stt: newStt,
      side,
      caption: '',
      dataUrl: '',
      filename: '',
    };
    onChange([...images, newImage]);
  };

  // Chuẩn hóa lại số thứ tự (1, 2, 3...) cho một bên
  const reindexSide = (list: ReportImage[], side: 'ST' | 'MR'): ReportImage[] => {
    const sideItems = list.filter((x) => x.side === side).sort((a, b) => (Number(a.stt) || 0) - (Number(b.stt) || 0));
    sideItems.forEach((item, index) => {
      item.stt = index + 1;
    });
    const otherItems = list.filter((x) => x.side !== side);
    return [...otherItems, ...sideItems];
  };

  // Xóa 1 ảnh
  const handleRemoveImage = (imageId: string) => {
    const target = images.find((x) => x.id === imageId);
    if (!target) return;

    const remaining = images.filter((x) => x.id !== imageId);
    const reindexed = reindexSide(remaining, target.side);
    onChange(reindexed);
  };

  // Đổi thứ tự ảnh lên/xuống (Move up / down) trong cùng 1 bên
  const handleMoveImage = (imageId: string, direction: 'up' | 'down') => {
    const target = images.find((x) => x.id === imageId);
    if (!target) return;

    const side = target.side;
    const sideItems = images.filter((x) => x.side === side).sort((a, b) => (Number(a.stt) || 0) - (Number(b.stt) || 0));
    const currentIndex = sideItems.findIndex((x) => x.id === imageId);

    if (direction === 'up' && currentIndex > 0) {
      const prev = sideItems[currentIndex - 1];
      const tempStt = target.stt;
      target.stt = prev.stt;
      prev.stt = tempStt;
    } else if (direction === 'down' && currentIndex < sideItems.length - 1) {
      const next = sideItems[currentIndex + 1];
      const tempStt = target.stt;
      target.stt = next.stt;
      next.stt = tempStt;
    }

    const otherItems = images.filter((x) => x.side !== side);
    const combined = [...otherItems, ...sideItems];
    onChange(reindexSide(combined, side));
  };

  // Chuyển ảnh từ bên này sang bên kia (Ialy <-> IMR)
  const handleSwitchSide = (imageId: string) => {
    const target = images.find((x) => x.id === imageId);
    if (!target) return;

    const oldSide = target.side;
    const newSide: 'ST' | 'MR' = oldSide === 'ST' ? 'MR' : 'ST';

    // Tìm stt mới bên đích
    const targetSideImages = images.filter((x) => x.side === newSide);
    const newStt = targetSideImages.length + 1;

    const updated = images.map((img) => {
      if (img.id === imageId) {
        return {
          ...img,
          side: newSide,
          stt: newStt,
        };
      }
      return img;
    });

    // Chuẩn hóa lại cả 2 bên
    const step1 = reindexSide(updated, oldSide);
    const step2 = reindexSide(step1, newSide);
    onChange(step2);
  };

  // Render thẻ ảnh đơn lẻ cho 1 bên
  const renderImageCard = (img: ReportImage, index: number, totalInSide: number) => {
    const isST = img.side === 'ST';
    const sideTitle = isST ? 'NMTĐ Ialy' : 'IMR';

    return (
      <div 
        key={img.id}
        className={`p-3.5 rounded-xl border ${
          isST 
            ? 'bg-white border-blue-200/90 shadow-2xs hover:border-blue-400' 
            : 'bg-white border-amber-200/90 shadow-2xs hover:border-amber-400'
        } transition space-y-2.5 flex flex-col justify-between`}
      >
        {/* Header thẻ: Vị trí STT, nút lên/xuống, nút chuyển bên, nút xóa */}
        <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-md ${
              isST ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
            } font-bold text-xs shadow-2xs`}>
              Vị trí #{img.stt}
            </span>
            <span className={`text-[11px] font-semibold ${isST ? 'text-blue-900' : 'text-amber-900'}`}>
              {sideTitle}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Nút di chuyển vị trí lên / xuống */}
            <button
              type="button"
              disabled={index === 0}
              onClick={() => handleMoveImage(img.id, 'up')}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Đổi lên trên"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={index === totalInSide - 1}
              onClick={() => handleMoveImage(img.id, 'down')}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Đổi xuống dưới"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Nút chuyển sang nhà máy bên kia */}
            <button
              type="button"
              onClick={() => handleSwitchSide(img.id)}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition flex items-center gap-1 ${
                isST 
                  ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200' 
                  : 'text-blue-800 bg-blue-50 hover:bg-blue-100 border-blue-200'
              }`}
              title={isST ? 'Chuyển ảnh này sang bên Ialy Mở Rộng (IMR)' : 'Chuyển ảnh này sang bên NMTĐ Ialy'}
            >
              {isST ? (
                <>
                  <span>Sang IMR</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              ) : (
                <>
                  <ArrowLeft className="w-3 h-3" />
                  <span>Sang Ialy</span>
                </>
              )}
            </button>

            {/* Nút xóa ảnh */}
            <button
              type="button"
              onClick={() => handleRemoveImage(img.id)}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
              title="Xóa ảnh này"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Khung ảnh hiện trường */}
        <div>
          {img.dataUrl ? (
            <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={img.dataUrl}
                alt={img.caption || `Vị trí #${img.stt}`}
                className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 backdrop-blur-2xs">
                <button
                  type="button"
                  onClick={() => setPreviewModalUrl(img.dataUrl)}
                  className="px-2.5 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 hover:bg-slate-100"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Xem to
                </button>
                <label className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Đổi ảnh
                  <input
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleSingleReplaceUpload(f, img.id, img.side);
                    }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <label className={`border-2 border-dashed ${
              isST ? 'border-blue-200 hover:border-blue-400 bg-blue-50/20' : 'border-amber-200 hover:border-amber-400 bg-amber-50/20'
            } rounded-lg p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5`}>
              <div className={`w-8 h-8 rounded-full ${isST ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center`}>
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">
                Bấm để chọn ảnh Vị trí #{img.stt}
              </span>
              <span className="text-[11px] text-slate-400">
                (JPG, PNG, HEIC iPhone)
              </span>
              <input
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSingleReplaceUpload(f, img.id, img.side);
                }}
              />
            </label>
          )}
        </div>

        {/* Ô nhập chú thích trực tiếp dưới ảnh */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Chú thích hiện trường vị trí #{img.stt}:
          </label>
          <input
            type="text"
            value={img.caption || ''}
            onChange={(e) => handleUpdateCaption(img.id, e.target.value)}
            placeholder={`Ví dụ: Cao trình 327m (${sideTitle})...`}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden font-medium transition"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs" id="images">
      {/* Tiêu đề & Bộ chuyển chế độ xem */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>3. Phụ lục: Ảnh hiện trường kiểm tra</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Tổng cộng: {images.filter(x => x.dataUrl).length} ảnh
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Được chia thành 2 bên riêng biệt: <strong>NMTĐ Ialy</strong> và <strong>NMTĐ Ialy Mở Rộng (IMR)</strong> để thêm hình nhanh và tiện quản lý.
            </p>
          </div>
        </div>

        {/* Tab chuyển đổi chế độ xem nhanh */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveViewTab('both')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeViewTab === 'both'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-blue-600" />
            <span>2 bên song song</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('ST')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeViewTab === 'ST'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>NMTĐ Ialy ({ialyImages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('MR')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeViewTab === 'MR'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Ialy MR ({imrImages.length})</span>
          </button>
        </div>
      </div>

      {/* Thông báo tiến trình khi đang xử lý ảnh iPhone / HEIC */}
      {isConverting && (
        <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-blue-800 animate-pulse shadow-2xs">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>{convertingMessage || 'Đang xử lý nén và định dạng ảnh...'}</span>
        </div>
      )}

      {/* KHU VỰC 2 BÊN RIÊNG BIỆT */}
      <div className={`grid gap-6 ${
        activeViewTab === 'both' 
          ? 'grid-cols-1 lg:grid-cols-2' 
          : 'grid-cols-1'
      }`}>

        {/* ==================== CỘT 1: NMTĐ IALY ==================== */}
        {(activeViewTab === 'both' || activeViewTab === 'ST') && (
          <div className="bg-blue-50/40 rounded-2xl p-4 sm:p-5 border border-blue-200 flex flex-col justify-between">
            <div>
              {/* Header Cột Ialy */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-blue-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                      <span>Bên 1: NMTĐ Ialy</span>
                      <span className="text-[11px] px-2 py-0.2 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        {ialyImages.length} ảnh
                      </span>
                    </h3>
                    <p className="text-[11px] text-blue-700">Các vị trí kiểm tra tại Nhà máy Thủy điện Ialy</p>
                  </div>
                </div>

                {/* Nút tải ảnh hàng loạt bên Ialy */}
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Tải ảnh Ialy</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={(e) => handleBulkUploadForSide(e.target.files, 'ST')}
                  />
                </label>
              </div>

              {/* Danh sách ảnh bên Ialy */}
              {ialyImages.length === 0 ? (
                <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center bg-white/60 my-2">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-blue-900">Chưa có ảnh nào cho NMTĐ Ialy</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Bấm nút <strong>"+ Tải ảnh Ialy"</strong> ở trên để chọn cùng lúc nhiều ảnh từ máy tính hoặc điện thoại.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {ialyImages.map((img, idx) => renderImageCard(img, idx, ialyImages.length))}
                </div>
              )}
            </div>

            {/* Nút thêm ô trống phía dưới cột Ialy */}
            <button
              type="button"
              onClick={() => handleAddEmptySlot('ST')}
              className="w-full mt-2 py-2 px-3 border border-dashed border-blue-300 hover:border-blue-500 rounded-xl text-xs font-semibold text-blue-700 bg-white/80 hover:bg-blue-50/80 transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Thêm 1 vị trí ảnh mới cho NMTĐ Ialy</span>
            </button>
          </div>
        )}

        {/* ==================== CỘT 2: NMTĐ IALY MỞ RỘNG (IMR) ==================== */}
        {(activeViewTab === 'both' || activeViewTab === 'MR') && (
          <div className="bg-amber-50/40 rounded-2xl p-4 sm:p-5 border border-amber-200 flex flex-col justify-between">
            <div>
              {/* Header Cột IMR */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-amber-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <HardHat className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                      <span>Bên 2: NMTĐ Ialy Mở Rộng (IMR)</span>
                      <span className="text-[11px] px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 font-semibold">
                        {imrImages.length} ảnh
                      </span>
                    </h3>
                    <p className="text-[11px] text-amber-800">Các vị trí kiểm tra tại công trường Nhà máy Ialy MR</p>
                  </div>
                </div>

                {/* Nút tải ảnh hàng loạt bên IMR */}
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Tải ảnh Ialy MR</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={(e) => handleBulkUploadForSide(e.target.files, 'MR')}
                  />
                </label>
              </div>

              {/* Danh sách ảnh bên IMR */}
              {imrImages.length === 0 ? (
                <div className="border-2 border-dashed border-amber-200 rounded-xl p-8 text-center bg-white/60 my-2">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
                    <HardHat className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-amber-900">Chưa có ảnh nào cho Ialy Mở Rộng (IMR)</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Bấm nút <strong>"+ Tải ảnh Ialy MR"</strong> ở trên để chọn cùng lúc nhiều ảnh từ máy tính hoặc điện thoại.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {imrImages.map((img, idx) => renderImageCard(img, idx, imrImages.length))}
                </div>
              )}
            </div>

            {/* Nút thêm ô trống phía dưới cột IMR */}
            <button
              type="button"
              onClick={() => handleAddEmptySlot('MR')}
              className="w-full mt-2 py-2 px-3 border border-dashed border-amber-300 hover:border-amber-500 rounded-xl text-xs font-semibold text-amber-800 bg-white/80 hover:bg-amber-50/80 transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Thêm 1 vị trí ảnh mới cho Ialy MR</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal phóng to ảnh */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-fadeIn backdrop-blur-2xs">
          <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-slate-50">
              <span className="text-sm font-bold text-slate-800">Chi tiết hình ảnh hiện trường</span>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-950">
              <img
                src={previewModalUrl}
                alt="Preview"
                className="max-h-[75vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
