import { FC } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { format } from 'date-fns'

interface TraitEvolutionData {
  date: string
  traits: Record<string, number>
}

interface Props {
  data: TraitEvolutionData[]
  className?: string
}

// Convert evolution data into format suitable for line chart
const prepareLineChartData = (data: TraitEvolutionData[]) => {
  return data.map(point => ({
    date: format(new Date(point.date), 'MMM d'),
    ...point.traits
  }))
}

// Get first and last trait snapshots for radar comparison
const prepareRadarData = (data: TraitEvolutionData[]) => {
  if (data.length < 2) return []
  
  const firstTraits = data[0].traits
  const lastTraits = data[data.length - 1].traits
  
  return Object.keys(firstTraits).map(trait => ({
    trait,
    start: firstTraits[trait],
    end: lastTraits[trait]
  }))
}

// Get all unique trait names
const getTraitNames = (data: TraitEvolutionData[]) => {
  const traitSet = new Set<string>()
  data.forEach(point => {
    Object.keys(point.traits).forEach(trait => traitSet.add(trait))
  })
  return Array.from(traitSet)
}

// Generate a color for each trait
const getTraitColor = (index: number) => {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d88484']
  return colors[index % colors.length]
}

export const TraitEvolutionChart: FC<Props> = ({ data, className }) => {
  const lineChartData = prepareLineChartData(data)
  const radarData = prepareRadarData(data)
  const traits = getTraitNames(data)

  if (data.length < 2) {
    return <div className="text-center p-4">Not enough data to show evolution</div>
  }

  return (
    <div className={className}>
      {/* Line Chart */}
      <div className="h-[300px] mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 1]} />
            <Tooltip />
            <Legend />
            {traits.map((trait, index) => (
              <Line
                key={trait}
                type="monotone"
                dataKey={trait}
                stroke={getTraitColor(index)}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Radar Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="trait" />
            <PolarRadiusAxis domain={[0, 1]} />
            <Radar
              name="Start of Year"
              dataKey="start"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
            />
            <Radar
              name="End of Year"
              dataKey="end"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.3}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TraitEvolutionChart
