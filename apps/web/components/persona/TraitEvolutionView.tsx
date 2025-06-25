'use client'

import { useEffect, useState } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend
} from 'recharts'

type TraitEvolutionViewProps = {
  originalTraits: Record<string, number>
  evolvedTraits: Record<string, number>
}

export function TraitEvolutionView({
  originalTraits,
  evolvedTraits
}: TraitEvolutionViewProps) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    // Transform traits data for radar chart
    const data = Object.entries(originalTraits).map(([trait, originalValue]) => ({
      trait,
      original: originalValue,
      evolved: evolvedTraits[trait],
      difference: Number((evolvedTraits[trait] - originalValue).toFixed(2))
    }))
    setChartData(data)
  }, [originalTraits, evolvedTraits])

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h3 className="text-lg font-semibold mb-4">Trait Evolution</h3>
      
      {/* Radar Chart */}
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="trait" />
            <Radar
              name="Original"
              dataKey="original"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
            />
            <Radar
              name="Evolved"
              dataKey="evolved"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.3}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Trait Changes Table */}
      <div className="mt-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Trait</th>
              <th className="py-2">Original</th>
              <th className="py-2">Evolved</th>
              <th className="py-2">Change</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item) => (
              <tr key={item.trait} className="border-b">
                <td className="py-2">{item.trait}</td>
                <td className="py-2">{item.original.toFixed(2)}</td>
                <td className="py-2">{item.evolved.toFixed(2)}</td>
                <td className="py-2">
                  <span
                    className={
                      item.difference > 0
                        ? 'text-green-600'
                        : item.difference < 0
                        ? 'text-red-600'
                        : ''
                    }
                  >
                    {item.difference > 0 ? '+' : ''}
                    {item.difference.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
