'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createHigherEducation,
  updateHigherEducation,
  deleteHigherEducation,
  createJobHistory,
  updateJobHistory,
  deleteJobHistory,
} from '@/app/[locale]/actions/profile'

type EducationItem = {
  id: string
  university: string
  degree: 'higher_diploma' | 'master' | 'phd'
  year_obtained: number | null
}

type WorkItem = {
  id: string
  employer: string
  job_title: string
  start_year: number | null
  end_year: number | null
}

type Props = {
  isArabic: boolean
  education: EducationItem[]
  work: WorkItem[]
  baseDegree: string | null
  baseUniversity: string | null
  baseGraduationYear: number | null
  isOwner: boolean
}

const yearNow = new Date().getFullYear()

export default function ProfileEducationWorkEdit({
  isArabic,
  education,
  work,
  baseDegree,
  baseUniversity,
  baseGraduationYear,
  isOwner,
}: Props) {
  const router = useRouter()
  const [type,setType]=useState<'education'|'work'>('education')
  const [editing,setEditing]=useState<any>(null)
  const [open,setOpen]=useState(false)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')

  const [university,setUniversity]=useState('')
  const [degree,setDegree]=useState<'higher_diploma'|'master'|'phd'>('higher_diploma')
  const [educationYear,setEducationYear]=useState('')

  const [employer,setEmployer]=useState('')
  const [jobTitle,setJobTitle]=useState('')
  const [startYear,setStartYear]=useState('')
  const [endYear,setEndYear]=useState('')

  function addEducation(){
    setType('education')
    setEditing(null)
    setUniversity('')
    setDegree('higher_diploma')
    setEducationYear('')
    setError('')
    setOpen(true)
  }

  function editEducation(item:EducationItem){
    setType('education')
    setEditing(item)
    setUniversity(item.university)
    setDegree(item.degree)
    setEducationYear(item.year_obtained?.toString() ?? '')
    setError('')
    setOpen(true)
  }

  function addWork(){
    setType('work')
    setEditing(null)
    setEmployer('')
    setJobTitle('')
    setStartYear('')
    setEndYear('')
    setError('')
    setOpen(true)
  }

  function editWork(item:WorkItem){
    setType('work')
    setEditing(item)
    setEmployer(item.employer)
    setJobTitle(item.job_title)
    setStartYear(item.start_year?.toString() ?? '')
    setEndYear(item.end_year?.toString() ?? '')
    setError('')
    setOpen(true)
  }

  async function save(){
    setSaving(true)
    setError('')

    if(type==='education'){
      const year=educationYear.trim()?Number(educationYear):null

      if(!university.trim()){
        setError(isArabic?'الجامعة مطلوبة.':'University is required.')
        setSaving(false); return
      }

      if(year!==null && (!Number.isInteger(year)||year<1900||year>yearNow+1)){
        setError(isArabic?'السنة غير صحيحة.':'Invalid year.')
        setSaving(false); return
      }

      const result=editing
        ? await updateHigherEducation(editing.id,{university,degree,yearObtained:year})
        : await createHigherEducation({university,degree,yearObtained:year})

      if(!result.success){
        setError(result.error ?? 'Operation failed')
        setSaving(false); return
      }
    }else{
      const start=startYear.trim()?Number(startYear):null
      const end=endYear.trim()?Number(endYear):null

      if(!employer.trim()||!jobTitle.trim()){
        setError(isArabic?'جهة العمل والمسمى الوظيفي مطلوبان.':'Employer and job title are required.')
        setSaving(false); return
      }

      if(
        (start!==null&&(!Number.isInteger(start)||start<1900||start>yearNow+1))||
        (end!==null&&(!Number.isInteger(end)||end<1900||end>yearNow+1))||
        (start!==null&&end!==null&&end<start)
      ){
        setError(isArabic?'السنوات غير صحيحة.':'Invalid years.')
        setSaving(false); return
      }

      const result=editing
        ? await updateJobHistory(editing.id,{employer,jobTitle,startYear:start,endYear:end})
        : await createJobHistory({employer,jobTitle,startYear:start,endYear:end})

      if(!result.success){
        setError(result.error ?? 'Operation failed')
        setSaving(false); return
      }
    }

    setOpen(false)
    setSaving(false)
    router.refresh()
  }

  async function removeEducation(id:string){
    if(!window.confirm(isArabic?'حذف سجل التعليم؟':'Delete this education record?')) return
    const result=await deleteHigherEducation(id)
    if(!result.success){setError(result.error ?? 'Operation failed');return}
    router.refresh()
  }

  async function removeWork(id:string){
    if(!window.confirm(isArabic?'حذف سجل العمل؟':'Delete this work record?')) return
    const result=await deleteJobHistory(id)
    if(!result.success){setError(result.error ?? 'Operation failed');return}
    router.refresh()
  }

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{isArabic?'التعليم':'Education'}</h2>
          {isOwner ? (
            <button type="button" onClick={addEducation}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold">
              {isArabic?'إضافة':'Add'}
            </button>
          ) : null}
        </div>

        {baseDegree||baseUniversity ? (
          <div className="mb-3 rounded-xl bg-gray-50 p-4">
            <p className="font-semibold">{[baseDegree,baseUniversity].filter(Boolean).join(' — ')}</p>
            {baseGraduationYear ? <p className="mt-1 text-xs text-gray-500">{baseGraduationYear}</p>:null}
          </div>
        ):null}

        <div className="space-y-3">
          {education.map(item=>(
            <div key={item.id} className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {item.degree==='master'?(isArabic?'ماجستير':'Master'):item.degree==='phd'?(isArabic?'دكتوراه':'PhD'):(isArabic?'دبلوم عالٍ':'Higher diploma')}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{item.university}</p>
                  {item.year_obtained ? (
                    <p className="mt-1 text-xs text-gray-500">{item.year_obtained}</p>
                  ) : null}
                </div>
                {isOwner ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={()=>editEducation(item)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      {isArabic?'تعديل':'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={()=>removeEducation(item.id)}
                      className="rounded-lg border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      {isArabic?'حذف':'Delete'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{isArabic?'العمل والخبرة':'Work & experience'}</h2>
          {isOwner ? (
            <button type="button" onClick={addWork}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold">
              {isArabic?'إضافة':'Add'}
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          {work.map(item=>(
            <div key={item.id} className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{item.job_title}</p>
                  <p className="mt-1 text-sm text-gray-600">{item.employer}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.start_year??'—'} — {item.end_year??(isArabic?'حتى الآن':'Present')}
                  </p>
                </div>
                {isOwner ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={()=>editWork(item)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      {isArabic?'تعديل':'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={()=>removeWork(item.id)}
                      className="rounded-lg border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      {isArabic?'حذف':'Delete'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {open?(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5">
            <div className="space-y-4">
              {type==='education'?(
                <>
                  <input value={university} onChange={e=>setUniversity(e.target.value)}
                    placeholder={isArabic?'الجامعة':'University'} className="w-full rounded-xl border p-3"/>
                  <select value={degree} onChange={e=>setDegree(e.target.value as typeof degree)}
                    className="w-full rounded-xl border bg-white p-3">
                    <option value="higher_diploma">{isArabic?'دبلوم عالٍ':'Higher diploma'}</option>
                    <option value="master">{isArabic?'ماجستير':'Master'}</option>
                    <option value="phd">{isArabic?'دكتوراه':'PhD'}</option>
                  </select>
                  <input type="number" value={educationYear} onChange={e=>setEducationYear(e.target.value)}
                    placeholder={isArabic?'سنة الحصول':'Year obtained'} className="w-full rounded-xl border p-3"/>
                </>
              ):(
                <>
                  <input value={employer} onChange={e=>setEmployer(e.target.value)}
                    placeholder={isArabic?'جهة العمل':'Employer'} className="w-full rounded-xl border p-3"/>
                  <input value={jobTitle} onChange={e=>setJobTitle(e.target.value)}
                    placeholder={isArabic?'المسمى الوظيفي':'Job title'} className="w-full rounded-xl border p-3"/>
                  <input type="number" value={startYear} onChange={e=>setStartYear(e.target.value)}
                    placeholder={isArabic?'سنة البداية':'Start year'} className="w-full rounded-xl border p-3"/>
                  <input type="number" value={endYear} onChange={e=>setEndYear(e.target.value)}
                    placeholder={isArabic?'سنة النهاية':'End year'} className="w-full rounded-xl border p-3"/>
                </>
              )}

              {error?<p className="text-sm text-red-600">{error}</p>:null}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={()=>setOpen(false)} disabled={saving} className="rounded-xl border px-4 py-2">
                  {isArabic?'إلغاء':'Cancel'}
                </button>
                <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-primary-600 px-4 py-2 text-white">
                  {saving?(isArabic?'جارٍ الحفظ...':'Saving...'):(isArabic?'حفظ':'Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ):null}
    </>
  )
}
