'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import {
  createLaboratoryTestAction,
  updateLaboratoryTestDraftAction,
} from '@/app/[locale]/(app)/knowledge/actions'
import type {
  KnowledgeCategory,
  KnowledgeCategoryOption,
} from '@/lib/knowledge/categories'
import type { LaboratoryTestDraft } from '@/lib/knowledge/laboratory-test-draft'
import type {
  LaboratoryTestInterpretationInput,
  LaboratoryTestMethodInput,
  LaboratoryTestReferenceRangeInput,
  LaboratoryTestSpecimenInput,
} from '@/lib/knowledge/laboratory-test-authoring'

type Props = {
  parents: KnowledgeCategory[]
  subcategories: KnowledgeCategoryOption[]
  initialData?: LaboratoryTestDraft
  mode?: 'create' | 'edit'
}

type SpecimenRow = LaboratoryTestSpecimenInput & { id: string }
type MethodRow = LaboratoryTestMethodInput & { id: string }
type InterpretationRow = LaboratoryTestInterpretationInput & { id: string }
type ReferenceRangeRow = LaboratoryTestReferenceRangeInput & { id: string }

function createId() {
  return crypto.randomUUID()
}

function createSpecimen(): SpecimenRow {
  return {
    id: createId(),
    specimen_type: '',
    container: '',
    handling_instructions: '',
  }
}

function createMethod(): MethodRow {
  return {
    id: createId(),
    method_name: '',
    description: '',
  }
}

function createInterpretation(): InterpretationRow {
  return {
    id: createId(),
    condition: '',
    interpretation: '',
    clinical_significance: '',
    notes: '',
  }
}

function createReferenceRange(): ReferenceRangeRow {
  return {
    id: createId(),
    specimen_type: '',
    method_name: '',
    population_label: '',
    age_min: null,
    age_max: null,
    age_unit: 'years',
    sex: '',
    lower_value: null,
    upper_value: null,
    unit: '',
    notes: '',
  }
}

