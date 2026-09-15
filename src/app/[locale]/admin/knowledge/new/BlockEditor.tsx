'use client'

import { useTranslations } from 'next-intl'
import ImageUpload from '@/components/auth/ImageUpload'
import type { BlockInput } from '@/app/[locale]/actions/knowledge'

export default function BlockEditor({
  block,
  index,
  total,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  block: BlockInput
  index: number
  total: number
  onChange: (updated: BlockInput) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}) {
  const t = useTranslations('KnowledgeAdmin')

  return (
    <div className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <select
          value={block.blockType}
          onChange={(e) => onChange({ ...block, blockType: e.target.value as BlockInput['blockType'] })}
          className="input w-auto"
        >
          <option value="text">{t('textBlock')}</option>
          <option value="image">{t('imageBlock')}</option>
          <option value="video">{t('videoBlock')}</option>
          <option value="list">{t('listBlock')}</option>
          <option value="quote">{t('quoteBlock')}</option>
        </select>

        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={block.isPaid}
            onChange={(e) => onChange({ ...block, isPaid: e.target.checked })}
          />
          {block.isPaid ? t('paidToggle') : t('freeToggle')}
        </label>
      </div>

      <input
        placeholder={`${t('subtitleLabel')} (EN)`}
        value={block.subtitleEn ?? ''}
        onChange={(e) => onChange({ ...block, subtitleEn: e.target.value })}
        className="input"
      />
      <input
        placeholder={`${t('subtitleLabel')} (AR)`}
        value={block.subtitleAr ?? ''}
        onChange={(e) => onChange({ ...block, subtitleAr: e.target.value })}
        className="input"
        dir="rtl"
      />

      {block.blockType === 'image' && (
        <ImageUpload
          value={block.mediaRef ?? ''}
          onChange={(ref) => onChange({ ...block, mediaRef: ref })}
          folder="/knowledge"
        />
      )}
      {block.blockType === 'video' && (
        <input
          placeholder={t('mediaUrlLabel')}
          value={block.mediaRef ?? ''}
          onChange={(e) => onChange({ ...block, mediaRef: e.target.value })}
          className="input"
        />
      )}

      <textarea
        placeholder={`${t('contentPlaceholder')} (EN)`}
        value={block.contentEn}
        onChange={(e) => onChange({ ...block, contentEn: e.target.value })}
        className="input min-h-16"
      />
      <textarea
        placeholder={`${t('contentPlaceholder')} (AR)`}
        value={block.contentAr}
        onChange={(e) => onChange({ ...block, contentAr: e.target.value })}
        className="input min-h-16"
        dir="rtl"
      />

      <div className="flex gap-3 text-xs">
        {index > 0 && (
          <button type="button" onClick={onMoveUp} className="text-primary-600">
            {t('moveUp')}
          </button>
        )}
        {index < total - 1 && (
          <button type="button" onClick={onMoveDown} className="text-primary-600">
            {t('moveDown')}
          </button>
        )}
        <button type="button" onClick={onDelete} className="text-red-500">
          {t('deleteBlock')}
        </button>
      </div>
    </div>
  )
}
