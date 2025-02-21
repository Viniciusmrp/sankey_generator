'use client'

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import { SankeyData } from '@/lib/types'

interface SankeyDiagramProps {
  data: SankeyData
}

export default function SankeyDiagram({ data }: SankeyDiagramProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const trace = {
      type: "sankey",
      orientation: "h",
      node: {
        pad: 15,
        thickness: 30,
        line: {
          color: "black",
          width: 0.5
        },
        label: data.nodes,
        color: "blue"
      },
      link: {
        source: data.links.map(link => link.source),
        target: data.links.map(link => link.target),
        value: data.links.map(link => link.value)
      }
    }

    const layout = {
      title: "Sankey Diagram",
      width: 1000,
      height: 600
    }

    Plotly.newPlot(chartRef.current, [trace], layout)

    return () => {
      if (chartRef.current) {
        Plotly.purge(chartRef.current)
      }
    }
  }, [data])

  return <div ref={chartRef} />
} 