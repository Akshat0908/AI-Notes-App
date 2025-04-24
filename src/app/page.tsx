'use client'; // Needed for onClick handler

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation'; // Import useRouter
import { useState, FormEvent } from 'react'; // Removed useEffect
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'; // Import Card components
// Import Dialog components and form elements
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea" // Import Textarea
// Import AlertDialog components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
// Import Icons from lucide-react
import { Plus, LogOut, Loader2, Trash2, FilePenLine, NotebookPen, Sparkles } from 'lucide-react';
// Import React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define a type for our note structure
type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
};

// --- API Fetching/Mutation Functions --- 

// Function to fetch notes
const fetchNotes = async (): Promise<Note[]> => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    throw new Error('Failed to fetch notes. Please try again.');
  }
  return data || [];
};

// Function to create a note
const createNote = async (newNote: { title: string; content: string; user_id: string }): Promise<Note> => {
  const { data, error } = await supabase
    .from('notes')
    .insert([newNote])
    .select()
    .single();

  if (error) {
    console.error("Error creating note:", error);
    throw new Error(error.message || 'Failed to create note. Please try again.');
  }
  return data as Note;
};

// Function to delete a note
const deleteNote = async (noteId: string): Promise<void> => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .match({ id: noteId });

  if (error) {
    console.error("Error deleting note:", error);
    throw new Error(error.message || 'Failed to delete note. Please try again.');
  }
};

// Function to update a note
const updateNote = async (updatedNote: { id: string; title: string; content: string }): Promise<Note> => {
  const { data, error } = await supabase
    .from('notes')
    .update({ title: updatedNote.title, content: updatedNote.content })
    .match({ id: updatedNote.id })
    .select()
    .single();

  if (error) {
    console.error("Error updating note:", error);
    throw new Error(error.message || 'Failed to update note. Please try again.');
  }
  return data as Note;
};

// Function to call our backend API for summarization
const getSummary = async (content: string): Promise<{ summary: string }> => {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get summary from backend.');
  }

  return response.json();
};

// --- Component --- 