export function CreateLaboratoryTestForm({
  parents,
  subcategories,
  initialData,
  mode = 'create',
}: Props) {
  const t = useTranslations('knowledge.laboratoryTest')
  const router = useRouter()

  const [title, setTitle] = useState(
    () => initialData?.title ?? '',
  )
  const [subtitle, setSubtitle] = useState(
    () => initialData?.subtitle ?? '',
  )
  const [testCode, setTestCode] = useState(
    () => initialData?.test_code ?? '',
  )
  const [loincCode, setLoincCode] = useState(
    () => initialData?.loinc_code ?? '',
  )
  const [summary, setSummary] = useState(
    () => initialData?.summary ?? '',
  )
  const [content, setContent] = useState(
    () => initialData?.content ?? '',
  )
  const [preTestPreparation, setPreTestPreparation] = useState(
    () => initialData?.pre_test_preparation ?? '',
  )

  const [primaryCategoryId, setPrimaryCategoryId] = useState(
    () => initialData?.primary_category_id ?? '',
  )
  const [subcategoryId, setSubcategoryId] = useState(
    () => initialData?.category_id ?? '',
  )

  const [specimens, setSpecimens] = useState<SpecimenRow[]>(
    () =>
      initialData?.specimens?.length
        ? initialData.specimens.map((item) => ({
            ...item,
            id: createId(),
          }))
        : [createSpecimen()],
  )

  const [methods, setMethods] = useState<MethodRow[]>(
    () =>
      initialData?.methods?.map((item) => ({
        ...item,
        id: createId(),
      })) ?? [],
  )

  const [interpretations, setInterpretations] = useState<
    InterpretationRow[]
  >(
    () =>
      initialData?.interpretations?.map((item) => ({
        ...item,
        id: createId(),
      })) ?? [],
  )

  const [referenceRanges, setReferenceRanges] = useState<
    ReferenceRangeRow[]
  >(
    () =>
      initialData?.reference_ranges?.map((item) => ({
        ...item,
        id: createId(),
      })) ?? [],
  )

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredSubcategories = useMemo(
    () =>
      subcategories.filter(
        (category) => category.parent_id === primaryCategoryId,
      ),
    [primaryCategoryId, subcategories],
  )

  function handlePrimaryCategoryChange(value: string) {
    setPrimaryCategoryId(value)
    setSubcategoryId('')
  }

  function updateSpecimen(
    id: string,
    patch: Partial<SpecimenRow>,
  ) {
    setSpecimens((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    )
  }

  function updateMethod(id: string, patch: Partial<MethodRow>) {
    setMethods((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    )
  }

  function updateInterpretation(
    id: string,
    patch: Partial<InterpretationRow>,
  ) {
    setInterpretations((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    )
  }

  function updateReferenceRange(
    id: string,
    patch: Partial<ReferenceRangeRow>,
  ) {
    setReferenceRanges((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    )
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (submitting) {
      return
    }

    setError(null)

    if (!title.trim()) {
      setError(t('validation.testName'))
      return
    }

    if (!testCode.trim()) {
      setError(t('validation.testCode'))
      return
    }

    if (!primaryCategoryId) {
      setError(t('validation.primaryCategory'))
      return
    }

    if (!subcategoryId) {
      setError(t('validation.subcategory'))
      return
    }

    if (
      specimens.length === 0 ||
      specimens.some(
        (specimen) => !specimen.specimen_type.trim(),
      )
    ) {
      setError(t('validation.specimen'))
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        summary: summary.trim() || null,
        content: content.trim() || null,
        pre_test_preparation:
          preTestPreparation.trim() || null,
        test_code: testCode.trim(),
        loinc_code: loincCode.trim() || null,
        primary_category_id: primaryCategoryId,
        subcategory_id: subcategoryId,
        specimens: specimens.map(
          ({ id: _id, ...specimen }) => ({
            ...specimen,
            specimen_type: specimen.specimen_type.trim(),
            container: specimen.container?.trim() || null,
            handling_instructions:
              specimen.handling_instructions?.trim() || null,
          }),
        ),
        methods: methods.map(({ id: _id, ...method }) => ({
          ...method,
          method_name: method.method_name.trim(),
          description: method.description?.trim() || null,
        })),
        interpretations: interpretations.map(
          ({ id: _id, ...interpretation }) => ({
            ...interpretation,
            condition: interpretation.condition.trim(),
            interpretation:
              interpretation.interpretation.trim(),
            clinical_significance:
              interpretation.clinical_significance?.trim() || null,
            notes: interpretation.notes?.trim() || null,
          }),
        ),        reference_ranges: referenceRanges.map(
          ({ id: _id, ...range }) => ({
            ...range,
            specimen_type: range.specimen_type?.trim() || null,
            method_name: range.method_name?.trim() || null,
            population_label: range.population_label.trim(),
            age_unit: range.age_unit?.trim() || null,
            sex: range.sex?.trim() || null,
            unit: range.unit.trim(),
            notes: range.notes?.trim() || null,
          }),
        ),
      }

      if (mode === 'edit' && initialData) {
        await updateLaboratoryTestDraftAction({
          laboratory_test_id: initialData.laboratory_test_id,
          ...payload,
        })
        router.push('/knowledge?updated=1')
      } else {
        await createLaboratoryTestAction(payload)
        router.push('/knowledge?created=1')
      }

      router.refresh()
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : t('validation.generic'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <section className="space-y-5">
        <SectionTitle
          number="1"
          title={t('sections.basicInformation')}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label={t('fields.testName')}
            required
            value={title}
            onChange={setTitle}
            maxLength={300}
          />

          <Field
            label={t('fields.subtitle')}
            value={subtitle}
            onChange={setSubtitle}
            maxLength={300}
          />

          <Field
            label={t('fields.testCode')}
            required
            value={testCode}
            onChange={setTestCode}
            maxLength={100}
          />

          <Field
            label={t('fields.loincCode')}
            value={loincCode}
            onChange={setLoincCode}
            maxLength={100}
          />

          <SelectField
            label={t('fields.primaryCategory')}
            required
            value={primaryCategoryId}
            onChange={handlePrimaryCategoryChange}
            placeholder={t('fields.selectCategory')}
          >
            {parents.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label={t('fields.subcategory')}
            required
            value={subcategoryId}
            onChange={setSubcategoryId}
            placeholder={t('fields.selectSubcategory')}
            disabled={!primaryCategoryId}
          >
            {filteredSubcategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle
          number="2"
          title={t('sections.description')}
        />

        <TextAreaField
          label={t('fields.summary')}
          value={summary}
          onChange={setSummary}
          maxLength={1000}
          rows={4}
        />

        <TextAreaField
          label={t('fields.content')}
          value={content}
          onChange={setContent}
          rows={10}
        />
      </section>

      <section className="space-y-5">
        <SectionTitle
          number="3"
          title={t('sections.preparation')}
        />

        <TextAreaField
          label={t('fields.preTestPreparation')}
          value={preTestPreparation}
          onChange={setPreTestPreparation}
          rows={6}
        />
      </section>

      <section className="space-y-5">
        <SectionTitle
          number="4"
          title={t('sections.specimens')}
        />

        <div className="space-y-4">
          {specimens.map((specimen, index) => (
            <div
              key={specimen.id}
              className="rounded-xl border border-neutral-200 bg-neutral-50 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-neutral-900">
                  {t('specimen.title', { number: index + 1 })}
                </h3>

                {specimens.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSpecimens((current) =>
                        current.filter(
                          (item) => item.id !== specimen.id,
                        ),
                      )
                    }
                    disabled={submitting}
                    className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {t('actions.remove')}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label={t('fields.specimenType')}
                  required
                  value={specimen.specimen_type}
                  onChange={(value) =>
                    updateSpecimen(specimen.id, {
                      specimen_type: value,
                    })
                  }
                  disabled={submitting}
                />

                <Field
                  label={t('fields.container')}
                  value={specimen.container ?? ''}
                  onChange={(value) =>
                    updateSpecimen(specimen.id, {
                      container: value,
                    })
                  }
                  disabled={submitting}
                />

                <div className="md:col-span-2">
                  <TextAreaField
                    label={t('fields.handlingInstructions')}
                    value={specimen.handling_instructions ?? ''}
                    onChange={(value) =>
                      updateSpecimen(specimen.id, {
                        handling_instructions: value,
                      })
                    }
                    rows={4}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <AddButton
          label={t('actions.addSpecimen')}
          onClick={() =>
            setSpecimens((current) => [
              ...current,
              createSpecimen(),
            ])
          }
          disabled={submitting}
        />
      </section>

      <section className="space-y-5">
        <SectionTitle
          number="5"
          title={t('sections.referenceRanges')}
        />

        <div className="space-y-4">
          {referenceRanges.map((range, index) => (
            <div
              key={range.id}
              className="rounded-xl border border-neutral-200 bg-neutral-50 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-neutral-900">
                  {t('referenceRange.title', {
                    number: index + 1,
                  })}
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setReferenceRanges((current) =>
                      current.filter(
                        (item) => item.id !== range.id,
                      ),
                    )
                  }
                  disabled={submitting}
                  className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {t('actions.remove')}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field
                  label={t('fields.population')}
                  required
                  value={range.population_label}
                  onChange={(value) =>
                    updateReferenceRange(range.id, {
                      population_label: value,
                    })
                  }
                  disabled={submitting}
                />

                <Field
                  label={t('fields.sex')}
                  value={range.sex ?? ''}
                  onChange={(value) =>
                    updateReferenceRange(range.id, {
                      sex: value,
                    })
                  }
                  disabled={submitting}
                />

                <Field
                  label={t('fields.ageUnit')}
                  value={range.age_unit ?? ''}
                  onChange={(value) =>
                    updateReferenceRange(range.id, {
                      age_unit: value,
                    })
                  }
                  disabled={submitting}
                />

                <NumberField
                  label={t('fields.ageFrom')}
                  value={range.age_min}
                  onChange={(value) =>
                    updateReferenceRange(range.id, {
                      age_min: value,
                    })
                  }
                  disabled={submitting}
                />

                <NumberField
                  label={t('fields.ageTo')}
                  value={range.age_max}
                  onChange={(value) =>
                    updateReferenceRange(range.id, {
                      age_max: value,
                    })
                  }
                  disabled={submitting}
                />

                <Field
                  label={t('fields.unit')}
                  required
                  value={range.unit}
                  onChange={(value) =>
                    updateReferenceRange(range.id, {
                      unit: value,
                    })
                  }
                  disabled={submitting}
                />

                <NumberField
                  label={t('fields.lowerValue')}
                  value={range.lower_value}
                  onChange={(value) =>
                    updateReferenceRange(range.id, {
                      lower_value: value,
                    })
                  }
                  disabled={submitting}
                />

                <NumberField
                  label={t('fields.upperValue')}
                  value={range.upper_value}
                  onChange={(value) =>
                    updateReferenceRange(range.id, {
                      upper_value: value,
                    })
                  }
                  disabled={submitting}
                />

                <div className="md:col-span-2 lg:col-span-3">
                  <TextAreaField
                    label={t('fields.notes')}
                    value={range.notes ?? ''}
                    onChange={(value) =>
                      updateReferenceRange(range.id, {
                        notes: value,
                      })
                    }
                    rows={3}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <AddButton
          label={t('actions.addReferenceRange')}
          onClick={() =>
            setReferenceRanges((current) => [
              ...current,
              createReferenceRange(),
            ])
          }
          disabled={submitting}
        />
      </section>

      <section className="space-y-5">
        <SectionTitle
          number="6"
          title={t('sections.interpretation')}
        />

        <div className="space-y-4">
          {methods.map((method, index) => (
            <div
              key={method.id}
              className="rounded-xl border border-neutral-200 bg-neutral-50 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-neutral-900">
                  {t('method.title', { number: index + 1 })}
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setMethods((current) =>
                      current.filter(
                        (item) => item.id !== method.id,
                      ),
                    )
                  }
                  disabled={submitting}
                  className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {t('actions.remove')}
                </button>
              </div>

              <Field
                label={t('fields.method')}
                required
                value={method.method_name}
                onChange={(value) =>
                  updateMethod(method.id, {
                    method_name: value,
                  })
                }
                disabled={submitting}
              />

              <div className="mt-4">
                <TextAreaField
                  label={t('fields.methodDescription')}
                  value={method.description ?? ''}
                  onChange={(value) =>
                    updateMethod(method.id, {
                      description: value,
                    })
                  }
                  rows={4}
                  disabled={submitting}
                />
              </div>
            </div>
          ))}
        </div>

        <AddButton
          label={t('actions.addMethod')}
          onClick={() =>
            setMethods((current) => [
              ...current,
              createMethod(),
            ])
          }
          disabled={submitting}
        />

        <div className="space-y-4 pt-2">
          {interpretations.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-neutral-200 bg-neutral-50 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-neutral-900">
                  {t('interpretation.title', {
                    number: index + 1,
                  })}
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setInterpretations((current) =>
                      current.filter(
                        (entry) => entry.id !== item.id,
                      ),
                    )
                  }
                  disabled={submitting}
                  className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {t('actions.remove')}
                </button>
              </div>

              <div className="space-y-4">
                <Field
                  label={t('fields.condition')}
                  required
                  value={item.condition}
                  onChange={(value) =>
                    updateInterpretation(item.id, {
                      condition: value,
                    })
                  }
                  disabled={submitting}
                />

                <TextAreaField
                  label={t('fields.interpretation')}
                  required
                  value={item.interpretation}
                  onChange={(value) =>
                    updateInterpretation(item.id, {
                      interpretation: value,
                    })
                  }
                  rows={5}
                  disabled={submitting}
                />

                <TextAreaField
                  label={t('fields.clinicalSignificance')}
                  value={item.clinical_significance ?? ''}
                  onChange={(value) =>
                    updateInterpretation(item.id, {
                      clinical_significance: value,
                    })
                  }
                  rows={4}
                  disabled={submitting}
                />

                <TextAreaField
                  label={t('fields.notes')}
                  value={item.notes ?? ''}
                  onChange={(value) =>
                    updateInterpretation(item.id, {
                      notes: value,
                    })
                  }
                  rows={3}
                  disabled={submitting}
                />
              </div>
            </div>
          ))}
        </div>

        <AddButton
          label={t('actions.addInterpretation')}
          onClick={() =>
            setInterpretations((current) => [
              ...current,
              createInterpretation(),
            ])
          }
          disabled={submitting}
        />
      </section>

      <section className="space-y-5">
        <SectionTitle
          number="7"
          title={t('sections.images')}
        />

        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm leading-6 text-neutral-600">
          {t('images.comingNext')}
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push('/knowledge')}
          disabled={submitting}
          className="rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('actions.cancel')}
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? t('actions.saving')
            : t('actions.saveDraft')}
        </button>
      </div>
    </form>
  )
}

function SectionTitle({
  number,
  title,
}: {
  number: string
  title: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
        {number}
      </span>

      <h2 className="text-lg font-semibold text-neutral-900">
        {title}
      </h2>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required = false,
  maxLength,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  maxLength?: number
  disabled?: boolean
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-neutral-800">
        {label}
        {required ? (
          <span className="ms-1 text-red-600">*</span>
        ) : null}
      </span>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        disabled={disabled}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-100 disabled:text-neutral-500"
      />
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string
  value: number | null | undefined
  onChange: (value: number | null) => void
  disabled?: boolean
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-neutral-800">
        {label}
      </span>

      <input
        type="number"
        min="0"
        step="any"
        value={value ?? ''}
        onChange={(event) => {
          const raw = event.target.value
          onChange(raw === '' ? null : Number(raw))
        }}
        disabled={disabled}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-100 disabled:text-neutral-500"
      />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  required = false,
  maxLength,
  rows = 5,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  maxLength?: number
  rows?: number
  disabled?: boolean
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-neutral-800">
        {label}
        {required ? (
          <span className="ms-1 text-red-600">*</span>
        ) : null}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        className="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-100 disabled:text-neutral-500"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  children,
  required = false,
  placeholder,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  required?: boolean
  placeholder: string
  disabled?: boolean
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-neutral-800">
        {label}
        {required ? (
          <span className="ms-1 text-red-600">*</span>
        ) : null}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-neutral-100 disabled:text-neutral-500"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </label>
  )
}

function AddButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      + {label}
    </button>
  )
}
