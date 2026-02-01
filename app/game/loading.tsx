import { Card, CardContent, LoadingSpinner } from '@/components/ui';

export default function GameLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card variant="elevated" className="p-8">
        <CardContent className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 font-medium">Loading game...</p>
        </CardContent>
      </Card>
    </div>
  );
}