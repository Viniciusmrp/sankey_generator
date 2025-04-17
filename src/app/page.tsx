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
        <h1 className="text-3xl font-bold mb-4">Excel to Sankey Diagram</h1>
        <p className="text-gray-600 mb-8">
          Generate Sankey diagrams from Excel data in different formats.
        </p>
        
        <div className="space-y-8">
          <FileUpload onDataProcessed={setSankeyData} />
          
          {sankeyData && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Your Sankey Diagram</h2>
              <SankeyDiagram data={sankeyData} />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}