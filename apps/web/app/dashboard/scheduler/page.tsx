"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function SchedulerPage() {
  const [interval, setInterval] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch("/api/schedule");
        const data = await response.json();
        setInterval(data.interval.toString());
      } catch (error) {
        console.error("Error fetching schedule:", error);
        toast({
          title: "Error",
          description: "Failed to fetch current schedule",
          variant: "destructive",
        });
      }
    };

    fetchSchedule();
  }, []);

  const updateSchedule = async () => {
    if (!interval || isNaN(Number(interval))) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of hours",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: Number(interval) }),
      });

      if (!response.ok) throw new Error("Failed to update schedule");

      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">🕒 Auto-Refresh Schedule</h1>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Refresh Interval (hours)</label>
            <Input
              type="number"
              min="1"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              placeholder="Enter hours..."
              className="w-full"
            />
          </div>
          <p className="text-sm text-gray-600">
            Set how often the system should automatically refresh and analyze new content
          </p>
          <Button 
            onClick={updateSchedule}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Updating..." : "Update Schedule"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
