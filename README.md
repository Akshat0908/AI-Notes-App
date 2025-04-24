# AI Notes App

A mini AI-powered notes application built with Next.js, Supabase, Tailwind CSS, Shadcn UI, and Groq for AI summarization.

[![Deploy with Vercel](https://vercel.com/button)](https://ai-notes-app-2h4d-e779wcr94-aakshat846-gmailcoms-projects.vercel.app/) <!-- Replace with your actual Vercel deployment URL if different -->

**Live Demo:** [https://ai-notes-app-2h4d-e779wcr94-aakshat846-gmailcoms-projects.vercel.app/](https://ai-notes-app-2h4d-e779wcr94-aakshat846-gmailcoms-projects.vercel.app/) <!-- Replace with your actual Vercel deployment URL if different -->

## Features

*   **User Authentication:** Secure sign-up and login using email and password via Supabase Auth.
*   **Note Management (CRUD):**
    *   **Create:** Add new notes with a title and content.
    *   **Read:** View all notes created by the logged-in user.
    *   **Delete:** Remove notes with a confirmation step.
    *   **Edit
*   **AI Summarization:** Generate concise summaries of note content using the Groq API (Llama 3 model).
*   **Responsive Design:** UI built with Shadcn UI and Tailwind CSS, adapting to different screen sizes.
*   **Efficient Data Handling:** Uses React Query for server state management (fetching, caching, mutations).

## Tech Stack

*   **Framework:** Next.js 15+ (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** Shadcn UI
*   **Backend:** Supabase (Authentication, PostgreSQL Database)
*   **State Management:** TanStack Query (React Query) v5
*   **AI Summarization:** Groq API
*   **Icons:** Lucide React
*   **Deployment:** Vercel

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn or pnpm
*   A Supabase account and project ([supabase.com](https://supabase.com/))
*   A Groq API key ([groq.com](https://groq.com/))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Akshat0908/AI-Notes-App.git
    cd ai-notes-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up Supabase:**
    *   Log in to your Supabase project dashboard.
    *   Go to the **SQL Editor** section.
    *   Create a new query and run the following SQL to create the `notes` table and enable Row Level Security (RLS):
        ```sql
        -- Create the notes table
        create table notes (
          id uuid default uuid_generate_v4() primary key,
          title text not null,
          content text not null,
          user_id uuid references auth.users not null,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null
        );

        -- Enable Row Level Security
        alter table notes enable row level security;

        -- Create policies
        create policy "Users can view their own notes"
          on notes for select
          using (auth.uid() = user_id);

        create policy "Users can insert their own notes"
          on notes for insert
          with check (auth.uid() = user_id);

        -- Optional: Add update/delete policies if implementing edit/delete
        create policy "Users can update their own notes"
          on notes for update
          using (auth.uid() = user_id);

        create policy "Users can delete their own notes"
          on notes for delete
          using (auth.uid() = user_id);
        ```
    *   Go to **Project Settings** > **API**. Find your Project URL and `anon` public key.

4.  **Set up Environment Variables:**
    *   Create a file named `.env.local` in the root of the `ai-notes-app` directory.
    *   Add the following environment variables, replacing the placeholder values with your actual keys:
        ```plaintext
        NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        GROQ_API_KEY=YOUR_GROQ_API_KEY
        ```

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

6.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This application is deployed on Vercel. The deployment requires setting the same environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GROQ_API_KEY`) in the Vercel project settings.

---
