import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Save, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Lock, 
  ShieldCheck, 
  PlusCircle
} from 'lucide-react';
import { ReportData, UserRole, ViewTab } from './types';
import { 
  createNewReport, 
  createInitialReportsList,
  DEFAULT_GROUPS, 
  DEFAULT_MEMBERS, 
  DEFAULT_RECOMMENDATIONS 
} from './data/defaultData';
import { 
  createAutomatedNewReport, 
  exportBackupToJson, 
  importBackupFromJson,
  sanitizeReportGroups
} from './utils/reportAutomation';
import { generateAndDownloadDocx } from './utils/docxGenerator';
import { Header } from './components/Header';
import { ReportMetaForm } from './components/ReportMetaForm';
import { MembersManager } from './components/MembersManager';
import { InspectionTableEditor } from './components/InspectionTableEditor';
import { RecommendationsEditor } from './components/RecommendationsEditor';
import { ImagesManager } from './components/ImagesManager';
import { LiveDocumentPreview } from './components/LiveDocumentPreview';
import { HistoryModal } from './components/HistoryModal';
import { HistoryPage } from './components/HistoryPage';
import { AdminAuthModal } from './components/AdminAuthModal';
import { NewReportModal } from './components/NewReportModal';
import { SignatureModal } from './components/SignatureModal';
import { DeleteReportModal } from './components/DeleteReportModal';
import { 
  fetchAllSharedReports, 
  saveReportToFirestore, 
  deleteReportFromFirestore,
  subscribeToSharedAdminPin
} from './lib/firebase';

const STORAGE_KEY = 'atvsld_ialy_reports_v2';
const CURRENT_REPORT_KEY = 'atvsld_ialy_current_v2';
const USER_ROLE_KEY = 'atvsld_user_role_v1';

