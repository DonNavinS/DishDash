import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      <div className="container flex flex-col items-center gap-8 px-4 py-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
            DishDash
          </h1>
          <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
            Track, plan, and share your restaurant adventures
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                Your mobile-first PWA for discovering and logging amazing meals
              </p>
              <Button className="w-full" size="lg">
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-2 font-semibold">ToDo Eat List</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Save restaurants you want to try
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-2 font-semibold">Log Visits</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Track meals with friends and ratings
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-2 font-semibold">Discover Trends</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                See your dining patterns and favorites
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
