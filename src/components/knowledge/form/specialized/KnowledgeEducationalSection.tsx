import { KnowledgeFormSection } from '../KnowledgeFormSection'

type Props = {
  labels: {
    sectionTitle: string
    sectionDescription: string
  }
}

export function KnowledgeEducationalSection({ labels }: Props) {
  return (
    <KnowledgeFormSection
      title={labels.sectionTitle}
      description={labels.sectionDescription}
    >
      <p className="text-sm leading-6 text-neutral-600">
        Educational content uses the shared Core and Content
        sections. No additional structured entity is required.
      </p>
    </KnowledgeFormSection>
  )
}
