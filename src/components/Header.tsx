import React from 'react';
import { 
  FileText, 
  Download, 
  Save, 
  PlusCircle, 
  History, 
  CheckCircle2,
  Lock,
  ShieldCheck,
  LogOut,
  KeyRound,
  Eye,
  Edit3,
  Calendar,
  Printer
} from 'lucide-react';
import { ReportData, UserRole, ViewTab } from '../types';

interface HeaderProps {
  report: ReportData;
  reportsList?: ReportData[];
  onSelectReport?: (report: ReportData) => void;
  userRole: UserRole;
  onSave: () => void;
  onNew: () => void;
  onOpenHistoryModal: () => void;
  onOpenVercelGuide?: () => void;
  onOpenBackup?: () => void;
  onExportDocx: () => void;
  onOpenAdminAuth: () => void;
  onLogoutAdmin: () => void;
  onPrint?: () => void;
  isSaving: boolean;
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  report,
  reportsList,
  onSelectReport,
  userRole,
  onSave,
  onNew,
  onOpenHistoryModal,
  onExportDocx,
  onOpenAdminAuth,
  onLogoutAdmin,
  onPrint,
  isSaving,
  activeTab,
  setActiveTab,
}) => {
  const isAdmin = userRole === 'admin';

  const handleTabClick = (tab: ViewTab) => {
    if (tab === 'edit' && !isAdmin) {
      onOpenAdminAuth();
      return;
    }
    setActiveTab(tab);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-2.5 gap-2.5">
          
          {/* Logo & Title & Role Indicator */}
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
                  
                  {/* Show current month badge ONLY when viewing or editing a specific report */}
                  {activeTab !== 'history' && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Tháng {report.thang_nam}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium tracking-tight">
                  VHIALY  •  Công ty Thủy điện Ialy
                </p>
              </div>
            </div>

            {/* Mobile View Toggle */}
            <div className="flex md:hidden bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                id="btn-mobile-history-tab"
                onClick={() => setActiveTab('history')}
                className={`px-2 py-1 font-medium rounded-md transition ${
                  activeTab === 'history' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Lịch sử
              </button>
              <button
                id="btn-mobile-preview-tab"
                onClick={() => setActiveTab('preview')}
                className={`px-2 py-1 font-medium rounded-md transition ${
                  activeTab === 'preview' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Xem chi tiết
              </button>
              {isAdmin && (
                <button
                  id="btn-mobile-edit-tab"
                  onClick={() => handleTabClick('edit')}
                  className={`px-2 py-1 font-medium rounded-md transition flex items-center gap-1 ${
                    activeTab === 'edit' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Edit3 className="w-3 h-3 text-blue-600" />
                  <span>Soạn thảo</span>
                </button>
              )}
            </div>
          </div>

          {/* Center Tab Switcher (Desktop) */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              id="btn-desktop-history-tab"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'history' 
                  ? 'bg-white text-blue-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử các tháng</span>
            </button>

            <button
              id="btn-desktop-preview-tab"
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'preview' 
                  ? 'bg-white text-blue-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem văn bản chi tiết</span>
            </button>

            {isAdmin && (
              <button
                id="btn-desktop-edit-tab"
                onClick={() => handleTabClick('edit')}
                title="Vào giao diện soạn thảo & sửa đổi"
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'edit' 
                    ? 'bg-white text-blue-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Soạn thảo biểu mẫu</span>
              </button>
            )}
          </div>

          {/* Right Action Bar with User Role & Functional Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 justify-end">
            
            {/* Role Switcher Pill */}
            {isAdmin ? (
              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 py-1 px-2.5 rounded-xl">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Quyền:</span> Admin
                </span>
                <button
                  id="btn-header-logout-admin"
                  onClick={onLogoutAdmin}
                  title="Thoát quyền Admin (Chuyển sang chế độ Đồng nghiệp)"
                  className="ml-1.5 text-[11px] text-emerald-700 hover:text-red-600 underline font-medium flex items-center gap-0.5"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Thoát</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-header-login-admin"
                onClick={onOpenAdminAuth}
                title="Đăng nhập tài khoản Quản trị viên để soạn thảo và chỉnh sửa biên bản"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition whitespace-nowrap"
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Đăng nhập</span> Admin
              </button>
            )}

            {/* Admin-Only New Report */}
            {isAdmin && (
              <button
                id="btn-header-new-report"
                onClick={onNew}
                title="Tạo biên bản tháng mới"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden lg:inline">Tạo mới</span>
              </button>
            )}

            {/* Admin-Only Save Button: only shown when editing */}
            {isAdmin && activeTab === 'edit' && (
              <button
                id="btn-header-save"
                onClick={onSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition whitespace-nowrap"
              >
                {isSaving ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{isSaving ? 'Lưu...' : 'Lưu'}</span>
              </button>
            )}

            {/* Actions: Print / PDF & Export Word (.docx) */}
            {activeTab !== 'history' && (
              <>
                <button
                  id="btn-header-print-pdf"
                  onClick={onPrint || (() => window.print())}
                  title={`In hoặc Lưu PDF (khổ A4 Ngang) cho biên bản Tháng ${report.thang_nam}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">In / Xuất PDF</span>
                  <span className="sm:hidden">In PDF</span>
                </button>

                <button
                  id="btn-header-export-docx"
                  onClick={onExportDocx}
                  title={`Xuất file Word (.docx) cho biên bản Tháng ${report.thang_nam}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm shadow-blue-500/25 transition whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Word</span>
                </button>
              </>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
