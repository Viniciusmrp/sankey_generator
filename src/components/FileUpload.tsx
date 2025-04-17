'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { SankeyData } from '@/lib/types'

interface FileUploadProps {
  onDataProcessed: (data: SankeyData) => void
}

type DataFormat = 'oldNewColumns' | 'timestampColumns'

export default function FileUpload({ onDataProcessed }: FileUploadProps) {
  const [error, setError] = useState<string>('')
  const [dataFormat, setDataFormat] = useState<DataFormat>('oldNewColumns')

  const processTimestampData = (jsonData: any[]) => {
    // Process data for timestamp-based format
    const nodes = new Set<string>()
    const valueCounts: { [key: string]: number } = {}
    
    // Get all column names (excluding any you don't want to consider)
    const columnNames = Object.keys(jsonData[0]).filter(col => 
      col !== 'id' && col !== 'name' && col !== 'description'
    )
    
    // Add all columns as potential nodes
    columnNames.forEach(col => nodes.add(col))
    
    // Process each row (element)
    jsonData.forEach(row => {
      const timestampEntries: { column: string; timestamp: Date }[] = []
      
      // Collect valid timestamps with their columns
      columnNames.forEach(column => {
        const timestamp = row[column]
        if (timestamp && timestamp !== '') {
          // Convert Excel date number or string to Date object
          let date: Date
          if (typeof timestamp === 'number') {
            // Excel stores dates as days since 1900-01-01
            date = new Date(Math.round((timestamp - 25569) * 86400 * 1000))
          } else {
            date = new Date(timestamp)
          }
          
          if (!isNaN(date.getTime())) {
            timestampEntries.push({ column, timestamp: date })
          }
        }
      })
      
      // Sort timestamps chronologically
      timestampEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      
      // Create links between consecutive states
      for (let i = 0; i < timestampEntries.length - 1; i++) {
        const source = timestampEntries[i].column
        const target = timestampEntries[i + 1].column
        const link = `${source}-${target}`
        valueCounts[link] = (valueCounts[link] || 0) + 1
      }
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
    
    return sankeyData
  }

  const processOldNewColumnsData = (jsonData: any[]) => {
    // Process data for original format (old_value, new_value)
    const nodes = new Set<string>()
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
    
    return sankeyData
  }

  const processExcelFile = (file: File) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)

        if (jsonData.length === 0) {
          setError('No data found in the Excel file.')
          return
        }

        let sankeyData: SankeyData

        if (dataFormat === 'oldNewColumns') {
          // Validate data format for old_value/new_value
          if (!('old_value' in jsonData[0]) || !('new_value' in jsonData[0])) {
            setError('File does not contain the required columns: old_value and new_value')
            return
          }
          sankeyData = processOldNewColumnsData(jsonData)
        } else {
          // For timestamp columns format
          sankeyData = processTimestampData(jsonData)
        }

        onDataProcessed(sankeyData)
        setError('')
      } catch (err) {
        console.error(err)
        setError('Error processing file. Please check the file format.')
      }
    }

    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Data Format:</label>
        <select 
          value={dataFormat}
          onChange={(e) => setDataFormat(e.target.value as DataFormat)}
          className="mt-1 block w-64 pl-3 pr-10 py-2 text-base border-gray-300 
                    focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="oldNewColumns">Old/New Value Columns</option>
          <option value="timestampColumns">Timestamp Columns</option>
        </select>
      </div>
      
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
      
      {dataFormat === 'timestampColumns' && (
        <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700">
          <p className="font-medium">Timestamp Format Instructions:</p>
          <p>Your Excel file should have multiple columns where each column represents a stage/category.</p>
          <p>Each cell should contain a timestamp (date) indicating when the item entered that stage.</p>
          <p>The Sankey diagram will show the flow between stages based on chronological order.</p>
        </div>
      )}
      
      {dataFormat === 'oldNewColumns' && (
        <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700">
          <p className="font-medium">Old/New Format Instructions:</p>
          <p>Your Excel file should have two columns named 'old_value' and 'new_value'.</p>
          <p>Each row represents a transition from the old value to the new value.</p>
        </div>
      )}
    </div>
  )
}