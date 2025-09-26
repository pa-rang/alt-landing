import { WaitlistForm } from "@/components/waitlist-form";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Alt Landing 웨이팅 리스트에 참여하세요
          </h1>
          <p className="text-base text-muted-foreground">
            빠르게 테스트하고 피드백을 주실 분을 찾고 있습니다. 이메일과 플랫폼을 남겨주시면 초대장을 가장 먼저 보내드릴게요.
          </p>
        </div>
        <div className="mx-auto w-full">
          <WaitlistForm />
        </div>
      </div>
    </div>
  );
}
