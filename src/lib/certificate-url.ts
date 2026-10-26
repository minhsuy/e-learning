/**
 * TMDEMY — Certificate URL & Document Utilities
 * Handles CORS-safe downloads, embedded viewers, and high-fidelity print/export for certificates.
 */

export interface PrintCertificateOptions {
  certCode: string;
  studentName: string;
  courseTitle: string;
  grade: number;
  issuedDate: string;
}

/**
 * Transforms a Cloudinary PDF URL to force direct browser file download as an attachment.
 * Uses Cloudinary's native `fl_attachment` URL transformation flag to set:
 * `Content-Disposition: attachment; filename="<filename>.pdf"`
 */
export function getCloudinaryDownloadUrl(url: string, desiredFilename?: string): string {
  if (!url) return '';

  const cleanFilename = (desiredFilename || 'Certificate_TMdemy')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^_+|_+$/g, '');

  if (url.includes('fl_attachment')) {
    return url;
  }

  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/fl_attachment:${cleanFilename}/`);
  }

  return url;
}

/**
 * Returns a reliable embeddable viewer URL for cross-origin PDFs.
 */
export function getGoogleDocsPdfViewerUrl(pdfUrl: string): string {
  if (!pdfUrl) return '';
  return `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
}

/**
 * Returns the secure local API endpoint to download the certificate PDF straight to disk.
 * Bypasses Cloudinary 401 ACL blocks by signing requests server-side.
 */
export function getDirectDownloadUrl(certUrl: string, certCode?: string): string {
  if (!certUrl) return '';
  return `/api/certificates/download?url=${encodeURIComponent(certUrl)}&code=${encodeURIComponent(certCode || 'TMdemy')}`;
}

/**
 * Returns the secure local API endpoint to view the certificate PDF inline in the browser.
 */
export function getDirectPdfViewerUrl(certUrl: string, certCode?: string): string {
  if (!certUrl) return '';
  return `/api/certificates/download?url=${encodeURIComponent(certUrl)}&code=${encodeURIComponent(certCode || 'TMdemy')}&inline=true`;
}

/**
 * Normalizes student display names, replacing test identifiers (e.g. p7student_179...)
 * with human-readable titles.
 */
export function formatCertificateStudentName(name?: string | null): string {
  if (!name || !name.trim()) return 'Học viên TMdemy';
  const trimmed = name.trim();
  if (trimmed.startsWith('p7student_') || /^user_[0-9a-fA-F-]+$/.test(trimmed)) {
    return 'Học viên TMdemy';
  }
  return trimmed;
}

/**
 * Triggers a direct native browser file download of the PDF straight to disk.
 */
