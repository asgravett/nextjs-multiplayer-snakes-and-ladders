import { redirect } from 'next/navigation';

interface CatchAllProps {
  params: Promise<{ slug: string[] }>;
}

export default async function CatchAllPage({ params }: CatchAllProps) {
  const { slug } = await params;
  const path = slug.join('/');

  // Log the attempted path for debugging
  console.log(`Attempted to access unknown route: /${path}`);

  // Redirect to the 404 page (or you could redirect to home)
  redirect('/');
}
