'use client';

import { useState, useEffect } from 'react';
import { 
  VerticalTimeline, 
  VerticalTimelineElement 
} from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { loadTimelineData } from '@/lib/timeline';
import { useDebounce } from '@/hooks/useDebounce';

interface DebateParticipant {
  slug: string;
  name: string;
  traits: Record<string, number>;
  text: string;
  deltaFromLast: Record<string, number>;
}

interface TimelineEvent {
  date: string;
  cluster: string;
  participants: DebateParticipant[];
}

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [personas, setPersonas] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [selectedTrait, setSelectedTrait] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const debouncedPersona = useDebounce(selectedPersona, 300);
  const debouncedTrait = useDebounce(selectedTrait, 300);

  const getTraitColor = (value: number) => {
    if (!selectedTrait) return 'rgb(33, 150, 243)';
    if (value > 0.7) return 'rgb(0, 200, 0)';
    if (value > 0.3) return 'rgb(255, 165, 0)';
    return 'rgb(200, 0, 0)';
  };

  useEffect(() => {
    const loadDebates = async () => {
      try {
        const timelineEvents = await loadTimelineData();
        setEvents(timelineEvents);
        
        // Extract unique personas for filter
        const uniquePersonas = Array.from(new Set(
          timelineEvents.flatMap(event => 
            event.participants.map(p => p.slug)
          )
        )).sort();
        setPersonas(uniquePersonas);
        
        // Extract unique traits for filter
        const uniqueTraits = Array.from(new Set(
          timelineEvents.flatMap(event =>
            event.participants.flatMap(p => Object.keys(p.traits))
          )
        )).sort();
        setTraits(uniqueTraits);
        
      } catch (error) {
        console.error('Error loading timeline data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDebates();
  }, []);

  // Filter events based on selected persona and trait
  useEffect(() => {
    let filtered = [...events];
    
    if (debouncedPersona) {
      filtered = filtered.filter(event =>
        event.participants.some(p => p.slug === debouncedPersona)
      );
    }

    setFilteredEvents(filtered);
  }, [events, debouncedPersona, debouncedTrait]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Debate Timeline</h1>
      
      {/* Filters */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Filter by Persona</label>
          <select 
            value={selectedPersona}
            onChange={(e) => setSelectedPersona(e.target.value)}
            className="w-full border rounded p-2 bg-white"
          >
            <option value="">All Personas</option>
            {personas.map(persona => (
              <option key={persona} value={persona}>
                {persona}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Trait Overlay</label>
          <select
            value={selectedTrait}
            onChange={(e) => setSelectedTrait(e.target.value)}
            className="w-full border rounded p-2 bg-white"
          >
            <option value="">No Trait Overlay</option>
            {traits.map(trait => (
              <option key={trait} value={trait}>
                {trait}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <VerticalTimeline>
        {filteredEvents.map((event, i) => (
          <VerticalTimelineElement
            key={i}
            date={new Date(event.date).toLocaleDateString()}
            iconStyle={{ 
              background: selectedTrait
                ? getTraitColor(
                    Math.max(
                      ...event.participants.map(p => p.traits[selectedTrait] || 0)
                    )
                  )
                : 'rgb(33, 150, 243)',
              color: '#fff'
            }}
          >
            <h3 className="font-bold mb-2">{event.cluster}</h3>
            <div className="space-y-4">
              {event.participants.map((participant, j) => (
                <Card key={j} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{participant.name}</h4>
                      <p className="text-sm mt-2">{participant.text}</p>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(participant.deltaFromLast).map(([trait, delta]) => (
                        <Badge 
                          key={trait}
                          variant={delta > 0 ? "default" : "secondary"}
                          className={`ml-2 ${selectedTrait === trait ? 'ring-2 ring-blue-500' : ''}`}
                        >
                          {trait}: {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(2)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </VerticalTimelineElement>
        ))}
      </VerticalTimeline>
    </div>
  );
}
