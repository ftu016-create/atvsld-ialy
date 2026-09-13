import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { ReportData } from '../types';

export const DEFAULT_ADMIN_PIN = 'ialy2026';

export const firebaseConfig = {
  projectId: "disco-velocity-91ttq",
  appId: "1:1023774001112:web:2809f9ddec418d22e494ad",
  apiKey: "AIzaSyACeL2wmOoH5BFN0QPNOa-LU2Vur36pMrc",
  authDomain: "disco-velocity-91ttq.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-remixatvsldrepor-188c401c-590d-4e3f-928d-af22e1660072",
  storageBucket: "disco-velocity-91ttq.firebasestorage.app",
  messagingSenderId: "1023774001112",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Kiểm tra kết nối Firestore lúc khởi động
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'app_settings', 'system_config'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or checking connection.');
    }
  }
}
testConnection();

/**
 * Lấy mã PIN Admin được đồng bộ từ Firestore.
 * Nếu chưa có hoặc mất mạng, tự động dùng mã lưu trong bộ nhớ máy / mã mặc định.
 */
export async function getSharedAdminPin(): Promise<string> {
  try {
    const docRef = doc(db, 'app_settings', 'system_config');
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.adminPin) {
      const pin = snap.data().adminPin as string;
      try {
        localStorage.setItem('atvsld_admin_pin_v1', pin);
      } catch (_) {}
      return pin;
    }
  } catch (err) {
    console.warn('Chưa lấy được PIN từ Firestore, dùng bộ nhớ cục bộ:', err);
  }
  return localStorage.getItem('atvsld_admin_pin_v1') || DEFAULT_ADMIN_PIN;
}

/**
 * Cập nhật mã PIN Admin đồng bộ lên đám mây Firestore cho tất cả các máy.
 */
export async function setSharedAdminPin(newPin: string): Promise<void> {
  try {
    localStorage.setItem('atvsld_admin_pin_v1', newPin);
  } catch (_) {}

  try {
    const docRef = doc(db, 'app_settings', 'system_config');
    await setDoc(
      docRef,
      {
        adminPin: newPin,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Lỗi khi lưu mã PIN lên Firestore:', err);
    throw err;
  }
}

/**
 * Lắng nghe thay đổi mã PIN Admin theo thời gian thực (real-time)
 */
export function subscribeToSharedAdminPin(onPinChange: (pin: string) => void): () => void {
  try {
    const docRef = doc(db, 'app_settings', 'system_config');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists() && snap.data()?.adminPin) {
          const pin = snap.data().adminPin as string;
          try {
            localStorage.setItem('atvsld_admin_pin_v1', pin);
          } catch (_) {}
          onPinChange(pin);
        }
      },
      (err) => {
        console.warn('Lỗi kết nối theo dõi mã PIN:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Không thể khởi tạo theo dõi mã PIN:', err);
    return () => {};
  }
}

/**
 * Tải toàn bộ danh sách biên bản từ đám mây dùng chung
 */
export async function fetchAllSharedReports(): Promise<ReportData[] | null> {
  try {
    const colRef = collection(db, 'reports');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const reports: ReportData[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.dataJson) {
          try {
            const r = JSON.parse(data.dataJson);
            reports.push(r);
          } catch (_) {}
        }
      });
      if (reports.length > 0) {
        return reports;
      }
    }
  } catch (err) {
    console.warn('Lỗi lấy danh sách báo cáo từ Firestore:', err);
  }
  return null;
}

/**
 * Lưu hoặc cập nhật biên bản lên Firestore cho các máy khác cùng thấy
 */
export async function saveReportToFirestore(report: ReportData): Promise<void> {
  try {
    const docRef = doc(db, 'reports', report.id);
    await setDoc(
      docRef,
      {
        id: report.id,
        month: report.thang_nam,
        reportDate: report.ngay,
        dataJson: JSON.stringify(report),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Lỗi đồng bộ báo cáo lên Firestore:', err);
  }
}

/**
 * Xóa biên bản trên Firestore
 */
export async function deleteReportFromFirestore(reportId: string): Promise<void> {
  try {
    const docRef = doc(db, 'reports', reportId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Lỗi xóa báo cáo trên Firestore:', err);
  }
}
