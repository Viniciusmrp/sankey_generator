'use client'

import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import SankeyDiagram from '@/components/SankeyDiagram'
import { SankeyData } from '@/lib/types'

export default function Home() {
  const [sankeyData, setSankeyData] = useState<SankeyData | null>(null)

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Excel to Sankey Diagram</h1>
        <div className="space-y-8">
          <FileUpload onDataProcessed={setSankeyData} />
          {sankeyData && <SankeyDiagram data={sankeyData} />}
        </div>
      </div>
    </main>
  )
}
