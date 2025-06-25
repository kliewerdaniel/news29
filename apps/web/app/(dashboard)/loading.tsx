import { Card, CardHeader, CardContent } from '@/components/ui/card';

function LoadingCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded-md animate-pulse w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              </div>
              <div className="flex gap-2">
                {[1, 2].map(j => (
                  <div key={j} className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto mt-1 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoadingPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 bg-gray-200 rounded-md w-48 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded-md w-64 mt-2 animate-pulse" />
        </div>
        <div className="flex gap-4 items-center">
          <div className="h-9 bg-gray-200 rounded-md w-24 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded-md w-32 animate-pulse" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <LoadingCard key={i} />
        ))}
      </div>
    </div>
  );
}
