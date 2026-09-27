'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import ImageUpload from '@/components/auth/ImageUpload'
import { updateGroup } from '@/app/[locale]/actions/groups'

type Props = {
  group: {
    id: string
    name: string
    description: string | null
    coverImageRef: string
    privacy: 'public' | 'private'
    joinPolicy: 'instant' | 'approval'
  }
  locale: string
}

export default function GroupInfoForm({ group, locale }: Props) {
  const router = useRouter()
  const isArabic = locale === 'ar'

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description ?? '')
  const [coverImageRef, setCoverImageRef] = useState(group.coverImageRef ?? '')
  const [privacy, setPrivacy] = useState(group.privacy)
  const [joinPolicy, setJoinPolicy] = useState(group.joinPolicy)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handleEditRequest = () => {
      setEditing(true)
      requestAnimationFrame(() => {
        document.getElementById('group-information')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }

    window.addEventListener('group-edit-request', handleEditRequest)

    return () => {
      window.removeEventListener('group-edit-request', handleEditRequest)
    }
  }, [])

  useEffect(() => {
    setName(group.name)
    setDescription(group.description ?? '')
    setCoverImageRef(group.coverImageRef ?? '')
    setPrivacy(group.privacy)
    setJoinPolicy(group.joinPolicy)
  }, [group])

  function cancelEditing() {
    setName(group.name)
    setDescription(group.description ?? '')
    setCoverImageRef(group.coverImageRef ?? '')
    setPrivacy(group.privacy)
    setJoinPolicy(group.joinPolicy)
    setError('')
    setSuccess(false)
    setEditing(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setError(isArabic ? 'اسم المجموعة مطلوب' : 'Group name is required')
      return
    }

    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const result = await updateGroup({
        groupId: group.id,
        name: name.trim(),
        description: description.trim(),
        coverImageRef: coverImageRef.trim(),
        privacy,
        joinPolicy,
      })

      if (!result.success) {
        setError(
          result.error === 'GROUP_NAME_REQUIRED'
            ? isArabic ? 'اسم المجموعة مطلوب' : 'Group name is required'
            : result.error === 'GROUP_NAME_TOO_LONG'
              ? isArabic ? 'اسم المجموعة طويل جدًا' : 'Group name is too long'
              : result.error === 'GROUP_DESCRIPTION_TOO_LONG'
                ? isArabic ? 'وصف المجموعة طويل جدًا' : 'Group description is too long'
                : result.error,
        )
        return
      }

      setName(result.group.name)
      setDescription(result.group.description ?? '')
      setPrivacy(result.group.privacy)
      setJoinPolicy(result.group.joinPolicy)
      setSuccess(true)
      setEditing(false)

      router.refresh()
    } catch {
      setError(
        isArabic
          ? 'حدث خطأ أثناء تحديث المجموعة'
          : 'An error occurred while updating the group',
      )
    } finally {
      setSaving(false)
    }
  }

  const privacyLabel =
    privacy === 'private'
      ? isArabic ? 'خاصة' : 'Private'
      : isArabic ? 'عامة' : 'Public'

  const joinPolicyLabel =
    joinPolicy === 'approval'
      ? isArabic ? 'يتطلب موافقة' : 'Approval required'
      : isArabic ? 'انضمام مباشر' : 'Instant join'

  if (!editing) {
    return (
      <section
        id="group-information"
        dir={isArabic ? 'rtl' : 'ltr'}
        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
              {isArabic ? 'معلومات المجموعة' : 'Group Information'}
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              {isArabic
                ? 'معلومات المجموعة الحالية.'
                : 'Current group information.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError('')
              setSuccess(false)
              setEditing(true)
            }}
            className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {isArabic ? 'تعديل' : 'Edit'}
          </button>
        </div>

        {success && (
          <p className="mt-4 rounded-xl border border-green-100 bg-green-50 px-3 py-3 text-sm text-green-600">
            {isArabic ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully'}
          </p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-400">
              {isArabic ? 'اسم المجموعة' : 'Group name'}
            </p>
            <p className="mt-1 break-words text-sm font-semibold text-gray-800">
              {name}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-400">
              {isArabic ? 'الخصوصية' : 'Privacy'}
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {privacyLabel}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-3 sm:col-span-2">
            <p className="text-xs text-gray-400">
              {isArabic ? 'الوصف' : 'Description'}
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">
              {description || (isArabic ? 'لا يوجد وصف' : 'No description')}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-3 sm:col-span-2">
            <p className="text-xs text-gray-400">
              {isArabic ? 'سياسة الانضمام' : 'Join policy'}
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {joinPolicyLabel}
            </p>
          </div>

          {coverImageRef && (
            <div className="overflow-hidden rounded-xl border border-gray-200 sm:col-span-2">
              <img
                src={coverImageRef}
                alt=""
                className="max-h-64 w-full object-cover"
              />
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <form
      id="group-information"
      onSubmit={handleSubmit}
      dir={isArabic ? 'rtl' : 'ltr'}
      className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:gap-6 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
            {isArabic ? 'تعديل معلومات المجموعة' : 'Edit Group Information'}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {isArabic
              ? 'عدّل المعلومات ثم احفظ التغييرات.'
              : 'Update the information and save your changes.'}
          </p>
        </div>

        <button
          type="button"
          onClick={cancelEditing}
          disabled={saving}
          className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {isArabic ? 'إلغاء' : 'Cancel'}
        </button>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-gray-700">
          {isArabic ? 'اسم المجموعة' : 'Group name'}
        </span>

        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          required
          className="min-h-11 rounded-xl border border-gray-300 px-3.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </label>

      <label className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-700">
            {isArabic ? 'الوصف' : 'Description'}
          </span>

          <span className="text-xs text-gray-400">
            {description.length}/500
          </span>
        </div>

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={500}
          rows={5}
          className="resize-none rounded-xl border border-gray-300 px-3.5 py-3 text-sm leading-6 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-gray-700">
          {isArabic ? 'صورة الغلاف' : 'Cover image'}
        </span>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-2">
          <ImageUpload
            value={coverImageRef}
            onChange={setCoverImageRef}
            folder="/groups"
            scope="groups"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-gray-700">
            {isArabic ? 'الخصوصية' : 'Privacy'}
          </span>

          <select
            value={privacy}
            onChange={(event) =>
              setPrivacy(event.target.value as 'public' | 'private')
            }
            className="min-h-11 rounded-xl border border-gray-300 bg-white px-3.5 text-sm"
          >
            <option value="public">
              {isArabic ? 'عامة' : 'Public'}
            </option>
            <option value="private">
              {isArabic ? 'خاصة' : 'Private'}
            </option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-gray-700">
            {isArabic ? 'سياسة الانضمام' : 'Join policy'}
          </span>

          <select
            value={joinPolicy}
            onChange={(event) =>
              setJoinPolicy(event.target.value as 'instant' | 'approval')
            }
            className="min-h-11 rounded-xl border border-gray-300 bg-white px-3.5 text-sm"
          >
            <option value="instant">
              {isArabic ? 'انضمام مباشر' : 'Instant join'}
            </option>
            <option value="approval">
              {isArabic ? 'يتطلب موافقة' : 'Approval required'}
            </option>
          </select>
        </label>
      </div>

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary min-h-11 w-full px-5 py-2.5 disabled:opacity-50 sm:w-auto sm:self-end"
      >
        {saving
          ? isArabic ? 'جاري الحفظ...' : 'Saving...'
          : isArabic ? 'حفظ التغييرات' : 'Save changes'}
      </button>
    </form>
  )
}
