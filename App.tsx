import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Save, 
  RotateCcw, 
  Eye, 
  Sparkles, 
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cloud
} from 'lucide-react';
import { ReportData } from './types';
import { createNewReport, DEFAULT_GROUPS, DEFAULT_MEMBERS, DEFAULT_RECOMMENDATIONS } from './data/defaultData';
import { generateAndDownloadDocx } from './utils/docxGenerator';
import { Header } from './components/Header';
import { ReportMetaForm } from './components/ReportMetaForm';
import { MembersManager } from './components/MembersManager';
import { InspectionTableEditor } from './components/InspectionTableEditor';
import { RecommendationsEditor } from './components/RecommendationsEditor';
import { ImagesManager } from './components/ImagesManager';
import { LiveDocumentPreview } from './components/LiveDocumentPreview';
import { HistoryModal } from './components/HistoryModal';
import { VercelDeployModal } from './components/VercelDeployModal';
import { JsonBackupModal } from './components/JsonBackupModal';

const STORAGE_KEY = 'atvsld_ialy_reports_v2';
const CURRENT_REPORT_KEY = 'atvsld_ialy_current_v2';

export default function App() {
  const [report, setReport] = useState<ReportData>(() => {
    try {
      const savedCurrent = localStorage.getItem(CURRENT_REPORT_KEY);
      if (savedCurrent) {
        return JSON.parse(savedCurrent);
      }
    } catch (e) {
      console.error('Failed to load initial report from localStorage', e);
    }
    return createNewReport('07/2026');
  });

  const [reportsHistory, setReportsHistory] = useState<ReportData[]>(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        return JSON.parse(savedHistory);
      }
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isVercelGuideOpen, setIsVercelGuideOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

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
    setReport((prev) => ({
      ...prev,
      [field]: value,
      updated_at: new Date().toLocaleString('vi-VN'),
    }));
  };

  const handleSaveReport = () => {
    setIsSaving(true);
    const updated = {
      ...report,
      updated_at: new Date().toLocaleString('vi-VN'),
    };
    setReport(updated);

    // Save to history list
    const existingIdx = reportsHistory.findIndex((r) => r.id === updated.id);
    let nextHistory = [...reportsHistory];
    if (existingIdx >= 0) {
      nextHistory[existingIdx] = updated;
    } else {
      nextHistory.unshift(updated);
    }
    setReportsHistory(nextHistory);

    setTimeout(() => {
      setIsSaving(false);
      showToast(`Đã lưu biên bản tháng ${updated.thang_nam} vào kho lưu trữ!`, 'success');
    }, 400);
  };

  const handleNewReport = () => {
    if (window.confirm('Bạn có muốn tạo một biên bản ATVSLĐ mới hoàn toàn không?')) {
      const fresh = createNewReport();
      setReport(fresh);
      showToast('Đã khởi tạo biên bản ATVSLĐ mới.', 'info');
    }
  };

  const handleSelectFromHistory = (selected: ReportData) => {
    setReport(selected);
    setIsHistoryOpen(false);
    showToast(`Đã mở biên bản tháng ${selected.thang_nam}.`, 'info');
  };

  const handleDuplicateReport = (source: ReportData) => {
    const clone: ReportData = {
      ...JSON.parse(JSON.stringify(source)),
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toLocaleString('vi-VN'),
      updated_at: new Date().toLocaleString('vi-VN'),
    };
    setReport(clone);
    setReportsHistory([clone, ...reportsHistory]);
    setIsHistoryOpen(false);
    showToast(`Đã nhân bản biên bản sang bản sao mới!`, 'success');
  };

  const handleDeleteReport = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa biên bản này khỏi kho lưu trữ?')) {
      const next = reportsHistory.filter((r) => r.id !== id);
      setReportsHistory(next);
      showToast('Đã xóa biên bản.', 'info');
    }
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

  const handleImportReports = (imported: ReportData[]) => {
    if (imported.length === 1) {
      setReport(imported[0]);
    }
    const combined = [...imported, ...reportsHistory.filter((h) => !imported.some((i) => i.id === h.id))];
    setReportsHistory(combined);
    showToast(`Đã nhập thành công ${imported.length} biên bản từ file JSON!`, 'success');
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
        onSave={handleSaveReport}
        onNew={handleNewReport}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenVercelGuide={() => setIsVercelGuideOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onExportDocx={() => handleExportDocx(report)}
        isSaving={isSaving}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'preview' ? (
          <LiveDocumentPreview
            report={report}
            onExportDocx={() => handleExportDocx(report)}
          />
        ) : (
          <div className="space-y-6">
            {/* Quick Helper Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Cloud className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h2 className="font-bold text-sm sm:text-base">
                    Hệ thống soạn thảo & xuất Biên bản ATVSLĐ Tháng {report.thang_nam}
                  </h2>
                  <p className="text-xs text-blue-100">
                    Phân xưởng Vận hành • NMTĐ Ialy & NMTĐ Ialy Mở Rộng • Sẵn sàng chạy trên Vercel
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold backdrop-blur transition flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem bản in A4</span>
                </button>
                <button
                  onClick={() => handleExportDocx(report)}
                  className="px-4 py-1.5 bg-white text-blue-800 hover:bg-blue-50 rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất file Word</span>
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
                <p>Nhấn "Lưu" để lưu vào kho hoặc "Xuất Word" để tải file .docx chuẩn thể thức EVN.</p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={handleSaveReport}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-slate-600" />
                  <span>Lưu vào hệ thống</span>
                </button>

                <button
                  onClick={() => handleExportDocx(report)}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file Word (.docx)</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>Hệ thống Biên bản ATVSLĐ Công ty Thủy điện Ialy • Phân xưởng Vận hành</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsVercelGuideOpen(true)}
              className="text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              <Cloud className="w-3.5 h-3.5" />
              Hướng dẫn Deploy Vercel
            </button>
            <span>•</span>
            <button
              onClick={() => setIsBackupOpen(true)}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Sao lưu JSON
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        reports={reportsHistory}
        currentReportId={report.id}
        onSelectReport={handleSelectFromHistory}
        onDuplicateReport={handleDuplicateReport}
        onDeleteReport={handleDeleteReport}
        onExportDocx={handleExportDocx}
      />

      <VercelDeployModal
        isOpen={isVercelGuideOpen}
        onClose={() => setIsVercelGuideOpen(false)}
      />

      <JsonBackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        currentReport={report}
        allReports={reportsHistory}
        onImportReports={handleImportReports}
      />

    </div>
  );
}
