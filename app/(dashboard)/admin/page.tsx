import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllPolls } from "@/app/lib/actions/poll-actions";
import { requireAdmin } from "@/app/lib/actions/auth-actions";
import { redirect } from "next/navigation";
import { DeletePollButton } from "./DeletePollButton";

interface Poll {
  id: string;
  question: string;
  user_id: string;
  created_at: string;
  options: string[];
}

export default async function AdminPage() {
  // Server-side admin authorization check
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/login?error=admin_required');
  }

  // Fetch all polls with admin authorization
  const { data: polls, error } = await getAllPolls();

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-gray-600 mt-2">
          View and manage all polls in the system.
        </p>
      </div>

      <div className="grid gap-4">
        {polls?.map((poll) => (
          <Card key={poll.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{poll.question}</CardTitle>
                  <CardDescription>
                    <div className="space-y-1 mt-2">
                      <div>
                        Poll ID:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {poll.id}
                        </code>
                      </div>
                      <div>
                        Owner ID:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {poll.user_id}
                        </code>
                      </div>
                      <div>
                        Created:{" "}
                        {new Date(poll.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardDescription>
                </div>
                <DeletePollButton pollId={poll.id} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium">Options:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {poll.options.map((option, index) => (
                    <li key={index} className="text-gray-700">
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!polls || polls.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          No polls found in the system.
        </div>
      )}
    </div>
  );
}
