'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { enrollInCourse, type CoursePurchaseInvoice } from './actions';

type Props = {
  courseId: string;
  courseTitle: string;
  locale: string;
  pricing: string;
  price: number | null;
  currencyCode: string | null;
  isArabic: boolean;
  isEnrolled: boolean;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

async function imageToDataUrl(path: string): Promise<string> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error('Failed to load invoice image: ' + path);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read invoice image.'));
      }
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Could not read invoice image.'));
    };

    reader.readAsDataURL(blob);
  });
}

function formatMoney(
  amount: number,
  currency: string,
  locale: string,
): string {
  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return amount + ' ' + currency;
  }
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function CourseEnrollmentButton({
  courseId,
  courseTitle,
  locale,
  pricing,
  price,
  currencyCode,
  isArabic,
  isEnrolled,
}: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState<CoursePurchaseInvoice | null>(null);

  const t = {
    enroll: isArabic ? 'سجّل الآن' : 'Enroll now',
    buy: isArabic ? 'شراء الدورة' : 'Buy course',
    confirmTitle: isArabic ? 'تأكيد شراء الدورة' : 'Confirm course purchase',
    course: isArabic ? 'الدورة' : 'Course',
    amount: isArabic ? 'المبلغ' : 'Amount',
    note: isArabic ? 'البيان' : 'Description',
    defaultNote: (name: string) =>
      (isArabic ? 'شراء كورس: ' : 'Course purchase: ') + name,
    cancel: isArabic ? 'إلغاء' : 'Cancel',
    confirm: isArabic ? 'تأكيد الشراء' : 'Confirm purchase',
    processing: isArabic ? 'جارٍ التنفيذ...' : 'Processing...',
    invoiceTitle: isArabic ? 'فاتورة الشراء' : 'Purchase invoice',
    invoiceNumber: isArabic ? 'رقم الفاتورة' : 'Invoice number',
    date: isArabic ? 'التاريخ' : 'Date',
    download: isArabic ? 'تحميل الفاتورة HTML' : 'Download HTML invoice',
    close: isArabic ? 'إغلاق' : 'Close',
    enrolled: isArabic ? 'أنت مسجّل بالفعل' : 'You are already enrolled',
    freeError: isArabic ? 'تعذّر إكمال التسجيل.' : 'Enrollment failed.',
    noPrice: isArabic ? 'سعر الدورة غير متاح.' : 'Course price is unavailable.',
  };

  const currency = currencyCode || 'USD';
  const displayPrice = typeof price === 'number' ? price : 0;
  const paid = pricing === 'paid';

  async function submitEnrollment() {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const result = await enrollInCourse(courseId, locale);

      if (!result.success) {
        setError(result.message);
        return;
      }

      if (result.alreadyEnrolled) {
        router.refresh();
        return;
      }

      if (paid) {
        if (!result.invoice) {
          setError(
            isArabic
              ? 'لم تصل بيانات الفاتورة. راجع سجل الشراء قبل إعادة المحاولة.'
              : 'Invoice data was not returned. Check purchase history before retrying.',
          );
          return;
        }

        setInvoice(result.invoice);
        setConfirmOpen(false);
      } else {
        router.refresh();
      }
    } catch {
      setError(
        isArabic
          ? 'حدث خطأ غير متوقع. تحقق من حالة العملية قبل إعادة المحاولة.'
          : 'An unexpected error occurred. Check the operation status before retrying.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadInvoice() {
    if (!invoice) return;

    let logoData: string;
    let coinData: string;

    try {
      [logoData, coinData] = await Promise.all([
        imageToDataUrl('/brand/logo.png'),
        imageToDataUrl('/brand/my-coins.png'),
      ]);
    } catch {
      setError(
        isArabic
          ? 'تعذر تحميل صور الفاتورة. يرجى المحاولة مرة أخرى.'
          : 'Could not load invoice images. Please try again.',
      );
      return;
    }

    const title = escapeHtml(invoice.course_title);
    const number = escapeHtml(invoice.invoice_number);
    const date = escapeHtml(formatDate(invoice.purchased_at, locale));
    const amount = escapeHtml(
      new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en').format(invoice.price_paid),
    );
    const note = escapeHtml(t.defaultNote(invoice.course_title));

    const html = [
      '<!doctype html>',
      '<html lang="' + (isArabic ? 'ar' : 'en') + '" dir="' +
        (isArabic ? 'rtl' : 'ltr') + '">',
      '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
      '<title>' + escapeHtml(t.invoiceTitle) + ' ' + number + '</title>',
      '<style>',
      'body{font-family:Arial,sans-serif;margin:0;padding:32px;background:#f5f6f8;color:#222}',
      '.invoice{max-width:720px;margin:auto;background:#fff;border:1px solid #ddd;border-radius:12px;padding:28px}',
      '.header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px}',
      '.logo{height:48px;max-width:144px;object-fit:contain}',
      '.coin{height:40px;width:40px;object-fit:contain;vertical-align:middle}',
      '.amount-coin{height:20px;width:20px;object-fit:contain;vertical-align:middle}',
      'h1{margin-top:0}table{width:100%;border-collapse:collapse;margin-top:24px}',
      'td{padding:14px 8px;border-bottom:1px solid #eee;text-align:start}',
      '.total{font-size:20px;font-weight:bold}',
      '</style></head><body><main class="invoice">',
      '<div class="header"><img class="logo" src="' + logoData + '" alt="MyLab"><img class="coin" src="' + coinData + '" alt="' + (isArabic ? 'العملات' : 'Coins') + '"></div>',
      '<h1>' + escapeHtml(t.invoiceTitle) + '</h1>',
      '<p>' + escapeHtml(t.invoiceNumber) + ': <strong>' + number + '</strong></p>',
      '<p>' + escapeHtml(t.date) + ': ' + date + '</p>',
      '<table><tbody>',
      '<tr><td>' + escapeHtml(t.course) + '</td><td>' + title + '</td></tr>',
      '<tr><td>' + escapeHtml(t.note) + '</td><td>' + note + '</td></tr>',
      '<tr><td class="total">' + escapeHtml(t.amount) + '</td><td class="total">' + amount + ' <img class="amount-coin" src="' + coinData + '" alt=""></td></tr>',
      '</tbody></table></main></body></html>',
    ].join('');

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mylab-invoice-' + invoice.invoice_number + '.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const overlayStyle = {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1000,
    background: 'rgba(0,0,0,.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  };

  const modalStyle = {
    background: 'var(--background, #fff)',
    color: 'var(--foreground, #171717)',
    width: '100%',
    maxWidth: 520,
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 20px 60px rgba(0,0,0,.25)',
  };

  if (isEnrolled) {
    return (
      <button type="button" disabled className="rounded-lg border px-5 py-3 opacity-70">
        {t.enrolled}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError('');
          if (paid) {
            setConfirmOpen(true);
          } else {
            void submitEnrollment();
          }
        }}
        disabled={loading}
        className="mt-1 mb-4 rounded-lg bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {loading ? t.processing : paid ? t.buy : t.enroll}
      </button>

      {error && !confirmOpen && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {confirmOpen && (
        <div style={overlayStyle} onMouseDown={(event) => {
          if (event.target === event.currentTarget && !loading) {
            setConfirmOpen(false);
          }
        }}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-purchase-confirm-title"
            style={modalStyle}
          >
            <h2 id="course-purchase-confirm-title" className="mb-4 text-xl font-bold">
              {t.confirmTitle}
            </h2>

            <dl className="space-y-3">
              <div>
                <dt className="text-sm opacity-70">{t.course}</dt>
                <dd className="font-semibold">{courseTitle}</dd>
              </div>
              <div>
                <dt className="text-sm opacity-70">{t.amount}</dt>
                <dd className="font-semibold">
                  {typeof price === 'number'
                    ? formatMoney(displayPrice, currency, locale)
                    : t.noPrice}
                </dd>
              </div>
              <div>
                <dt className="text-sm opacity-70">{t.note}</dt>
                <dd>{t.defaultNote(courseTitle)}</dd>
              </div>
            </dl>

            <p className="mt-4 text-sm opacity-70">
              {isArabic
                ? 'سيتم تنفيذ الخصم عند تأكيد الشراء.'
                : 'Your wallet will be charged when you confirm the purchase.'}
            </p>

            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setError('');
                }}
                disabled={loading}
                className="rounded-lg border px-4 py-2"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => void submitEnrollment()}
                disabled={loading || typeof price !== 'number' || price < 0 || !currencyCode}
                className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {loading ? t.processing : t.confirm}
              </button>
            </div>
          </section>
        </div>
      )}

      {invoice && (
        <div style={overlayStyle}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-purchase-invoice-title"
            style={modalStyle}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <img
                src="/brand/logo.png"
                alt="MyLab"
                className="h-10 max-w-36 object-contain"
              />
              <img
                src="/brand/my-coins.png"
                alt={isArabic ? 'العملات' : 'Coins'}
                className="h-10 w-10 object-contain"
              />
            </div>

            <h2 id="course-purchase-invoice-title" className="mb-4 text-xl font-bold">
              {t.invoiceTitle}
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm opacity-70">{t.invoiceNumber}</p>
                <p className="font-semibold">{invoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">{t.date}</p>
                <p>{formatDate(invoice.purchased_at, locale)}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">{t.course}</p>
                <p className="font-semibold">{invoice.course_title}</p>
              </div>
              <div>
                <p className="text-sm opacity-70">{t.note}</p>
                <p>{t.defaultNote(invoice.course_title)}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm opacity-70">{t.amount}</p>
                <p className="inline-flex items-center gap-2 text-xl font-bold">
                  {new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en').format(invoice.price_paid)}
                  <img
                    src="/brand/my-coins.png"
                    alt={isArabic ? 'العملات' : 'Coins'}
                    className="h-5 w-5 object-contain"
                  />
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs opacity-70">
              {isArabic
                ? 'البيان المعروض افتراضي، ولم يُحفظ في قاعدة البيانات.'
                : 'The displayed description is a default and is not stored in the database.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadInvoice}
                className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700"
              >
                {t.download}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInvoice(null);
                  router.refresh();
                }}
                className="rounded-lg border px-4 py-2"
              >
                {t.close}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
