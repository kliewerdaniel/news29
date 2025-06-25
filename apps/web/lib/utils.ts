import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function generateTimelineColors(type: string): {
  bg: string
  border: string
  text: string
} {
  switch (type) {
    case 'persona_update':
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-800'
      }
    case 'cluster_created':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800'
      }
    case 'article_published':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800'
      }
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-800'
      }
  }
}
