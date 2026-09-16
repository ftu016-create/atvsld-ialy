import React from 'react';
import { 
  FileText, 
  Download, 
  Save, 
  PlusCircle, 
  History, 
  Cloud, 
  Database,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { ReportData } from '../types';

interface HeaderProps {
  report: ReportData;
  onSave: () => void;
  onNew: () => void;
  onOpenHistory: () => void;
  onOpenVercelGuide: () => void;
  onOpenBackup: () => void;
  onExportDocx: () => void;
  isSaving: boolean;
  activeTab: 'edit' | 'preview';
  setActiveTab: (tab: 'edit' | 'preview') => void;
}

export const Header: React.FC<HeaderProps> = ({
  report,
  onSave,
  onNew,
  onOpenHistory,
  onOpenVercelGuide,
  onOpenBackup,
  onExportDocx,
  isSaving,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-bold text-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight tracking-tight">
                    Biên Bản ATVSLĐ
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Cloud className="w-3 h-3 text-emerald-600" />
                    Vercel Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Công ty Thủy điện Ialy • Phân xưởng Vận hành
                </p>
              </div>
            </div>

            {/* Mobile View Toggle */}
            <div className="flex md:hidden bg-slate-100 p-0.5 rounded-lg">
              <button
                id="btn-mobile-edit-tab"
                onClick={() => setActiveTab('edit')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  activeTab === 'edit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Soạn thảo
              </button>
              <button
                id="btn-mobile-preview-tab"
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  activeTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Xem trước
              </button>
            </div>
          </div>

          {/* Center Tab Switcher (Desktop) */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              id="btn-desktop-edit-tab"
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'edit' 
                  ? 'bg-white text-blue-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Soạn thảo biểu mẫu
            </button>
            <button
              id="btn-desktop-preview-tab"
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'preview' 
                  ? 'bg-white text-blue-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Xem trước bản in A4
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 justify-end">
            <button
              id="btn-header-new-report"
              onClick={onNew}
              title="Tạo biên bản tháng mới"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Biên bản mới</span>
            </button>

            <button
              id="btn-header-history"
              onClick={onOpenHistory}
              title="Xem lịch sử các biên bản đã lưu"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition whitespace-nowrap"
            >
              <History className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Kho lưu trữ</span>
            </button>

            <button
              id="btn-header-backup"
              onClick={onOpenBackup}
              title="Sao lưu hoặc nạp file JSON"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition whitespace-nowrap"
            >
              <Database className="w-4 h-4 text-slate-600" />
              <span className="hidden lg:inline">Sao lưu</span>
            </button>

            <button
              id="btn-header-vercel"
              onClick={onOpenVercelGuide}
              title="Xem hướng dẫn triển khai lên Vercel"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-lg transition shadow-xs whitespace-nowrap"
            >
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>Deploy Vercel</span>
            </button>

            <button
              id="btn-header-save"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition whitespace-nowrap"
            >
              {isSaving ? (
                <CheckCircle2 className="w-4 h-4 text-blue-600 animate-pulse" />
              ) : (
                <Save className="w-4 h-4 text-blue-600" />
              )}
              <span>{isSaving ? 'Đang lưu...' : 'Lưu'}</span>
            </button>

            <button
              id="btn-header-export-docx"
              onClick={onExportDocx}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm shadow-blue-500/25 transition whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Word (.docx)</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
