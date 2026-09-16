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
  ArrowLeftRight,
  Building2,
  HardHat
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

  // Tải 1 ảnh cho vị trí & bên cụ thể (chú thích tự động lấy theo tên file ảnh)
  const handleSingleUpload = async (file: File, stt: number, side: 'ST' | 'MR') => {
    const dataUrl = await processImageFile(file);
    const captionFromFilename = cleanCaptionFromFilename(file.name);

    const nextImages = [...images];
    const existingIdx = nextImages.findIndex((img) => img.stt === stt && img.side === side);

    if (existingIdx >= 0) {
      nextImages[existingIdx] = {
        ...nextImages[existingIdx],
        dataUrl,
        filename: file.name,
        caption: captionFromFilename || nextImages[existingIdx].caption,
      };
    } else {
      nextImages.push({
        id: `img_${Date.now()}_${stt}_${side}`,
        stt,
        side,
        caption: captionFromFilename,
        dataUrl,
        filename: file.name,
      });
    }

    nextImages.sort((a, b) => a.stt - b.stt || (a.side === 'ST' ? -1 : 1));
    onChange(nextImages);
  };

  // Tải hàng loạt ảnh dành riêng cho 1 bên (ST: NMTĐ Ialy hoặc MR: NMTĐ Ialy Mở Rộng)
  const handleSideBulkUpload = async (files: FileList | null, side: 'ST' | 'MR') => {
    if (!files || files.length === 0) return;

    const sideName = side === 'ST' ? 'NMTĐ Ialy' : 'NMTĐ Ialy Mở Rộng';
    setIsConverting(true);
    setConvertingMessage(`Đang tải ${files.length} ảnh ${sideName}...`);

    try {
      const sideExisting = images.filter((x) => x.side === side && x.dataUrl);
      let currentMaxStt = sideExisting.length > 0 ? Math.max(...sideExisting.map((x) => Number(x.stt) || 0)) : 0;

      const otherSideImages = images.filter((x) => x.side !== side);
      const currentSideKept = images.filter((x) => x.side === side && x.dataUrl);

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
      combined.sort((a, b) => a.stt - b.stt || (a.side === 'ST' ? -1 : 1));
      onChange(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setIsConverting(false);
      setConvertingMessage('');
    }
  };

  // Cập nhật chú thích người dùng gõ
  const handleUpdateCaption = (stt: number, side: 'ST' | 'MR', caption: string) => {
    const nextImages = [...images];
    const targetIdx = nextImages.findIndex((img) => img.stt === stt && img.side === side);
    if (targetIdx >= 0) {
      nextImages[targetIdx] = { ...nextImages[targetIdx], caption };
      onChange(nextImages);
    } else {
      nextImages.push({
        id: `img_${Date.now()}_${stt}_${side}`,
        stt,
        side,
        caption,
        dataUrl: '',
        filename: '',
      });
      onChange(nextImages);
    }
  };

  // Chuyển 1 ảnh từ bên này sang bên kia (NMTĐ Ialy <-> NMTĐ Ialy Mở Rộng)
  const handleSwitchSide = (targetImg: ReportImage) => {
    const newSide: 'ST' | 'MR' = targetImg.side === 'ST' ? 'MR' : 'ST';
    const targetSideImages = images.filter((img) => img.side === newSide && img.id !== targetImg.id && img.dataUrl);
    const newStt = targetSideImages.length > 0 ? Math.max(...targetSideImages.map((x) => Number(x.stt) || 0)) + 1 : 1;

    const nextImages = images.map((img) => {
      if (img.id === targetImg.id) {
        return {
          ...img,
          side: newSide,
          stt: newStt,
        };
      }
      return img;
    });

    // Re-index remaining of old side
    const oldSideImages = nextImages.filter((img) => img.side === targetImg.side).sort((a, b) => a.stt - b.stt);
    oldSideImages.forEach((img, idx) => {
      img.stt = idx + 1;
    });

    nextImages.sort((a, b) => a.stt - b.stt || (a.side === 'ST' ? -1 : 1));
    onChange(nextImages);
  };

  // Thêm một cặp dòng kiểm tra mới
  const handleAddImageRow = () => {
    const maxStt = images.length > 0 ? Math.max(...images.map((img) => Number(img.stt) || 0)) + 1 : 1;
    const newItems: ReportImage[] = [
      ...images,
      {
        id: `img_${Date.now()}_st`,
        stt: maxStt,
        side: 'ST',
        caption: '',
        dataUrl: '',
        filename: '',
      },
      {
        id: `img_${Date.now()}_mr`,
        stt: maxStt,
        side: 'MR',
        caption: '',
        dataUrl: '',
        filename: '',
      },
    ];
    onChange(newItems);
  };

  // Xóa ảnh cụ thể
  const handleRemoveSingleImage = (id: string) => {
    const target = images.find((x) => x.id === id);
    if (!target) return;

    const remaining = images.filter((x) => x.id !== id);
    const sideImages = remaining.filter((x) => x.side === target.side).sort((a, b) => a.stt - b.stt);
    sideImages.forEach((img, idx) => {
      img.stt = idx + 1;
    });

    onChange(remaining);
  };

  // Xóa cặp dòng STT
  const handleRemoveImageRow = (sttToRemove: number) => {
    const remaining = images.filter((img) => img.stt !== sttToRemove);
    const uniqueStts = (Array.from(new Set(remaining.map((img) => Number(img.stt)))) as number[]).sort((a, b) => a - b);
    
    const sttMap: Record<number, number> = {};
    uniqueStts.forEach((oldStt, index) => {
      sttMap[oldStt] = index + 1;
    });

    const renumbered = remaining.map((img) => ({
      ...img,
      stt: sttMap[img.stt] || img.stt,
    }));

    onChange(renumbered);
  };

  // Danh sách STT duy nhất để hiển thị
  const allSttList: number[] = (Array.from(new Set(images.map((x) => Number(x.stt) || 0))) as number[])
    .filter((x) => x > 0)
    .sort((a, b) => a - b);
  if (allSttList.length === 0) {
    allSttList.push(1, 2, 3);
  }

  // Component hiển thị ô ảnh đơn (Gọn gàng, không có chữ thừa)
  const renderImageCard = (img: ReportImage | undefined, stt: number, side: 'ST' | 'MR') => {
    const isST = side === 'ST';
    const sideTitle = isST ? 'NMTĐ Ialy' : 'NMTĐ Ialy Mở Rộng';

    return (
      <div className={`p-3 rounded-xl border ${isST ? 'bg-white border-blue-200' : 'bg-white border-amber-200'} shadow-2xs space-y-2 flex flex-col justify-between`}>
        <div className="space-y-2">
          {/* Tiêu đề ngắn gọn */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-md ${isST ? 'bg-blue-600' : 'bg-amber-600'} text-white font-bold text-[11px] flex items-center justify-center`}>
                {stt}
              </span>
              <span className={`text-xs font-bold ${isST ? 'text-blue-900' : 'text-amber-950'}`}>
                {sideTitle}
              </span>
            </div>

            {img?.dataUrl && (
              <button
                type="button"
                onClick={() => handleSwitchSide(img)}
                className="text-[10px] font-medium px-2 py-0.5 rounded border text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100 transition flex items-center gap-1"
                title={isST ? 'Chuyển sang bên Ialy Mở Rộng' : 'Chuyển sang bên NMTĐ Ialy'}
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>{isST ? 'Sang Ialy MR' : 'Sang Ialy'}</span>
              </button>
            )}
          </div>

          {/* Ô nhập chú thích - Không dùng nhãn dài dòng */}
          <input
            type="text"
            value={img?.caption || ''}
            onChange={(e) => handleUpdateCaption(stt, side, e.target.value)}
            placeholder={`Chú thích ${sideTitle}...`}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden font-medium"
          />
        </div>

        {/* Khung ảnh hoặc khung chọn ảnh */}
        <div>
          {img?.dataUrl ? (
            <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 mt-1">
              <img
                src={img.dataUrl}
                alt={img.caption || sideTitle}
                className="w-full h-44 object-cover"
              />
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalUrl(img.dataUrl)}
                  className="px-2.5 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-medium shadow-xs flex items-center gap-1 hover:bg-slate-100"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Xem to
                </button>
                <label className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Đổi ảnh
                  <input
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleSingleUpload(f, stt, side);
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleRemoveSingleImage(img.id)}
                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs shadow-xs"
                  title="Xóa ảnh này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <label className={`border-2 border-dashed ${isST ? 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/20' : 'border-amber-200 hover:border-amber-400 hover:bg-amber-50/20'} rounded-lg p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 mt-1`}>
              <div className={`w-8 h-8 rounded-full ${isST ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'} flex items-center justify-center`}>
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">
                Chọn ảnh {sideTitle} #{stt}
              </span>
              <input
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSingleUpload(f, stt, side);
                }}
              />
            </label>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs" id="images">
      {/* Tiêu đề & Các nút tải chính */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Camera className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            5. Phụ lục: Các hình ảnh kiểm tra thực tế
          </h2>
        </div>

        {/* 3 nút thao tác tinh gọn, không dư thừa */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tải ảnh bên NMTĐ Ialy */}
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer shadow-2xs">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>+ Tải ảnh NMTĐ Ialy</span>
            <input
              type="file"
              multiple
              accept="image/*,.heic,.heif"
              className="hidden"
              onChange={(e) => handleSideBulkUpload(e.target.files, 'ST')}
            />
          </label>

          {/* Tải ảnh bên NMTĐ Ialy Mở Rộng */}
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer shadow-2xs">
            <HardHat className="w-4 h-4 text-amber-600" />
            <span>+ Tải ảnh Ialy Mở Rộng</span>
            <input
              type="file"
              multiple
              accept="image/*,.heic,.heif"
              className="hidden"
              onChange={(e) => handleSideBulkUpload(e.target.files, 'MR')}
            />
          </label>

          {/* Nút thêm 1 dòng trống */}
          <button
            type="button"
            onClick={handleAddImageRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm dòng</span>
          </button>
        </div>
      </div>

      {/* Loading khi xử lý ảnh HEIC / iPhone */}
      {isConverting && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs font-medium text-blue-800 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>{convertingMessage || 'Đang xử lý ảnh...'}</span>
        </div>
      )}

      {/* Danh sách các cặp ảnh song song: Cột trái Ialy - Cột phải Ialy MR */}
      <div className="space-y-3">
        {allSttList.map((stt) => {
          const imgST = images.find((x) => x.stt === stt && x.side === 'ST');
          const imgMR = images.find((x) => x.stt === stt && x.side === 'MR');

          return (
            <div
              key={stt}
              data-stt={stt}
              className="p-3 bg-slate-50/70 border border-slate-200 rounded-2xl"
            >
              {/* Header hàng */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-slate-700 text-white font-bold text-[11px] flex items-center justify-center">
                    {stt}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Vị trí {stt}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveImageRow(stt)}
                  className="text-[11px] font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 rounded transition flex items-center gap-1"
                  title="Xóa hàng này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa hàng</span>
                </button>
              </div>

              {/* 2 Cột song song: Trái NMTĐ Ialy, Phải Ialy Mở Rộng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderImageCard(imgST, stt, 'ST')}
                {renderImageCard(imgMR, stt, 'MR')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal phóng to ảnh */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800">Xem ảnh</span>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
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
