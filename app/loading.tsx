import { Card, CardContent, LoadingSpinner } from '@/components/ui';

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card variant="elevated" className="p-8">
        <CardContent className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 font-medium">Loading...</p>
        </CardContent>
      </Card>
    </div>
  );
}
