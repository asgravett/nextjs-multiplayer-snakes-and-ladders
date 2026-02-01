// Using Button
import { Button } from '@/components/ui';

<Button variant="primary" size="lg" isLoading={isSubmitting}>
  Start Game
</Button>;

// Using Card
import { Card, CardHeader, CardContent } from '@/components/ui';

<Card variant="elevated" hoverable>
  <CardHeader title="Room Name" icon={<span>🎮</span>} />
  <CardContent>Room content here</CardContent>
</Card>;

// Using ErrorMessage
import { ErrorMessage } from '@/components/ui';

<ErrorMessage
  message="Connection failed"
  variant="error"
  dismissible
  onDismiss={() => setError(null)}
/>;
