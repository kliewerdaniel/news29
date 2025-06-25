"use client";

import { useEffect, useState } from "react";
import * as d3 from "d3";
import { ResponsiveHeatMap } from "@nivo/heatmap";

interface HeatmapCell {
  x: string;
  y: number;
  serieId: string;
}

interface HeatmapData {
  id: string;
  data: HeatmapCell[];
}

interface CustomTooltipProps {
  cell: {
    data: {
      x: string;
      y: number;
      serieId: string;
    };
  };
}

export default function ClusterHeatmap() {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/clusters/global");
        const result = await response.json();
        
        // Transform the data into Nivo heatmap format
        const formattedData: HeatmapData[] = Object.entries(result).map(([y, values]: [string, any]) => ({
          id: y,
          data: values.map((value: number, x: number) => ({
            x: `x${x}`,
            y: value,
            serieId: y
          }))
        }));
        
        setData(formattedData);
      } catch (error) {
        console.error("Failed to fetch cluster data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Topic Density Heatmap</h1>
      <div className="h-[600px] w-full">
        <ResponsiveHeatMap
          data={data}
          margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
          valueFormat=">-.2f"
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: "",
            legendOffset: 46
          }}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: "",
            legendOffset: 46
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Topics",
            legendPosition: "middle",
            legendOffset: -72
          }}
          colors={{
            type: "sequential",
            scheme: "reds"
          }}
          emptyColor="#f5f5f5"
          borderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
          enableLabels={true}
          labelTextColor={{ from: "color", modifiers: [["darker", 2]] }}
          animate={true}
          motionConfig="gentle"
          hoverTarget="cell"
          tooltip={({ cell }: CustomTooltipProps) => (
            <div className="bg-white p-2 shadow-lg rounded-lg border border-gray-200">
              <strong>{cell.data.serieId}</strong> ({cell.data.x}): {cell.data.y.toFixed(2)}
            </div>
          )}
        />
      </div>
    </div>
  );
}
