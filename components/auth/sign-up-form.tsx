'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AuthError } from '@supabase/supabase-js';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export function SignUpForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      const { error } = await signUp(data.email, data.password);
      
      if (error) {
        // Only log detailed errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Signup error in form:', {
            error,
            code: (error as AuthError).code,
            message: error.message,
            name: error.name,
            status: (error as AuthError).status
          });
        }
        
        // Handle specific Supabase error messages
        let userMessage = 'An unexpected error occurred during sign up';
        
        switch ((error as AuthError).code) {
          case 'email_address_invalid':
            userMessage = 'Please enter a valid email address';
            break;
          case 'user_already_registered':
            userMessage = 'This email is already registered. Please sign in instead.';
            break;
          case 'weak_password':
            userMessage = 'Password must be at least 6 characters long';
            break;
          default:
            if (error.message?.includes('already registered')) {
              userMessage = 'This email is already registered. Please sign in instead.';
            } else if (error.message?.includes('password')) {
              userMessage = 'Password must be at least 6 characters long';
            }
        }

        toast.error(userMessage);
        return;
      }

      toast.success('Account created successfully! Please check your email to verify your account.');
      router.push('/auth/verify-email');
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      toast.error('An unexpected error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </Form>
  );
} 