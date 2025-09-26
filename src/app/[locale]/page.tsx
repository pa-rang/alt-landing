import { notFound } from "next/navigation";
import Image from "next/image";
import { WaitlistButton } from "@/components/waitlist-button";
import { isSupportedLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, Globe } from "lucide-react";

type HomePageProps = {
  params: { locale: string };
};

export default async function HomePage({ params }: { params: Promise<HomePageProps["params"]> }) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border bg-background/50 backdrop-blur px-4 py-1.5 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>AI-Powered Learning Platform</span>
                </div>
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                  Learn Smarter with
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {" "}
                    AI Transcript
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl">
                  Transform your learning experience with intelligent AI-powered transcript analysis, real-time audio
                  processing, and smart navigation.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <WaitlistButton locale={locale} dictionary={dictionary.waitlistForm}>
                  <Button size="lg" className="group">
                    Join Waitlist
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </WaitlistButton>
                <Button size="lg" variant="outline">
                  View Demo
                </Button>
              </div>
              <div className="flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Real-time Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Smart Navigation</span>
                </div>
              </div>
            </div>

            {/* Right Content - Screenshot */}
            <div className="relative">
              <div className="relative rounded-xl border bg-background/50 shadow-2xl backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                <Image
                  src="/alt_screenshot.png"
                  alt="AI Transcript Platform Screenshot"
                  width={800}
                  height={600}
                  className="relative z-10 w-full h-auto"
                  priority
                />
              </div>
              {/* Floating badges */}
              <div className="absolute -right-4 top-8 rounded-lg bg-background/90 backdrop-blur border px-4 py-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Instant Analysis</span>
                </div>
              </div>
              <div className="absolute -left-4 bottom-8 rounded-lg bg-background/90 backdrop-blur border px-4 py-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Multi-language</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      Features Section
      <section className="px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Powered by Cutting-Edge AI</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of learning with our advanced AI capabilities
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group relative rounded-xl border bg-background/50 backdrop-blur p-8 transition-all hover:shadow-lg hover:border-primary/50">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Smart Transcription</h3>
              <p className="text-muted-foreground">
                AI-powered real-time transcription with speaker identification and context understanding
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative rounded-xl border bg-background/50 backdrop-blur p-8 transition-all hover:shadow-lg hover:border-primary/50">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Instant Navigation</h3>
              <p className="text-muted-foreground">
                Jump to any part of the lecture with intelligent timestamp mapping and topic detection
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative rounded-xl border bg-background/50 backdrop-blur p-8 transition-all hover:shadow-lg hover:border-primary/50">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your data is encrypted and never shared. Full control over your learning materials
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-12 backdrop-blur">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Ready to Transform Your Learning?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of students and educators already using our platform
            </p>
            <WaitlistButton locale={locale} dictionary={dictionary.waitlistForm}>
              <Button size="lg" className="group">
                Get Early Access
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </WaitlistButton>
          </div>
        </div>
      </section>
    </div>
  );
}
