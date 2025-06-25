import { FC } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import html2pdf from 'html2pdf.js'

interface Props {
  contentId: string // ID of the element to export
  filename: string
  className?: string
}

export const ExportPDF: FC<Props> = ({ contentId, filename, className }) => {
  const handleExport = () => {
    const element = document.getElementById(contentId)
    if (!element) return

    const opt = {
      margin: 1,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    }

    html2pdf().set(opt).from(element).save()
  }

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      className={className}
    >
      <FileDown className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  )
}

export default ExportPDF
