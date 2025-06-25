'use client';

import { motion } from 'framer-motion';

interface TraitProgressProps {
  value: number;
  max?: number;
  animate?: boolean;
}

export function TraitProgressBar({ value, max = 100, animate = true }: TraitProgressProps) {
  const width = (value / max) * 100;

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <motion.div 
        className="bg-blue-600 h-2 rounded-full"
        initial={animate ? { width: 0 } : { width: `${width}%` }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}
