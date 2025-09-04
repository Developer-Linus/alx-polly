"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  createPollSchema, 
  updatePollSchema, 
  submitVoteSchema, 
  uuidSchema,
  validateFormData,
  sanitizeHtml,
  sanitizeArray
} from "@/app/lib/validations/schemas";

// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  // Validate input data
  const validation = validateFormData(createPollSchema, formData);
  if (!validation.success) {
    const firstError = Object.values(validation.errors || {})[0]?.[0];
    return { error: firstError || "Invalid input data" };
  }

  const { question, options, allowMultipleVotes, requireAuthentication } = validation.data;
  
  // Sanitize inputs
  const sanitizedQuestion = sanitizeHtml(question);
  const sanitizedOptions = sanitizeArray(options);

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question: sanitizedQuestion,
      options: sanitizedOptions,
      allow_multiple_votes: allowMultipleVotes,
      require_authentication: requireAuthentication,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

// Secure version that checks ownership for editing
export async function getPollByIdForEdit(id: string) {
  const supabase = await createClient();
  const { getCurrentUser, isUserAdmin } = await import('./auth-actions');
  
  const user = await getCurrentUser();
  if (!user) {
    return { poll: null, error: 'You must be logged in to edit polls' };
  }

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { poll: null, error: error.message };
  }

  // Check if user owns the poll or is an admin
  const userIsAdmin = await isUserAdmin(user.id);
  if (data.user_id !== user.id && !userIsAdmin) {
    return { poll: null, error: 'You can only edit your own polls' };
  }

  return { poll: data, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  
  // Validate input data
  const voteValidation = submitVoteSchema.safeParse({ pollId, optionIndex });
  if (!voteValidation.success) {
    const firstError = voteValidation.error.errors[0]?.message;
    return { error: firstError || "Invalid vote data" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if poll exists and get its settings
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("require_authentication, options")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    return { error: "Poll not found" };
  }

  // Check authentication requirement
  if (poll.require_authentication && !user) {
    return { error: "You must be logged in to vote on this poll" };
  }

  // Validate option index against actual poll options
  if (optionIndex >= poll.options.length) {
    return { error: "Invalid option selected" };
  }

  // Check for duplicate votes if user is authenticated
  if (user) {
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      return { error: "You have already voted on this poll" };
    }
  }

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  revalidatePath(`/polls/${pollId}`);
  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();
  const { getCurrentUser, isUserAdmin } = await import('./auth-actions');
  
  // Validate poll ID format
  const idValidation = uuidSchema.safeParse(id);
  if (!idValidation.success) {
    return { error: 'Invalid poll ID format' };
  }
  
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to delete a poll' };
  }

  // First, check if the poll exists and get its owner
  const { data: poll, error: fetchError } = await supabase
    .from('polls')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !poll) {
    return { error: 'Poll not found' };
  }

  // Check if user owns the poll or is an admin
  const userIsAdmin = await isUserAdmin(user.id);
  if (poll.user_id !== user.id && !userIsAdmin) {
    return { error: 'You can only delete your own polls' };
  }

  // Delete associated votes first to maintain referential integrity
  const { error: votesError } = await supabase
    .from("votes")
    .delete()
    .eq("poll_id", id);

  if (votesError) {
    return { error: 'Failed to delete poll votes' };
  }

  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: error.message };
  
  revalidatePath("/polls");
  revalidatePath("/admin");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();
  const { isUserAdmin } = await import('./auth-actions');

  // Validate poll ID format
  const idValidation = uuidSchema.safeParse(pollId);
  if (!idValidation.success) {
    return { error: 'Invalid poll ID format' };
  }

  // Prepare form data for validation
  const formDataWithId = new FormData();
  formDataWithId.set('pollId', pollId);
  for (const [key, value] of formData.entries()) {
    formDataWithId.set(key, value);
  }

  // Validate input data
  const validation = validateFormData(updatePollSchema, formDataWithId);
  if (!validation.success) {
    const firstError = Object.values(validation.errors || {})[0]?.[0];
    return { error: firstError || "Invalid input data" };
  }

  const { question, options } = validation.data;
  
  // Sanitize inputs
  const sanitizedQuestion = sanitizeHtml(question);
  const sanitizedOptions = sanitizeArray(options);

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Check if poll exists and get ownership info
  const { data: existingPoll, error: fetchError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", pollId)
    .single();

  if (fetchError || !existingPoll) {
    return { error: "Poll not found" };
  }

  // Check ownership or admin status
  const userIsAdmin = await isUserAdmin(user.id);
  if (existingPoll.user_id !== user.id && !userIsAdmin) {
    return { error: "You can only update your own polls" };
  }

  // Update the poll
  const { error } = await supabase
    .from("polls")
    .update({ 
      question: sanitizedQuestion, 
      options: sanitizedOptions,
      updated_at: new Date().toISOString()
    })
    .eq("id", pollId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/polls/${pollId}`);
  revalidatePath(`/polls/${pollId}/edit`);
  revalidatePath("/polls");
  return { error: null };
}

// Admin-only function to fetch all polls
export async function getAllPolls() {
  const { requireAdmin } = await import('./auth-actions');
  
  try {
    // Verify admin access
    await requireAdmin();
    
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Access denied', data: null };
  }
}
