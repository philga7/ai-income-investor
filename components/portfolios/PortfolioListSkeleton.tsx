import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PortfolioListSkeleton() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header and Create Button */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-44" />
      </div>
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 w-full sm:w-80" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      {/* Portfolio Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-full">
            <CardHeader className="relative pb-2">
              <Skeleton className="h-5 w-5 absolute right-6 top-6" />
              <CardTitle>
                <Skeleton className="h-6 w-32 mb-2" />
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 