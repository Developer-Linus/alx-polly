'use client';

import PollCreateForm from "./PollCreateForm";

/**
 * Poll creation page that enables authenticated users to create new polls.
 * 
 * Uses client-side rendering to support interactive form components with real-time
 * validation, dynamic option management, and immediate user feedback. This approach
 * enhances user experience during the poll creation process by providing responsive
 * interactions without page reloads.
 */
export default function CreatePollPage() {
  return (
    <main className="p-8">
      {/* Page header provides clear context for the user's current action */}
      <h1 className="text-2xl font-bold mb-6">Create a New Poll</h1>
      
      {/* Delegate complex form logic to specialized component for better separation of concerns */}
      <PollCreateForm />
    </main>
  );
}