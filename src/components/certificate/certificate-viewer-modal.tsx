'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ApiCertificate } from '@/types/certificate';
import {
  downloadCertificateFile,
  downloadRichCertificatePdf,
  getDirectPdfViewerUrl,
  formatCertificateStudentName,
  printCertificateDocument,
} from '@/lib/certificate-url';

interface CertificateViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: ApiCertificate | null;
  courseTitle?: string;
  studentName?: string;
}

export const CertificateViewerModal: React.FC<CertificateViewerModalProps> = ({
  isOpen,
  onClose,
  certificate,
  courseTitle = 'Khóa học TMdemy',
  studentName,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'pdf'>('visual');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [hasPdfError, setHasPdfError] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !certificate) return null;

  const certUrl = certificate.certificateUrl;
  const isUrlValid = Boolean(
    certUrl && (certUrl.startsWith('http://') || certUrl.startsWith('https://'))
  );
  const certCode = certificate.code || certificate.id;
  const cleanStudentName = formatCertificateStudentName(studentName);
  const formattedDate = certificate.createdAt
    ? new Date(certificate.createdAt).toLocaleDateString('vi-VN')
    : new Date().toLocaleDateString('vi-VN');

  const handlePrint = () => {
    printCertificateDocument({
      certCode,
      studentName: cleanStudentName,
      courseTitle,
      grade: certificate.grade,
      issuedDate: formattedDate,
    });
  };

  const directPdfViewerUrl = getDirectPdfViewerUrl(certUrl, certCode);

  const handleDownload = async () => {
    try {
      setIsGeneratingPdf(true);
      const diplomaEl = document.getElementById('certificate-diploma-card');
      await downloadRichCertificatePdf(
        {
          certCode,
          studentName: cleanStudentName,
          courseTitle,
          grade: certificate.grade,
          issuedDate: formattedDate,
        },
        diplomaEl
      );
    } catch {
      if (isUrlValid) {
        downloadCertificateFile(certUrl, `Certificate_${certCode}`);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenExternal = () => {
    if (!isUrlValid) return;
    window.open(directPdfViewerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#1a1528] rounded-2xl shadow-2xl border border-zinc-200 dark:border-[#2f2742] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-[#2f2742] bg-zinc-50 dark:bg-[#201930] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                Chứng Chỉ Tốt Nghiệp — {courseTitle}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
                <span>
                  Mã: <code className="font-mono text-primary font-bold">{certCode}</code>
                </span>
                <span>•</span>
                <span>
                  Điểm: <strong className="text-emerald-600 dark:text-emerald-400">{certificate.grade}%</strong>
                </span>
                <span>•</span>
                <span>Học viên: <strong className="text-zinc-800 dark:text-zinc-200">{cleanStudentName}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/certificates/verify/${encodeURIComponent(certCode)}`}
              target="_blank"
              title="Mở trang tra cứu xác thực công khai"
              className="px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[17px]">verified_user</span>
              <span className="hidden lg:inline">Xác thực</span>
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              title="In chứng chỉ hoặc Lưu dưới dạng PDF chuẩn A4"
              className="px-3.5 py-2 rounded-xl bg-primary hover:bg-[#8b5ad3] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>In / Lưu PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isGeneratingPdf}
              title="Tải tệp PDF sắc nét đầy đủ thông tin về máy tính"
              className="px-3.5 py-2 rounded-xl bg-primary hover:bg-[#8b5ad3] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isGeneratingPdf ? 'hourglass_top' : 'download'}
              </span>
              <span>{isGeneratingPdf ? 'Đang tạo PDF...' : 'Tải PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenExternal}
              disabled={!isUrlValid}
              title="Mở liên kết tệp gốc trên Cloudinary"
              className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-[#2f2742] hover:bg-zinc-100 dark:hover:bg-[#282136] disabled:opacity-50 text-zinc-700 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              <span className="hidden md:inline">Bản gốc</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="w-9 h-9 rounded-xl hover:bg-zinc-200 dark:hover:bg-[#282136] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Tab switch bar */}
        <div className="flex items-center gap-2 px-5 py-2 bg-zinc-100/80 dark:bg-[#151121] border-b border-zinc-200 dark:border-[#2f2742]">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'visual'
                ? 'bg-white dark:bg-[#251e36] text-primary shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
            <span>Bản chứng chỉ điện tử</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'pdf'
                ? 'bg-white dark:bg-[#251e36] text-primary shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            <span>Tệp PDF máy chủ</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative flex-1 min-h-[460px] max-h-[68vh] overflow-y-auto bg-zinc-100 dark:bg-[#120e1c] p-4 sm:p-6 flex items-center justify-center">
          {activeTab === 'visual' ? (
            /* Visual Diploma View */
            <div
              id="certificate-diploma-card"
              className="w-full max-w-3xl bg-white dark:bg-[#1c162b] rounded-xl shadow-xl border-4 border-amber-600/30 p-6 sm:p-10 relative overflow-hidden text-center"
            >
              {/* Outer decorative borders */}
              <div className="absolute inset-2 border border-amber-500/20 rounded-lg pointer-events-none" />
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-600/60" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-600/60" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-600/60" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-600/60" />

              {/* Academy Header */}
              <div className="mb-6">
                <p className="text-xs sm:text-sm font-black tracking-widest text-[#1e1b4b] dark:text-amber-400 uppercase">
                  HỌC VIỆN ĐÀO TẠO TRỰC TUYẾN TMDEMY
                </p>
                <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 tracking-wider mt-0.5">
                  TMDEMY E-LEARNING ACADEMY • EXCELLENCE IN ONLINE EDUCATION
                </p>
                <div className="w-24 h-0.5 bg-amber-600/50 mx-auto mt-2" />
              </div>

              {/* Certificate Title */}
              <div className="mb-6">
                <h2 className="text-xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                  CHỨNG NHẬN TỐT NGHIỆP
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium tracking-widest uppercase mt-0.5">
                  CERTIFICATE OF COMPLETION
                </p>
              </div>

              {/* Recipient */}
              <div className="mb-5">
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 italic mb-1">
                  Chứng nhận học viên:
                </p>
                <p className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-white border-b-2 border-zinc-200 dark:border-zinc-700/80 inline-block pb-1 px-8">
                  {cleanStudentName}
                </p>
              </div>

              {/* Course Title */}
              <div className="mb-6">
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 italic mb-1">
                  Đã hoàn thành xuất sắc khóa học chuyên sâu:
                </p>
                <p className="text-base sm:text-xl font-bold text-primary dark:text-[#a77df3]">
                  {courseTitle}
                </p>
              </div>

              {/* Metadata Details & QR Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left bg-zinc-50/70 dark:bg-[#231c36]/60 p-4 rounded-xl border border-zinc-200/60 dark:border-[#382f50] mb-8">
                <div className="space-y-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                  <p>
                    <span className="text-zinc-500 dark:text-zinc-400">Điểm tốt nghiệp:</span>{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{certificate.grade}%</strong>
                  </p>
                  <p>
                    <span className="text-zinc-500 dark:text-zinc-400">Ngày cấp:</span>{' '}
                    <strong className="text-zinc-800 dark:text-zinc-200">{formattedDate}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-500 dark:text-zinc-400">Số hiệu:</span>{' '}
                    <code className="font-mono text-primary font-bold">{certCode}</code>
                  </p>
                </div>

                <div className="flex items-center sm:justify-end gap-3">
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Mã xác thực trực tuyến
                    </p>
                    <p className="text-[10px] text-zinc-400">Quét để kiểm tra hợp lệ</p>
                  </div>
                  <div className="w-14 h-14 rounded-lg bg-white p-1 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[36px] text-zinc-800">
                      qr_code_2
                    </span>
                  </div>
                </div>
              </div>

              {/* Signature Section: Hệ thống TMDEMY, Ký TM */}
              <div className="flex justify-end pt-2">
                <div className="text-center w-60">
                  <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                    HỆ THỐNG TMDEMY
                  </p>
                  <div className="py-2.5 flex items-center justify-center">
                    <div className="w-16 h-8 rounded border border-dashed border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-serif font-black text-xs tracking-wider">
                      TMdemy
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                    (Đã xác thực chữ ký số điện tử)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* PDF Server View */
            <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-start relative">
              {/* Notification Banner */}
              <div className="w-full mb-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-start sm:items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0">
                    info
                  </span>
                  <span>
                    Nếu trình duyệt báo <strong>Failed to load PDF document</strong> khi mở Cloudinary, bạn có thể nhấn <strong>In / Lưu PDF</strong> để xuất ngay tệp PDF chuẩn vector A4.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer transition-colors shrink-0 shadow-xs"
                >
                  In / Lưu PDF ngay
                </button>
              </div>

              {!isUrlValid ? (
                <div className="p-8 text-center text-white flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-amber-400 text-[40px]">
                    warning
                  </span>
                  <p className="font-semibold text-sm">
                    Đường dẫn tệp PDF chứng chỉ chưa sẵn sàng.
                  </p>
                </div>
              ) : hasPdfError ? (
                <div className="p-8 text-center text-zinc-900 dark:text-white flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-rose-500 text-[40px]">
                    error
                  </span>
                  <p className="font-semibold text-sm">
                    Không thể hiển thị tệp PDF trực tiếp từ máy chủ Cloudinary.
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
                    Cloudinary yêu cầu quyền phân phối tệp công khai. Bạn có thể sử dụng nút bên dưới để xuất tệp PDF ngay lập tức.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#8b5ad3] cursor-pointer"
                    >
                      In / Lưu PDF chuẩn A4
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenExternal}
                      className="px-4 py-2 rounded-xl bg-zinc-700 text-white text-xs font-semibold hover:bg-zinc-600 cursor-pointer"
                    >
                      Mở liên kết gốc
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-[480px]">
                  {!iframeLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900/90 text-white z-10 rounded-xl">
                      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-xs text-zinc-300">
                        Đang nạp tệp chứng chỉ từ máy chủ TMdemy...
                      </span>
                    </div>
                  )}
                  <iframe
                    src={`${directPdfViewerUrl}#toolbar=1&navpanes=0`}
                    title={`Chứng chỉ ${courseTitle}`}
                    className="w-full h-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white"
                    onLoad={() => setIframeLoaded(true)}
                    onError={() => {
                      setHasPdfError(true);
                      setIframeLoaded(true);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-3 bg-zinc-50 dark:bg-[#201930] border-t border-zinc-200 dark:border-[#2f2742] flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500 text-[18px]">
              verified
            </span>
            <span>
              Chứng chỉ điện tử chính thức được ký số bởi{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">
                Hệ thống Học viện Đào tạo TMdemy
              </strong>
            </span>
          </div>

          <div className="text-[11px] text-zinc-400">
            Ngày cấp: {formattedDate}
          </div>
        </div>
      </div>
    </div>
  );
};
