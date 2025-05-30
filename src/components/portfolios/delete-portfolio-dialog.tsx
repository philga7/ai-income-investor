import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeletePortfolioDialogProps {
  portfolioId: string;
  portfolioName: string;
}

export function DeletePortfolioDialog({ portfolioId, portfolioName }: DeletePortfolioDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { session } = useAuth();

  const handleDelete = async () => {
    if (!session?.access_token) {
      toast.error('You must be logged in to delete a portfolio');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete portfolio');
      }

      toast.success('Portfolio deleted successfully');
      router.push('/portfolios');
      router.refresh();
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete portfolio');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Portfolio</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{portfolioName}&quot;? This action cannot be undone.
            All securities in this portfolio will also be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 