'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type RequestRow = {
  id: string;
  order_number: string;
  status: string;
  final_amount: number;
  currency_code: string;
  submitted_at: string;
  review_note: string | null;
  plan: { name_ar: string; name_en: string } | null;
  duration: { name_ar: string; name_en: string; months: number } | null;
};

type Props = { locale: string };
const statuses = ['submitted', 'under_review', 'approved', 'rejected'];

export default function SubscriptionRequests({ locale }: Props) {
  const ar = locale === 'ar';
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const labels: Record<string, string> = {
    all: ar ? 'كل الحالات' : 'All statuses',
    submitted: ar ? 'بانتظار المراجعة' : 'Submitted',
    under_review: ar ? 'قيد المراجعة' : 'Under review',
    approved: ar ? 'مقبول' : 'Approved',
    rejected: ar ? 'مرفوض' : 'Rejected',
  };

  async function loadRequests() {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error('AUTH_REQUIRED');

      const { data, error: queryError } = await supabase
        .from('subscription_payment_requests')
        .select('id, order_number, plan_id, duration_id, status, final_amount, currency_code, submitted_at, review_note')
        .eq('user_id', auth.user.id)
        .order('submitted_at', { ascending: false });
      if (queryError) throw queryError;

      const requests = data ?? [];
      const planIds = [...new Set(requests.map((row) => row.plan_id))];
      const durationIds = [...new Set(requests.map((row) => row.duration_id))];

      const [plansResult, durationsResult] = await Promise.all([
        planIds.length
          ? supabase.from('subscription_plans').select('id, name_ar, name_en').in('id', planIds)
          : Promise.resolve({ data: [], error: null }),
        durationIds.length
          ? supabase.from('subscription_durations').select('id, name_ar, name_en, months').in('id', durationIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (plansResult.error) throw plansResult.error;
      if (durationsResult.error) throw durationsResult.error;

      const plans = new Map((plansResult.data ?? []).map((item) => [item.id, item]));
      const durations = new Map((durationsResult.data ?? []).map((item) => [item.id, item]));
      setRows(requests.map((row) => ({
        id: row.id,
        order_number: row.order_number,
        status: row.status,
        final_amount: Number(row.final_amount),
        currency_code: row.currency_code,
        submitted_at: row.submitted_at,
        review_note: row.review_note,
        plan: plans.get(row.plan_id) ?? null,
        duration: durations.get(row.duration_id) ?? null,
      })));
      setLoaded(true);
    } catch {
      setError(ar ? 'تعذّر تحميل الطلبات. حاول مرة أخرى.' : 'Could not load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function showRequests() {
    setOpen(true);
    if (!loaded && !loading) void loadRequests();
  }

  const filtered = useMemo(() => rows
    .filter((row) => status === 'all' || row.status === status)
    .filter((row) => row.order_number.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      const difference = new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
      return sort === 'newest' ? -difference : difference;
    }), [rows, status, search, sort]);

  const dateText = (value: string) => new Intl.DateTimeFormat(ar ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  const amountText = (value: number) => new Intl.NumberFormat(ar ? 'ar' : 'en', { maximumFractionDigits: 2 }).format(value);

  return (
    <>
      <div className='mb-6'>
        <button type='button' onClick={showRequests} className='min-h-11 rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-800 shadow-sm hover:bg-gray-50'>
          {ar ? 'طلباتي' : 'My requests'}
        </button>
      </div>
      {open && (
        <div className='fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4' onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role='dialog' aria-modal='true' aria-labelledby='subscription-requests-title' dir={ar ? 'rtl' : 'ltr'} className='max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-gray-50 p-4 shadow-2xl sm:rounded-3xl sm:p-6'>
            <header className='mb-5 flex items-center justify-between gap-3'>
              <div>
                <h2 id='subscription-requests-title' className='text-2xl font-extrabold text-gray-950'>{ar ? 'طلبات الاشتراك' : 'Subscription requests'}</h2>
                <p className='mt-1 text-sm text-gray-500'>{ar ? 'تابع حالة طلبات اشتراكك.' : 'Track your subscription requests.'}</p>
              </div>
              <button type='button' aria-label={ar ? 'إغلاق' : 'Close'} onClick={() => setOpen(false)} className='h-10 w-10 rounded-full bg-white text-xl'>×</button>
            </header>
            <div className='mb-5 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-3'>
              <label className='text-sm font-medium'>{ar ? 'الحالة' : 'Status'}
                <select value={status} onChange={(event) => setStatus(event.target.value)} className='mt-1.5 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3'>
                  <option value='all'>{labels.all}</option>
                  {statuses.map((value) => <option key={value} value={value}>{labels[value]}</option>)}
                </select>
              </label>
              <label className='text-sm font-medium'>{ar ? 'البحث برقم الطلب' : 'Search by order number'}
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={ar ? 'أدخل رقم الطلب' : 'Enter order number'} className='mt-1.5 min-h-11 w-full rounded-xl border border-gray-200 px-3' />
              </label>
              <label className='text-sm font-medium'>{ar ? 'الترتيب' : 'Sort'}
                <select value={sort} onChange={(event) => setSort(event.target.value)} className='mt-1.5 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3'>
                  <option value='newest'>{ar ? 'الأحدث أولًا' : 'Newest first'}</option>
                  <option value='oldest'>{ar ? 'الأقدم أولًا' : 'Oldest first'}</option>
                </select>
              </label>
            </div>
            {loading ? <p className='rounded-2xl bg-white p-8 text-center'>{ar ? 'جارٍ تحميل الطلبات…' : 'Loading requests…'}</p>
              : error ? <div role='alert' className='rounded-2xl bg-white p-6 text-center text-red-700'><p>{error}</p><button type='button' onClick={() => void loadRequests()} className='mt-3 rounded-lg bg-gray-900 px-4 py-2 text-white'>{ar ? 'إعادة المحاولة' : 'Try again'}</button></div>
              : filtered.length === 0 ? <p className='rounded-2xl bg-white p-8 text-center text-gray-500'>{ar ? 'لا توجد طلبات مطابقة.' : 'No matching requests.'}</p>
              : <div className='space-y-3'>{filtered.map((row) => (
                <article key={row.id} className='rounded-2xl border border-gray-200 bg-white p-4 sm:p-5'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div><p className='text-xs text-gray-500'>{ar ? 'رقم الطلب' : 'Order number'}</p><p className='mt-1 break-all font-bold'>{row.order_number}</p></div>
                    <span className='rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold'>{labels[row.status] ?? row.status}</span>
                  </div>
                  <div className='mt-4 grid gap-3 text-sm sm:grid-cols-2'>
                    <div><p className='text-gray-500'>{ar ? 'الخطة' : 'Plan'}</p><p className='mt-1 font-semibold'>{row.plan ? (ar ? row.plan.name_ar : row.plan.name_en) : '—'}</p></div>
                    <div><p className='text-gray-500'>{ar ? 'المدة' : 'Duration'}</p><p className='mt-1 font-semibold'>{row.duration ? (ar ? row.duration.name_ar : row.duration.name_en) + ' · ' + row.duration.months + ' ' + (ar ? 'شهر' : 'months') : '—'}</p></div>
                    <div><p className='text-gray-500'>{ar ? 'المبلغ' : 'Amount'}</p><p className='mt-1 font-semibold'>{amountText(row.final_amount)} {row.currency_code}</p></div>
                    <div><p className='text-gray-500'>{ar ? 'تاريخ الإرسال' : 'Submitted'}</p><p className='mt-1 font-medium'>{dateText(row.submitted_at)}</p></div>
                  </div>
                  {row.review_note && <div className='mt-4 rounded-xl bg-gray-50 p-3'><p className='text-xs font-semibold text-gray-500'>{ar ? 'ملاحظة الإدارة' : 'Review note'}</p><p className='mt-1 whitespace-pre-wrap break-words text-sm'>{row.review_note}</p></div>}
                </article>
              ))}</div>}
            <div className='mt-5 flex justify-end'><button type='button' onClick={() => setOpen(false)} className='min-h-11 rounded-xl border border-gray-300 bg-white px-5 font-semibold'>{ar ? 'إغلاق' : 'Close'}</button></div>
          </section>
        </div>
      )}
    </>
  );
}
