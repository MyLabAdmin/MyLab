'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

type Duration = {
  id: string;
  name_ar: string;
  name_en: string;
  months: number;
};

type Price = {
  plan_id: string;
  duration_id: string;
  market_code: string;
  currency_code: string;
  original_amount: number;
};

type Props = {
  planId: string;
  planName: string;
  durations: Duration[];
  prices: Price[];
  paymentMethodId: string;
  marketCode: string;
  currencyCode: string;
  locale: string;
};

export default function SubscriptionCheckout({
  planId,
  planName,
  durations,
  prices,
  paymentMethodId,
  marketCode,
  currencyCode,
  locale,
}: Props) {
  const ar = locale === 'ar';
  const [open, setOpen] = useState(false);
  const [durationId, setDurationId] = useState('');
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [order, setOrder] = useState<{
    order_number: string;
    status: string;
    final_amount: number;
    currency_code: string;
  } | null>(null);

  const availableDurations = durations.filter((duration) =>
    prices.some(
      (price) =>
        price.plan_id === planId &&
        price.duration_id === duration.id &&
        price.market_code === marketCode &&
        price.currency_code === currencyCode
    )
  );

  const selectedDuration = availableDurations.find(
    (duration) => duration.id === durationId
  );

  const selectedPrice = prices.find(
    (price) =>
      price.plan_id === planId &&
      price.duration_id === durationId &&
      price.market_code === marketCode &&
      price.currency_code === currencyCode
  );

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(ar ? 'ar' : 'en').format(amount);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!selectedDuration || !selectedPrice || !reference.trim()) {
      setError(ar ? 'اختر مدة الاشتراك وأدخل الرقم المرجعي لعملية الدفع.' : 'Choose a subscription duration and enter your payment reference.');
      return;
    }

    if (proof) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(proof.type) || proof.size > 10 * 1024 * 1024) {
        setError(ar ? 'الملف يجب أن يكون صورة أو PDF وألا يتجاوز 10 ميغابايت.' : 'The file must be an image or PDF no larger than 10 MB.');
        return;
      }
    }

    setBusy(true);
    const supabase = createClient();
    let storagePath: string | null = null;

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error(ar ? 'انتهت الجلسة. سجّل الدخول مجددًا.' : 'Session expired. Please sign in again.');
      }

      if (proof) {
        const extension = proof.name.split('.').pop()?.toLowerCase() || 'bin';
        storagePath = authData.user.id + '/' + crypto.randomUUID() + '.' + extension;
        const { error: uploadError } = await supabase.storage
          .from('subscription-payment-proofs')
          .upload(storagePath, proof, { contentType: proof.type, upsert: false });
        if (uploadError) throw uploadError;
      }

      const fields: Record<string, { value_text?: string; storage_path?: string }> = {
        test_reference: { value_text: reference.trim() },
      };
      if (storagePath) fields.test_proof = { storage_path: storagePath };

      const requestArgs = {
        p_plan_id: planId,
        p_duration_id: durationId,
        p_payment_method_id: paymentMethodId,
        p_market_code: marketCode,
        p_currency_code: currencyCode,
        p_fields: fields,
        p_confirm_upgrade: false,
      };

      let { data, error: requestError } = await supabase.rpc(
        'create_subscription_payment_request',
        requestArgs
      );

      if (
        requestError?.message?.includes(
          'SUBSCRIPTION_UPGRADE_CONFIRMATION_REQUIRED'
        )
      ) {
        const accepted = window.confirm(
          ar
            ? 'لديك اشتراك فعّال. هل تؤكد رغبتك في الترقية إلى خطة أعلى وإرسال طلب جديد للمراجعة؟'
            : 'You have an active subscription. Do you confirm upgrading to a higher plan and submitting a new request for review?'
        );

        if (!accepted) {
          setError(
            ar
              ? 'تم إلغاء الترقية. لم يُنشأ طلب اشتراك جديد.'
              : 'Upgrade cancelled. No new subscription request was created.'
          );
          return;
        }

        ({ data, error: requestError } = await supabase.rpc(
          'create_subscription_payment_request',
          { ...requestArgs, p_confirm_upgrade: true }
        ));
      }

      if (requestError) {
        const message = requestError.message || '';

        if (message.includes('SUBSCRIPTION_REQUEST_PENDING')) {
          throw new Error(
            ar
              ? 'لديك طلب اشتراك قيد المراجعة بالفعل. انتظر مراجعته قبل إرسال طلب آخر.'
              : 'You already have a subscription request awaiting review. Please wait for its review before submitting another.'
          );
        }

        if (message.includes('SUBSCRIPTION_PLAN_ALREADY_ACTIVE')) {
          throw new Error(
            ar
              ? 'لديك اشتراك فعّال بهذه الخطة بالفعل.'
              : 'You already have an active subscription for this plan.'
          );
        }

        if (message.includes('SUBSCRIPTION_DOWNGRADE_NOT_ALLOWED')) {
          throw new Error(
            ar
              ? 'لا يمكن طلب خطة أدنى من اشتراكك الحالي من هنا.'
              : 'You cannot request a lower plan than your current subscription here.'
          );
        }

        if (
          message.includes('SUBSCRIPTION_UPGRADE_CONFIRMATION_REQUIRED')
        ) {
          throw new Error(
            ar
              ? 'تعذّر تأكيد الترقية. لم يُنشأ الطلب؛ حاول مرة أخرى.'
              : 'Upgrade confirmation could not be completed. No request was created; please try again.'
          );
        }

        throw requestError;
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.order_number) {
        throw new Error(ar ? 'لم يرجع الخادم رقم الطلب. تحقق من طلباتك قبل إعادة المحاولة.' : 'No order number returned. Check your requests before retrying.');
      }

      setOrder({
        order_number: result.order_number,
        status: result.status,
        final_amount: Number(result.final_amount),
        currency_code: currencyCode,
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : (ar ? 'تعذّر إنشاء الطلب.' : 'Could not create the request.')
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={availableDurations.length === 0 || Boolean(order)}
        className="mt-6 min-h-11 w-full rounded-xl bg-primary-600 px-4 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {order ? (ar ? 'تم إرسال الطلب' : 'Request submitted') : (ar ? 'اشترك الآن' : 'Subscribe now')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={'checkout-title-' + planId}
            dir={ar ? 'rtl' : 'ltr'}
            className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-gray-100 bg-white p-5 pb-6 shadow-2xl sm:rounded-3xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <h2 id={'checkout-title-' + planId} className="text-2xl font-extrabold tracking-tight text-gray-950">
                  {order ? (ar ? 'تم إرسال الطلب' : 'Request submitted') : (ar ? 'إتمام الاشتراك' : 'Complete subscription')}
                </h2>
                <p className="mt-2 text-sm font-medium text-gray-500">{planName}</p>
              </div>
              <button
                type="button"
                aria-label={ar ? 'إغلاق النافذة' : 'Close dialog'}
                disabled={busy}
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-600 hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            {order ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4" aria-live="polite">
                <p className="font-bold text-green-900">{ar ? 'رقم الطلب' : 'Order number'}</p>
                <p className="mt-1 break-all text-lg font-semibold text-green-900">{order.order_number}</p>
                <p className="mt-3 text-sm text-green-900">
                  {(ar ? 'المبلغ: ' : 'Amount: ') + formatAmount(order.final_amount) + ' ' + order.currency_code}
                </p>
                <p className="mt-1 text-sm text-green-900">
                  {(ar ? 'الحالة: ' : 'Status: ') + order.status}
                </p>
                <p className="mt-3 text-sm leading-6 text-green-900">
                  {ar ? 'الطلب قيد المراجعة. لم يتم تحصيل أموال أو تفعيل الاشتراك تلقائيًا.' : 'The request is awaiting review. No money was collected and no subscription was activated automatically.'}
                </p>
                <button type="button" onClick={() => setOpen(false)} className="mt-5 min-h-11 w-full rounded-xl bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800">
                  {ar ? 'إغلاق' : 'Close'}
                </button>
              </div>
            ) : (
              <form onSubmit={submitRequest} className="space-y-4">
                <p className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                  {ar ? 'أرسل طلبك بعد إتمام الدفع، وسيتم التحقق من بياناته ومراجعته من الإدارة.' : 'Submit your request after completing payment. The administration team will verify and review your details.'}
                </p>

                <div>
                  <label htmlFor={'duration-' + planId} className="mb-2 block text-sm font-medium text-gray-700">
                    {ar ? 'مدة الاشتراك' : 'Subscription duration'}
                  </label>
                  <select
                    id={'duration-' + planId}
                    value={durationId}
                    onChange={(event) => setDurationId(event.target.value)}
                    required
                    className="min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100"
                  >
                    <option value="">{ar ? 'اختر المدة' : 'Select duration'}</option>
                    {availableDurations.map((duration) => (
                      <option key={duration.id} value={duration.id}>
                        {(ar ? duration.name_ar : duration.name_en) + ' — ' + duration.months + ' ' + (ar ? 'شهر' : 'months')}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPrice && (
                  <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-5">
                    <p className="text-sm text-gray-600">{ar ? 'سعر الاشتراك' : 'Subscription price'}</p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-primary-700">
                      {formatAmount(Number(selectedPrice.original_amount)) + ' ' + selectedPrice.currency_code}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{ar ? 'من قاعدة البيانات' : 'From the database'}</p>
                  </div>
                )}

                <div>
                  <label htmlFor={'reference-' + planId} className="mb-2 block text-sm font-medium text-gray-700">
                    {ar ? 'الرقم المرجعي لعملية الدفع (مطلوب)' : 'Payment reference (required)'}
                  </label>
                  <input
                    id={'reference-' + planId}
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    required
                    maxLength={200}
                    autoComplete="off"
                    className="min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100"
                    placeholder={ar ? 'أدخل الرقم المرجعي لعملية الدفع' : 'Enter your payment reference'}
                  />
                </div>

                <div>
                  <label htmlFor={'proof-' + planId} className="mb-2 block text-sm font-medium text-gray-700">
                    {ar ? 'إيصال الدفع (اختياري)' : 'Payment receipt (optional)'}
                  </label>
                  <input
                    id={'proof-' + planId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(event) => setProof(event.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-gray-700"
                  />
                  <p className="mt-1 text-xs text-gray-500">{ar ? 'صورة أو PDF، بحد أقصى 10 ميغابايت.' : 'Image or PDF, maximum 10 MB.'}</p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5 text-sm text-gray-700">
                  <p className="font-semibold">{ar ? 'ملخص الطلب' : 'Request summary'}</p>
                  <p className="mt-2">{planName}</p>
                  <p>{selectedDuration ? (ar ? selectedDuration.name_ar : selectedDuration.name_en) : (ar ? 'لم تحدد المدة' : 'No duration selected')}</p>
                  <p>{selectedPrice ? formatAmount(Number(selectedPrice.original_amount)) + ' ' + selectedPrice.currency_code : '—'}</p>
                  <p className="mt-3 leading-6 text-amber-800">
                    {ar ? 'لن يتم تفعيل الاشتراك تلقائيًا؛ الطلب سيُرسل للمراجعة.' : 'The subscription will not activate automatically; the request will be sent for review.'}
                  </p>
                </div>

                <label className="flex items-start gap-2 text-sm leading-6 text-gray-700">
                  <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} required className="mt-1" />
                  <span>{ar ? 'أؤكد صحة بيانات الطلب والرقم المرجعي المقدم.' : 'I confirm that the request details and payment reference are accurate.'}</span>
                </label>

                {error && <p role="alert" className="break-words rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

                <div className="sticky bottom-0 bg-white pt-2">
                  <button
                    type="submit"
                    disabled={busy || !selectedPrice || !confirmed}
                    className="min-h-12 w-full rounded-xl bg-primary-600 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                  >
                    {busy ? (ar ? 'جارٍ إرسال الطلب…' : 'Submitting…') : (ar ? 'تأكيد وإرسال الطلب' : 'Confirm and submit')}
                  </button>
                  <button type="button" disabled={busy} onClick={() => setOpen(false)} className="mt-2 min-h-11 w-full rounded-xl border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">
                    {ar ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
