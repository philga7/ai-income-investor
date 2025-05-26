'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PublicRoute } from '@/components/auth/public-route';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <PublicRoute>
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Check your email</CardTitle>
            <CardDescription className="text-center">
              We sent you a verification link. Please check your email and click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              If you don&apos;t see the email, check your spam folder.
            </p>
            <Button asChild variant="outline">
              <Link href="/auth/sign-in">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PublicRoute>
  );
} 