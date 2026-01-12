import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface FaqItemProps {
  question: string
  answer: string
}

export default function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-2 border-black rounded-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold">{question}</span>
        {isOpen ? <ChevronUp className="h-5 w-5 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-4 py-3 border-t-2 border-black bg-gray-50">
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{answer}</div>
        </div>
      )}
    </div>
  )
}