export function downloadCertificateFile(url: string, filename?: string): void {
  if (!url) return;
  const downloadUrl = getDirectDownloadUrl(url, filename);

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `${filename || 'Certificate'}.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface Html2PdfChain {
  set: (opt: Record<string, unknown>) => Html2PdfChain;
  from: (element: HTMLElement) => Html2PdfChain;
  save: () => Promise<void>;
  outputPdf: (type: string) => Promise<Blob>;
}

type Html2PdfInstance = (() => Html2PdfChain) & {
  from?: (element: HTMLElement) => Html2PdfChain;
};

let html2pdfPromise: Promise<Html2PdfInstance> | null = null;
function loadHtml2Pdf(): Promise<Html2PdfInstance> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  const win = window as unknown as { html2pdf?: Html2PdfInstance };
  if (win.html2pdf) return Promise.resolve(win.html2pdf);

  if (!html2pdfPromise) {
    html2pdfPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById('html2pdf-cdn-script');
      if (existing) {
        existing.addEventListener('load', () => {
          if (win.html2pdf) resolve(win.html2pdf);
          else reject(new Error('html2pdf missing after load'));
        });
        existing.addEventListener('error', () => reject(new Error('Failed to load html2pdf')));
        return;
      }
      const script = document.createElement('script');
      script.id = 'html2pdf-cdn-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      script.onload = () => {
        if (win.html2pdf) resolve(win.html2pdf);
        else reject(new Error('html2pdf missing after load'));
      };
      script.onerror = () => reject(new Error('Failed to load html2pdf script'));
      document.head.appendChild(script);
    });
  }
  return html2pdfPromise;
}

/**
 * Generates and downloads a rich, full-detail Certificate PDF that matches 100%
 * the visual diploma shown in the 'xem pdf / Bản chứng chỉ điện tử' tab.
 */
export async function downloadRichCertificatePdf(
  options: PrintCertificateOptions,
  sourceElement?: HTMLElement | null
): Promise<void> {
  const { certCode, studentName, courseTitle, grade, issuedDate } = options;
  const cleanCode = certCode.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Certificate_${cleanCode}.pdf`;

  try {
    const html2pdf = await loadHtml2Pdf();

    let targetElement = sourceElement;
    let tempContainer: HTMLElement | null = null;

    if (!targetElement) {
      tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '1000px';
      tempContainer.style.background = '#ffffff';
      tempContainer.innerHTML = `
        <div style="width: 100%; max-width: 980px; background: #ffffff; border: 4px solid #b45309; padding: 36px 48px; position: relative; box-sizing: border-box; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="position: absolute; inset: 8px; border: 1.5px solid #1e1b4b; pointer-events: none;"></div>
          <p style="font-size: 14px; font-weight: 900; letter-spacing: 2.5px; color: #1e1b4b; text-transform: uppercase; margin: 0;">HỌC VIỆN ĐÀO TẠO TRỰC TUYẾN TMDEMY</p>
          <p style="font-size: 10px; color: #6b7280; letter-spacing: 1.5px; margin-top: 4px; text-transform: uppercase;">TMDEMY E-LEARNING ACADEMY • EXCELLENCE IN ONLINE EDUCATION</p>
          <div style="width: 120px; height: 2px; background: #b45309; margin: 12px auto 16px;"></div>

          <h1 style="font-size: 26px; font-weight: 900; color: #b45309; letter-spacing: 1.5px; text-transform: uppercase; margin: 0;">CHỨNG NHẬN TỐT NGHIỆP</h1>
          <p style="font-size: 12px; font-weight: 700; color: #374151; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; margin-bottom: 20px;">CERTIFICATE OF COMPLETION</p>

          <p style="font-size: 13px; color: #6b7280; font-style: italic; margin: 0 0 6px;">Chứng nhận học viên:</p>
          <h2 style="font-size: 24px; font-weight: 800; color: #1e1b4b; border-bottom: 2px solid #e5e7eb; display: inline-block; padding: 0 40px 6px; margin: 0 0 18px;">${studentName}</h2>

          <p style="font-size: 13px; color: #6b7280; font-style: italic; margin: 0 0 6px;">Đã hoàn thành xuất sắc khóa học chuyên sâu:</p>
          <h3 style="font-size: 18px; font-weight: 800; color: #6d28d9; margin: 0 0 24px;">${courseTitle}</h3>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; text-align: left; margin-top: 24px; padding-top: 18px; border-top: 1px dashed #e5e7eb;">
            <div>
              <div style="font-size: 12px; margin-bottom: 6px; color: #374151;">Điểm tốt nghiệp: <strong style="color: #059669; font-weight: 900;">${grade}%</strong></div>
              <div style="font-size: 12px; margin-bottom: 6px; color: #374151;">Ngày cấp chứng chỉ: <strong style="color: #1e1b4b;">${issuedDate}</strong></div>
              <div style="font-size: 12px; margin-bottom: 6px; color: #374151;">Số hiệu chứng chỉ: <strong style="font-family: Consolas, monospace; color: #6d28d9;">${certCode}</strong></div>
            </div>

            <div style="text-align: center; min-width: 200px;">
              <div style="font-size: 13px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; margin: 0 0 8px;">HỆ THỐNG TMDEMY</div>
              <div style="display: inline-block; padding: 4px 18px; border: 1px dashed #059669; background: #ecfdf5; color: #059669; font-weight: 900; font-size: 12px; border-radius: 4px; letter-spacing: 1px;">TMdemy</div>
              <div style="font-size: 10px; color: #6b7280; font-style: italic; margin-top: 6px;">(Đã xác thực chữ ký điện tử)</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(tempContainer);
      targetElement = tempContainer.firstElementChild as HTMLElement;
    }

    const opt = {
      margin: 8,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    };

    await html2pdf().set(opt).from(targetElement).save();

    if (tempContainer && document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
  } catch (err) {
    console.warn('html2pdf generation failed, falling back to print dialog:', err);
    printCertificateDocument(options);
  }
}

/**
 * Opens an isolated, high-resolution A4 landscape printable window of the certificate.
 * Allows users to instantly print or select "Save as PDF" from their browser's native print dialog
 * without being blocked by cross-origin CORS or Cloudinary ACL 401 restrictions.
 */
export function printCertificateDocument(options: PrintCertificateOptions): void {
  const { certCode, studentName, courseTitle, grade, issuedDate } = options;

  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) return;

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Chung_Chi_${certCode}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f8fafc;
      color: #1e1b4b;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .cert-frame {
      width: 100%;
      max-width: 980px;
      background: #ffffff;
      border: 4px solid #b45309;
      padding: 36px 48px;
      position: relative;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      text-align: center;
    }
    .inner-border {
      position: absolute;
      inset: 8px;
      border: 1.5px solid #1e1b4b;
      pointer-events: none;
    }
    .corner {
      position: absolute;
      width: 14px;
      height: 14px;
      border: 1px solid #b45309;
    }
    .tl { top: 6px; left: 6px; }
    .tr { top: 6px; right: 6px; }
    .bl { bottom: 6px; left: 6px; }
    .br { bottom: 6px; right: 6px; }

    .academy-name {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 2.5px;
      color: #1e1b4b;
      text-transform: uppercase;
      margin: 0;
    }
    .academy-sub {
      font-size: 10px;
      color: #6b7280;
      letter-spacing: 1.5px;
      margin-top: 4px;
      text-transform: uppercase;
    }
    .gold-bar {
      width: 120px;
      height: 2px;
      background: #b45309;
      margin: 12px auto 16px;
    }
    .cert-title {
      font-size: 26px;
      font-weight: 900;
      color: #b45309;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin: 0;
    }
    .cert-subtitle {
      font-size: 12px;
      font-weight: 700;
      color: #374151;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 4px;
      margin-bottom: 20px;
    }
    .label {
      font-size: 13px;
      color: #6b7280;
      font-style: italic;
      margin: 0 0 6px;
    }
    .student-name {
      font-size: 24px;
      font-weight: 800;
      color: #1e1b4b;
      border-bottom: 2px solid #e5e7eb;
      display: inline-block;
      padding: 0 40px 6px;
      margin: 0 0 18px;
    }
    .course-title {
      font-size: 18px;
      font-weight: 800;
      color: #6d28d9;
      margin: 0 0 24px;
    }
    .footer-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      text-align: left;
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px dashed #e5e7eb;
    }
    .meta-item {
      font-size: 12px;
      margin-bottom: 6px;
      color: #374151;
    }
    .meta-item strong {
      color: #1e1b4b;
    }
    .grade-badge {
      color: #059669;
      font-weight: 900;
    }
    .code-badge {
      font-family: Consolas, monospace;
      color: #6d28d9;
      font-weight: 700;
    }
    .signature-box {
      text-align: center;
      min-width: 200px;
    }
    .sig-org {
      font-size: 13px;
      font-weight: 900;
      color: #1e1b4b;
      text-transform: uppercase;
      margin: 0 0 8px;
    }
    .sig-stamp {
      display: inline-block;
      padding: 4px 18px;
      border: 1px dashed #059669;
      background: #ecfdf5;
      color: #059669;
      font-weight: 900;
      font-size: 12px;
      border-radius: 4px;
      letter-spacing: 1px;
    }
    .sig-note {
      font-size: 10px;
      color: #6b7280;
      font-style: italic;
      margin-top: 6px;
    }
  </style>
</head>
<body>
  <div class="cert-frame">
    <div class="inner-border"></div>
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>

    <p class="academy-name">HỌC VIỆN ĐÀO TẠO TRỰC TUYẾN TMDEMY</p>
    <p class="academy-sub">TMDEMY E-LEARNING ACADEMY • EXCELLENCE IN ONLINE EDUCATION</p>
    <div class="gold-bar"></div>

    <h1 class="cert-title">CHỨNG NHẬN TỐT NGHIỆP</h1>
    <p class="cert-subtitle">CERTIFICATE OF COMPLETION</p>

    <p class="label">Chứng nhận học viên:</p>
    <h2 class="student-name">${studentName}</h2>

    <p class="label">Đã hoàn thành xuất sắc khóa học chuyên sâu:</p>
    <h3 class="course-title">${courseTitle}</h3>

    <div class="footer-grid">
      <div>
        <div class="meta-item">Điểm tốt nghiệp: <span class="grade-badge">${grade}%</span></div>
        <div class="meta-item">Ngày cấp chứng chỉ: <strong>${issuedDate}</strong></div>
        <div class="meta-item">Số hiệu chứng chỉ: <span class="code-badge">${certCode}</span></div>
      </div>

      <div class="signature-box">
        <div class="sig-org">HỆ THỐNG TMDEMY</div>
        <div class="sig-stamp">TMdemy</div>
        <div class="sig-note">(Đã xác thực chữ ký điện tử)</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
