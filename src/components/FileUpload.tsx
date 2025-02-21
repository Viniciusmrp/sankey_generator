'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { SankeyData } from '@/lib/types'

interface FileUploadProps {
  onDataProcessed: (data: SankeyData) => void
}

export default function FileUpload({ onDataProcessed }: FileUploadProps) {
  const [error, setError] = useState<string>('')

  const processExcelFile = (file: File) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)

        // Process data for Sankey diagram
        const nodes = new Set<string>()
        const links: { source: string; target: string; value: number }[] = []
        const valueCounts: { [key: string]: number } = {}

        jsonData.forEach((row: any) => {
          const oldValue = String(row['old_value'])
          const newValue = String(row['new_value'])
          
          nodes.add(oldValue)
          nodes.add(newValue)

          const link = `${oldValue}-${newValue}`
          valueCounts[link] = (valueCounts[link] || 0) + 1
        })

        // Convert to Sankey format
        const nodesArray = Array.from(nodes)
        const sankeyData: SankeyData = {
          nodes: nodesArray,
          links: Object.entries(valueCounts).map(([key, value]) => {
            const [source, target] = key.split('-')
            return {
              source: nodesArray.indexOf(source),
              target: nodesArray.indexOf(target),
              value
            }
          })
        }

        onDataProcessed(sankeyData)
        setError('')
      } catch (err) {
        setError('Error processing file. Please check the file format.')
      }
    }

    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processExcelFile(file)
        }}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  )
} 