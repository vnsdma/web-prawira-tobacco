import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border">
        <CardHeader className="text-center flex flex-col items-center">
          <Skeleton className="h-16 w-16 rounded-full mb-4" />
          <Skeleton className="h-7 w-48 rounded-md" />
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Skeleton className="h-4 w-3/4 mx-auto rounded-md" />
          <div className="bg-raised p-4 rounded-lg space-y-2">
            <Skeleton className="h-4 w-full rounded-md" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  )
}
