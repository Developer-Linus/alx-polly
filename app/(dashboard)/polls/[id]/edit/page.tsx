import { getPollByIdForEdit } from '@/app/lib/actions/poll-actions';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Import the client component
import EditPollForm from './EditPollForm';

export default async function EditPollPage({ params }: { params: { id: string } }) {
  const { poll, error } = await getPollByIdForEdit(params.id);

  if (error) {
    if (error.includes('logged in')) {
      redirect('/login?error=auth_required');
    }
    
    if (error.includes('only edit your own')) {
      return (
        <div className="max-w-md mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                You can only edit polls that you created.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    notFound();
  }

  if (!poll) {
    notFound();
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Poll</h1>
      <EditPollForm poll={poll} />
    </div>
  );
}