export default function HomePage() {
  const router = useRouter(); // Initialize router
  const queryClient = useQueryClient(); // Get query client instance

  // --- React Query Hooks --- 

  // Fetch notes using useQuery
  const { data: notes = [], isLoading: loadingNotes, error: fetchNotesError } = useQuery<Note[], Error>({
    queryKey: ['notes'], // Unique key for this query
    queryFn: fetchNotes, // Function to fetch data
  });

  // Mutation for creating notes
  const createNoteMutation = useMutation<Note, Error, { title: string; content: string; user_id: string }>({ 
    mutationFn: createNote, // Function to call for mutation
    onSuccess: (newNote) => {
      // Invalidate and refetch the 'notes' query to update the list
      // queryClient.invalidateQueries({ queryKey: ['notes'] }); 
      // OR: Optimistically update the cache immediately
      queryClient.setQueryData<Note[]>(['notes'], (oldNotes = []) => [newNote, ...oldNotes]);
      
      setNewNoteTitle(''); // Reset form
      setNewNoteContent('');
      setIsCreateDialogOpen(false); // Close dialog on success
    },
    onError: (error) => {
      // Error is accessible via createNoteMutation.error
      console.error('Mutation error:', error); 
      // No need to set specific createError state, use mutation state directly
    }
  });

  // Mutation for deleting notes
  const deleteNoteMutation = useMutation<void, Error, string>({ // Takes noteId (string) as input
    mutationFn: deleteNote,
    onSuccess: (data, noteId) => {
      // Invalidate and refetch
      // queryClient.invalidateQueries({ queryKey: ['notes'] });
      // OR: Optimistically update
      queryClient.setQueryData<Note[]>(['notes'], (oldNotes = []) => 
        oldNotes.filter((note) => note.id !== noteId)
      );
      setIsDeleteDialogOpen(false); // Close dialog
      setNoteToDeleteId(null);
    },
    onError: (error) => {
       // Error accessible via deleteNoteMutation.error
      console.error('Delete mutation error:', error);
      // Set error state for the dialog
      setDialogDeleteError(error.message || 'Failed to delete note. Please try again.');
    }
  });

  // Mutation for updating notes
  const updateNoteMutation = useMutation<Note, Error, { id: string; title: string; content: string }>({ 
    mutationFn: updateNote,
    onSuccess: (updatedNoteData) => {
      // Optimistically update the specific note in the cache
      queryClient.setQueryData<Note[]>(['notes'], (oldNotes = []) =>
        oldNotes.map((note) =>
          note.id === updatedNoteData.id ? updatedNoteData : note
        )
      );
      setIsEditDialogOpen(false); // Close dialog
    },
    onError: (error) => {
      console.error('Update mutation error:', error);
      // Set error state for the edit dialog
      setDialogEditError(error.message || 'Failed to update note.');
    }
  });

  // Mutation for getting summary
  const summarizeMutation = useMutation<{ summary: string }, Error, string>({ // Input is note content (string)
    mutationFn: getSummary,
    onSuccess: (data) => {
      // Set state to display the summary
      setCurrentSummary(data.summary);
      setIsSummaryDialogOpen(true);
    },
    onError: (error) => {
      // Set error state for the summary dialog
      console.error('Summarize mutation error:', error);
      setDialogSummaryError(error.message || 'Failed to get summary.');
      setIsSummaryDialogOpen(true); // Open dialog to show error
    }
  });

  // --- Component State (Mostly for UI interaction) --- 
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  // Error state specifically for the delete dialog feedback
  const [dialogDeleteError, setDialogDeleteError] = useState<string | null>(null); 

  // State for Edit Note dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');
  const [dialogEditError, setDialogEditError] = useState<string | null>(null);

  // State for Summary Dialog
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [dialogSummaryError, setDialogSummaryError] = useState<string | null>(null);
  const [noteBeingSummarized, setNoteBeingSummarized] = useState<string | null>(null); // Track which note is loading

  // --- Event Handlers --- 

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
      // TODO: Show error to user, e.g., using a toast notification
    } else {
      // Redirect to login page after successful logout
      // router.push('/login'); // Use router.push
      // For now, a simple reload might suffice as middleware will redirect
      window.location.reload(); 
    }
  };

  // Handle Create Note Form Submission
  const handleCreateNoteSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      // Optionally show validation error directly in the form
      console.error('Title and content cannot be empty.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('User not found.'); // Or handle error better
        // Maybe set an error state for the create form
        return;
    }

    // Call the mutation
    createNoteMutation.mutate({ 
      title: newNoteTitle, 
      content: newNoteContent, 
      user_id: user.id 
    });
  };

  // Handle opening delete dialog
  const openDeleteDialog = (noteId: string) => {
    setNoteToDeleteId(noteId);
    setDialogDeleteError(null); // Clear previous dialog errors
    setIsDeleteDialogOpen(true);
  };

  // Handle confirming deletion
  const confirmDeleteNote = () => {
    if (!noteToDeleteId) return;
    setDialogDeleteError(null); // Clear error on retry
    deleteNoteMutation.mutate(noteToDeleteId);
  };

  // Handle opening the edit dialog
  const handleOpenEditDialog = (note: Note) => {
    console.log("Opening edit dialog for note:", note.id);
    setNoteToEdit(note);
    setEditNoteTitle(note.title);
    setEditNoteContent(note.content);
    setDialogEditError(null); // Clear previous errors
    setIsEditDialogOpen(true);
  };

  // Handle Edit Note Form Submission
  const handleEditNoteSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!noteToEdit) return;
    
    setDialogEditError(null); // Clear error on retry/resubmit

    if (!editNoteTitle.trim() || !editNoteContent.trim()) {
      setDialogEditError('Title and content cannot be empty.');
      return;
    }

    updateNoteMutation.mutate({ 
      id: noteToEdit.id, 
      title: editNoteTitle, 
      content: editNoteContent 
    });
  };

  // Handle clicking the summarize button
  const handleSummarize = (noteId: string, content: string) => {
    setCurrentSummary(null); // Clear previous summary/error
    setDialogSummaryError(null);
    setNoteBeingSummarized(noteId); // Set loading state for this note
    summarizeMutation.mutate(content); 
  };

  // --- Helper Functions --- 
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // --- Render Logic --- 
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/5 via-background to-background"> {/* Gradient starts with subtle primary */} 
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-primary/10 bg-gradient-to-r from-background to-primary/5 backdrop-blur-sm"> {/* Give header a slightly more prominent background */}
        <div className="container flex h-16 items-center space-x-4 justify-between">
          <a className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity" href="/">
            <NotebookPen className="h-6 w-6" />
            <span className="inline-block font-bold text-lg">
              AI Notes App
            </span>
          </a>
          <nav className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleLogout}> {/* Changed to icon button */} 
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span> {/* Screen reader text */} 
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Your Notes</h1>
          {/* Create Note Dialog Trigger */} 
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground"> {/* Explicitly ensure primary styling */} 
                <Plus className="mr-2 h-5 w-5" />
                Create Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
                <DialogDescription>
                  Enter the title and content for your new note.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateNoteSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4"> {/* Changed items-center to items-start for Textarea alignment */} 
                    <Label htmlFor="content" className="text-right pt-2"> {/* Added padding-top for alignment */} 
                      Content
                    </Label>
                    <Textarea
                      id="content"
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="col-span-3"
                      required
                      rows={6} // Give textarea some height
                    />
                  </div>
                  {/* Display mutation error directly */}
                  {createNoteMutation.error && <p className="text-destructive text-sm col-span-4">{createNoteMutation.error.message}</p>}
                </div>
                <DialogFooter>
                  <DialogClose asChild> 
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  {/* Use mutation state for button */}
                  <Button type="submit" disabled={createNoteMutation.isPending}>
                    {createNoteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {createNoteMutation.isPending ? 'Creating...' : 'Save Note'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Display Area */} 
        <div className="min-h-[400px]"> {/* Added min-height */} 
          {loadingNotes && ( /* Skeleton Loader */
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/60 animate-pulse">
                  <CardHeader className="pb-4">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mt-1"></div> {/* Date placeholder */} 
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-border/60">
                    <div className="h-9 bg-muted rounded w-1/4 ml-auto"></div>
                    <div className="h-9 bg-muted rounded w-1/4 ml-2"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          {fetchNotesError && (
            <div className="flex flex-col items-center justify-center h-full text-destructive border-2 border-dashed border-destructive/50 rounded-lg p-12">
               <h3 className="text-xl font-semibold mb-2">Error Loading Notes</h3>
               <p>{fetchNotesError.message}</p> {/* Use error from useQuery */} 
            </div>
          )} 
          {!loadingNotes && !fetchNotesError && (
            notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-border rounded-lg p-12 text-center bg-gradient-to-br from-card to-muted/30"> {/* Subtle gradient for empty state */} 
                <NotebookPen className="h-12 w-12 text-primary/50 mb-4" /> {/* Use subtle primary for icon */} 
                <h3 className="text-xl font-semibold mb-2">No notes yet!</h3>
                <p className="text-muted-foreground mb-6">
                  Ready to capture your thoughts? Click the button below.
                </p>
                 <Button 
                    size="lg" 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground" /* Explicit primary */
                 >
                    <Plus className="mr-2 h-5 w-5" />
                    Create Your First Note
                 </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {notes.map((note) => (
                  <Card key={note.id} className="flex flex-col border border-border/60 hover:shadow-xl hover:border-primary/50 transition-all duration-200 bg-card overflow-hidden"> {/* Added overflow-hidden */}
                    <CardHeader className="pb-2 border-b border-border/60 bg-muted/30"> {/* Header background + border */} 
                      <CardTitle className="text-xl tracking-tight text-primary">{note.title}</CardTitle> {/* Primary color title */} 
                      <CardDescription className="text-xs pt-1 text-muted-foreground">
                        {formatDate(note.created_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow p-4"> {/* Standard padding */} 
                      <p className="text-sm text-foreground/80 line-clamp-4">
                        {note.content}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 p-3 border-t border-border/60 bg-muted/30"> {/* Consistent padding/bg */} 
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 border-primary/30 text-primary/80 hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          console.log('Edit button clicked for note:', note.id);
                          handleOpenEditDialog(note);
                        }}
                        disabled={updateNoteMutation.isPending}
                      >
                        <FilePenLine className="h-4 w-4" />
                        <span className="sr-only">Edit Note</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 border-purple-500/30 text-purple-600 hover:bg-purple-100 dark:border-purple-400/40 dark:text-purple-400 dark:hover:bg-purple-900/30" // Accent color for AI
                        onClick={() => handleSummarize(note.id, note.content)}
                        disabled={summarizeMutation.isPending && noteBeingSummarized === note.id} // Disable while summarizing this note
                      >
                        {summarizeMutation.isPending && noteBeingSummarized === note.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" /> 
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        <span className="sr-only">Summarize Note</span>
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => openDeleteDialog(note.id)} 
                        disabled={deleteNoteMutation.isPending && noteToDeleteId === note.id} // Disable if deleting this specific note
                      >
                        {/* Show spinner if deleting this specific note */} 
                        {deleteNoteMutation.isPending && noteToDeleteId === note.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        <span className="sr-only">Delete Note</span>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>
      </main>

      {/* Global Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open: boolean) => setIsDeleteDialogOpen(open)}>
         <AlertDialogContent>
             <AlertDialogHeader>
               <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
               <AlertDialogDescription>
                 This action cannot be undone. This will permanently delete this note.
                 {/* Use separate dialog error state */}
                 {dialogDeleteError && <p className="text-destructive text-sm mt-2">{dialogDeleteError}</p>} 
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
               <AlertDialogCancel onClick={() => setNoteToDeleteId(null)}>Cancel</AlertDialogCancel>
               {/* Use mutation state for button */}
               <AlertDialogAction onClick={confirmDeleteNote} disabled={deleteNoteMutation.isPending} className="bg-destructive hover:bg-destructive/90">
                 {deleteNoteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" /> } 
                 {deleteNoteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
               </AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
      </AlertDialog>

      {/* Edit Note Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Update the title and content of your note.
            </DialogDescription>
          </DialogHeader>
          {/* Check if noteToEdit exists before rendering form */}
          {noteToEdit && (
            <form onSubmit={handleEditNoteSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-title" className="text-right">Title</Label>
                  <Input
                    id="edit-title"
                    value={editNoteTitle}
                    onChange={(e) => setEditNoteTitle(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="edit-content" className="text-right pt-2">Content</Label>
                  <Textarea
                    id="edit-content"
                    value={editNoteContent}
                    onChange={(e) => setEditNoteContent(e.target.value)}
                    className="col-span-3"
                    required
                    rows={6}
                  />
                </div>
                {dialogEditError && <p className="text-destructive text-sm col-span-4">{dialogEditError}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={updateNoteMutation.isPending}>
                  {updateNoteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {updateNoteMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Summary Display Dialog */}
      <Dialog open={isSummaryDialogOpen} onOpenChange={(open) => { 
        setIsSummaryDialogOpen(open); 
        if (!open) { // Reset state when dialog closes
          setCurrentSummary(null); 
          setDialogSummaryError(null); 
          setNoteBeingSummarized(null); 
          summarizeMutation.reset(); // Reset mutation state
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" /> AI Summary
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm">
            {summarizeMutation.isPending && noteBeingSummarized && <p className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating summary...</p>} 
            {dialogSummaryError && <p className="text-destructive">Error: {dialogSummaryError}</p>} 
            {currentSummary && !dialogSummaryError && <p>{currentSummary}</p>} 
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer (Optional) */}
      <footer className="py-6 mt-16 border-t border-border/40"> {/* Increased margin */}
        <div className="container flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Built with Next.js, Supabase, and shadcn/ui.
          </p>
        </div>
      </footer>
    </div>
  );
}