export default function App() {
  // User role: 'admin' (can edit/save/create) or 'colleague' (view only)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(USER_ROLE_KEY);
      if (saved === 'admin' || saved === 'colleague') {
        return saved;
      }
    } catch (e) {
      console.error('Failed to load user role', e);
    }
    return 'colleague';
  });

  // History of reports
  const [reportsHistory, setReportsHistory] = useState<ReportData[]>(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r) => sanitizeReportGroups(r));
        }
      }
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
    }
    return createInitialReportsList().map((r) => sanitizeReportGroups(r));
  });

  // Current report being viewed or edited
  const [report, setReport] = useState<ReportData>(() => {
    try {
      const savedCurrent = localStorage.getItem(CURRENT_REPORT_KEY);
      if (savedCurrent) {
        return sanitizeReportGroups(JSON.parse(savedCurrent));
      }
    } catch (e) {
      console.error('Failed to load initial report from localStorage', e);
    }
    const initialList = createInitialReportsList();
    return sanitizeReportGroups(initialList[0] || createNewReport('08/2026'));
  });

  // Active view: 'history' (Trang lịch sử các tháng) | 'preview' (Xem bản in) | 'edit' (Soạn thảo - Admin only)
  const [activeTab, setActiveTab] = useState<ViewTab>('history');

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modals state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false);
  const [previewSigningMemberIndex, setPreviewSigningMemberIndex] = useState<number | null>(null);
  const [reportToDelete, setReportToDelete] = useState<ReportData | null>(null);

  // Auto-repair and sync with Firestore
  useEffect(() => {
    setReport((curr) => sanitizeReportGroups(curr));

    fetchAllSharedReports().then((remoteReports) => {
      if (remoteReports && remoteReports.length > 0) {
        setReportsHistory(remoteReports.map((r) => sanitizeReportGroups(r)));
      } else {
        try {
          const initial = createInitialReportsList().map((r) => sanitizeReportGroups(r));
          setReportsHistory(initial);
          initial.forEach((item) => saveReportToFirestore(item));
        } catch (_) {}
      }
    });

    const unsubPin = subscribeToSharedAdminPin((newPin) => {
      console.log('Mã PIN Admin được đồng bộ mới từ Firestore:', newPin);
    });

    return () => {
      unsubPin();
    };
  }, []);

  // Sync userRole to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USER_ROLE_KEY, userRole);
    } catch (e) {
      console.error('Failed to save user role', e);
    }
  }, [userRole]);

  // Auto-save current working draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_REPORT_KEY, JSON.stringify(report));
    } catch (e) {
      console.error('Storage quota exceeded or error saving draft', e);
    }
  }, [report]);

  // Sync reportsHistory to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reportsHistory));
    } catch (e) {
      console.error('Failed to save history to localStorage', e);
    }
  }, [reportsHistory]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleUpdateField = (field: keyof ReportData, value: any) => {
    if (userRole !== 'admin') {
      showToast('Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa dữ liệu!', 'error');
      setIsAdminAuthOpen(true);
      return;
    }
    setReport((prev) => ({
      ...prev,
      [field]: value,
      updated_at: new Date().toLocaleString('vi-VN'),
    }));
  };

  const handleSaveReport = () => {
    if (userRole !== 'admin') {
      showToast('Chỉ Quản trị viên (Admin) mới có quyền lưu biên bản!', 'error');
      setIsAdminAuthOpen(true);
      return;
    }

    setIsSaving(true);
    const updated = {
      ...report,
      updated_at: new Date().toLocaleString('vi-VN'),
    };
    setReport(updated);

    const existingIdx = reportsHistory.findIndex((r) => r.id === updated.id);
    let nextHistory = [...reportsHistory];
    if (existingIdx >= 0) {
      nextHistory[existingIdx] = updated;
    } else {
      nextHistory.unshift(updated);
    }
    setReportsHistory(nextHistory);

    saveReportToFirestore(updated);

    setTimeout(() => {
      setIsSaving(false);
      showToast(`Đã lưu biên bản tháng ${updated.thang_nam} vào kho lưu trữ!`, 'success');
    }, 400);
  };

  const handleNewReport = () => {
    if (userRole !== 'admin') {
      showToast('Chỉ Quản trị viên (Admin) mới có quyền tạo biên bản mới! Mời nhập mật khẩu Admin.', 'error');
      setIsAdminAuthOpen(true);
      return;
    }
    setIsNewReportModalOpen(true);
  };

  const handleConfirmCreateReport = (newReport: ReportData, transferredCount: number) => {
    setReport(newReport);
    setReportsHistory([newReport, ...reportsHistory]);
    saveReportToFirestore(newReport);
    setActiveTab('edit');
    if (transferredCount > 0) {
      showToast(`Đã tạo Tháng ${newReport.thang_nam} và tự động chuyển tiếp ${transferredCount} tồn tại sang Mục 7!`, 'success');
    } else {
      showToast(`Đã tạo biên bản tự động Tháng ${newReport.thang_nam} (Số ${newReport.so_van_ban}/VHIALY)!`, 'success');
    }
  };

  const handleSavePreviewSignature = (memberIndex: number, signatureDataUrl: string) => {
    const nextMembers = [...report.members];
    if (nextMembers[memberIndex]) {
      nextMembers[memberIndex] = {
        ...nextMembers[memberIndex],
        signatureUrl: signatureDataUrl,
      };
      handleUpdateField('members', nextMembers);
      showToast(`Đã lưu chữ ký cho ${nextMembers[memberIndex].name}!`, 'success');
    }
    setPreviewSigningMemberIndex(null);
  };

  const handleRemovePreviewSignature = (memberIndex: number) => {
    const nextMembers = [...report.members];
    if (nextMembers[memberIndex]) {
      nextMembers[memberIndex] = {
        ...nextMembers[memberIndex],
        signatureUrl: undefined,
      };
      handleUpdateField('members', nextMembers);
      showToast(`Đã xóa chữ ký của ${nextMembers[memberIndex].name}!`, 'info');
    }
    setPreviewSigningMemberIndex(null);
  };

  const handleExportBackup = () => {
    try {
      exportBackupToJson(reportsHistory);
      showToast(`Đã xuất file sao lưu (${reportsHistory.length} biên bản) thành công!`, 'success');
    } catch {
      showToast('Lỗi khi xuất dữ liệu sao lưu!', 'error');
    }
  };

  const handleImportBackup = async (file: File) => {
    if (userRole !== 'admin') {
      showToast('Chỉ Quản trị viên (Admin) mới có quyền nhập và phục hồi dữ liệu!', 'error');
      setIsAdminAuthOpen(true);
      return;
    }

    try {
      showToast('Đang đọc và kiểm tra file sao lưu...', 'info');
      const imported = await importBackupFromJson(file);
      
      const merged = [...reportsHistory];
      let addedCount = 0;
      let updatedCount = 0;

      imported.forEach((incoming) => {
        const idx = merged.findIndex((m) => m.id === incoming.id || m.thang_nam === incoming.thang_nam);
        if (idx >= 0) {
          merged[idx] = incoming;
          updatedCount++;
        } else {
          merged.unshift(incoming);
          addedCount++;
        }
      });

      setReportsHistory(merged);
      if (imported.length > 0) {
        setReport(imported[0]);
      }
      showToast(`Phục hồi thành công! Đã thêm ${addedCount} biên bản mới và cập nhật ${updatedCount} biên bản.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi nhập file sao lưu!', 'error');
    }
  };

  const handlePrintReport = () => {
    if (activeTab === 'edit') {
      setActiveTab('preview');
      setTimeout(() => {
        window.print();
      }, 350);
    } else {
      window.print();
    }
  };

  const handleSelectFromHistory = (selected: ReportData) => {
    setReport(selected);
    setIsHistoryModalOpen(false);
    if (userRole === 'admin') {
      setActiveTab('edit');
      showToast(`Đã mở biên bản tháng ${selected.thang_nam} để chỉnh sửa.`, 'info');
    } else {
      setActiveTab('preview');
      showToast(`Đang xem biên bản tháng ${selected.thang_nam}.`, 'info');
    }
  };

  const handleViewReportDetails = (target: ReportData) => {
    setReport(target);
    setActiveTab('preview');
    showToast(`Đang xem toàn văn bản biên bản tháng ${target.thang_nam}.`, 'info');
  };

  const handleEditReport = (target: ReportData) => {
    if (userRole !== 'admin') {
      setIsAdminAuthOpen(true);
      return;
    }
    setReport(target);
    setActiveTab('edit');
    showToast(`Đã mở biên bản tháng ${target.thang_nam} để chỉnh sửa.`, 'info');
  };

  const handleDuplicateReport = (source: ReportData) => {
    if (userRole !== 'admin') {
      showToast('Chỉ Quản trị viên (Admin) mới có quyền nhân bản biên bản!', 'error');
      setIsAdminAuthOpen(true);
      return;
    }

    const clone: ReportData = {
      ...JSON.parse(JSON.stringify(source)),
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toLocaleString('vi-VN'),
      updated_at: new Date().toLocaleString('vi-VN'),
    };
    setReport(clone);
    setReportsHistory([clone, ...reportsHistory]);
    saveReportToFirestore(clone);
    setIsHistoryModalOpen(false);
    setActiveTab('edit');
    showToast(`Đã nhân bản biên bản sang bản sao mới để soạn thảo!`, 'success');
  };

  const handleDeleteReport = (id: string) => {
    if (userRole !== 'admin') {
      showToast('Chỉ Quản trị viên (Admin) mới có quyền xóa biên bản! Mời nhập mã PIN Admin.', 'error');
      setIsAdminAuthOpen(true);
      return;
    }

    const target = reportsHistory.find((r) => r.id === id);
    if (target) {
      setReportToDelete(target);
    } else {
      showToast('Không tìm thấy biên bản cần xóa.', 'error');
    }
  };

  const handleConfirmDeleteReport = (id: string) => {
    const target = reportsHistory.find((r) => r.id === id);
    const next = reportsHistory.filter((r) => r.id !== id);
    setReportsHistory(next);
    deleteReportFromFirestore(id);

    if (report.id === id) {
      if (next.length > 0) {
        setReport(next[0]);
      } else {
        const fresh = createNewReport('07/2026');
        setReport(fresh);
        setReportsHistory([fresh]);
      }
    }

    showToast(`Đã xóa biên bản Tháng ${target?.thang_nam || ''} thành công!`, 'info');
    setReportToDelete(null);
  };

  const handleExportDocx = async (targetReport?: ReportData) => {
    const docData = targetReport || report;
    try {
      showToast('Đang tạo và đóng gói file Word (.docx)...', 'info');
      await generateAndDownloadDocx(docData);
      showToast(`Đã xuất file Word tháng ${docData.thang_nam} thành công!`, 'success');
    } catch (err: any) {
      console.error('Export docx error', err);
      showToast(`Lỗi khi xuất Word: ${err?.message || 'Vui lòng kiểm tra lại ảnh'}`, 'error');
    }
  };

  const handleAdminAuthSuccess = () => {
    setUserRole('admin');
    setIsAdminAuthOpen(false);
    showToast('Chào mừng Quản trị viên! Bạn đã được cấp quyền soạn thảo và chỉnh sửa.', 'success');
  };

  const handleLogoutAdmin = () => {
    setUserRole('colleague');
    if (activeTab === 'edit') {
      setActiveTab('history');
    }
    showToast('Đã chuyển về chế độ Đồng nghiệp (Chỉ xem).', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-white ${
              toastMessage.type === 'error'
                ? 'bg-red-600 border-red-700'
                : toastMessage.type === 'info'
                ? 'bg-slate-900 border-slate-800'
                : 'bg-emerald-600 border-emerald-700'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Header
        report={report}
        reportsList={reportsHistory}
        onSelectReport={(target) => {
          setReport(target);
          showToast(`Đã chọn biên bản Tháng ${target.thang_nam}`, 'info');
        }}
        userRole={userRole}
        onSave={handleSaveReport}
        onNew={handleNewReport}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onExportDocx={() => handleExportDocx(report)}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        onPrint={handlePrintReport}
        isSaving={isSaving}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: TRANG LỊCH SỬ CÁC THÁNG */}
        {activeTab === 'history' && (
          <HistoryPage
            reports={reportsHistory}
            currentReportId={report.id}
            userRole={userRole}
            onViewReport={handleViewReportDetails}
            onSelectReport={(target) => {
              setReport(target);
              showToast(`Đã chọn biên bản Tháng ${target.thang_nam}`, 'info');
            }}
            onEditReport={handleEditReport}
            onDuplicateReport={handleDuplicateReport}
            onDeleteReport={handleDeleteReport}
            onExportDocx={handleExportDocx}
            onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
            onCreateNewReport={handleNewReport}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}

        {/* VIEW 2: XEM VĂN BẢN CHI TIẾT (Khổ A4 chuẩn) */}
        {activeTab === 'preview' && (
          <LiveDocumentPreview
            report={report}
            onExportDocx={() => handleExportDocx(report)}
            onBackToHistory={() => setActiveTab('history')}
            onEditThisReport={() => {
              if (userRole === 'admin') {
                setActiveTab('edit');
              } else {
                setIsAdminAuthOpen(true);
              }
            }}
            isAdmin={userRole === 'admin'}
            onSignMember={(idx) => setPreviewSigningMemberIndex(idx)}
          />
        )}

        {/* VIEW 3: SOẠN THẢO BIỂU MẪU (Chỉ dành riêng cho Admin) */}
        {activeTab === 'edit' && (
          userRole === 'admin' ? (
            <div className="space-y-6">
              {/* Quick Helper Banner */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-emerald-300" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm sm:text-base flex items-center gap-2">
                      <span>Soạn thảo Biên bản ATVSLĐ Tháng {report.thang_nam}</span>
                      <span className="text-[11px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded font-semibold border border-emerald-400/40">
                        Admin Mode
                      </span>
                    </h2>
                    <p className="text-xs text-blue-100 font-medium">
                      VHIALY • Công ty Thủy điện Ialy • Soạn thảo & Xuất Word chuẩn EVN
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setActiveTab('history')}
                    className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold backdrop-blur transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <History className="w-4 h-4" />
                    <span>Lịch sử các tháng</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold backdrop-blur transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Xem văn bản A4</span>
                  </button>
                  <button
                    onClick={() => handleExportDocx(report)}
                    className="px-4 py-1.5 bg-white text-blue-800 hover:bg-blue-50 rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất Word</span>
                  </button>
                </div>
              </div>

              {/* Step 1: General Info */}
              <ReportMetaForm
                report={report}
                onChange={handleUpdateField}
              />

              {/* Step 2: Members */}
              <MembersManager
                members={report.members}
                onChange={(members) => handleUpdateField('members', members)}
              />

              {/* Step 3: Inspection Criteria Table (16 Groups) */}
              <InspectionTableEditor
                groups={report.groups}
                onChange={(groups) => handleUpdateField('groups', groups)}
              />

              {/* Step 4: Recommendations & Conclusion */}
              <RecommendationsEditor
                recommendations={report.recommendations}
                onChange={(recommendations) => handleUpdateField('recommendations', recommendations)}
              />

              {/* Step 5: Field Photos (Appendix) */}
              <ImagesManager
                images={report.images}
                onChange={(images) => handleUpdateField('images', images)}
              />

              {/* Bottom Export Bar */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  <p className="font-semibold text-slate-800">Hoàn thành soạn thảo biên bản?</p>
                  <p>Nhấn "Lưu vào hệ thống" để cập nhật kho lưu trữ hoặc "Tải file Word" để in ấn, trình ký.</p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleSaveReport}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-slate-600" />
                    <span>Lưu vào hệ thống</span>
                  </button>

                  <button
                    onClick={() => handleExportDocx(report)}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải file Word (.docx)</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Khu vực dành cho Quản trị viên
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn đang truy cập ở vai trò <strong>Đồng nghiệp (Chỉ xem)</strong>. Chỉ có cán bộ Quản trị viên (Admin) được phân công mới có quyền soạn thảo, chỉnh sửa hoặc thay đổi nội dung biên bản.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab('history')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Quay lại xem lịch sử
                </button>
                <button
                  onClick={() => setIsAdminAuthOpen(true)}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Đăng nhập Admin</span>
                </button>
              </div>
            </div>
          )
        )}

      </main>

      {/* Modals */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        reports={reportsHistory}
        currentReportId={report.id}
        userRole={userRole}
        onSelectReport={handleSelectFromHistory}
        onViewReport={(item) => {
          setReport(item);
          setActiveTab('preview');
          setIsHistoryModalOpen(false);
        }}
        onDuplicateReport={handleDuplicateReport}
        onDeleteReport={handleDeleteReport}
        onExportDocx={handleExportDocx}
      />

      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      <NewReportModal
        isOpen={isNewReportModalOpen}
        onClose={() => setIsNewReportModalOpen(false)}
        latestReport={reportsHistory.length > 0 ? reportsHistory[0] : report}
        onConfirmCreate={handleConfirmCreateReport}
      />

      <SignatureModal
        isOpen={previewSigningMemberIndex !== null}
        onClose={() => setPreviewSigningMemberIndex(null)}
        member={previewSigningMemberIndex !== null ? report.members[previewSigningMemberIndex] : null}
        memberIndex={previewSigningMemberIndex}
        onSaveSignature={handleSavePreviewSignature}
        onRemoveSignature={handleRemovePreviewSignature}
      />

      <DeleteReportModal
        isOpen={!!reportToDelete}
        report={reportToDelete}
        onClose={() => setReportToDelete(null)}
        onConfirmDelete={handleConfirmDeleteReport}
      />

    </div>
  );
}
