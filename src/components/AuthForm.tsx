'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetState = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setMessage(null);
  };

  const handleAuthAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    console.log('Handling auth action. isSignUp:', isSignUp);

    if (isSignUp) {
      // Handle Sign Up
      console.log('Attempting Sign Up...');
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Optional: email redirect URL for email confirmation
          // emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage('Sign up successful! Please check your email to confirm your account.');
        // Optionally reset form or redirect
        resetState();
        setIsSignUp(false); // Switch back to login view after successful signup
      }
    } else {
      // Handle Sign In
      console.log('Attempting Sign In...');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        // Login successful message is less useful as middleware handles redirect
        // setMessage('Login successful! Redirecting...');
        // No need to manually redirect or reload, middleware will handle it
      }
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetState();
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{isSignUp ? 'Sign Up' : 'Login'}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Enter your details to create an account.' : 'Enter your email below to login to your account.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuthAction}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-500 text-sm">{message}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full">{isSignUp ? 'Sign Up' : 'Sign In'}</Button>
            <Button type="button" variant="link" onClick={toggleMode} className="w-full">
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 