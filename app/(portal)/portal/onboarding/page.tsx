export default function PortalOnboardingPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Almost ready</h1>
      <p className="text-sm text-muted-foreground">
        We could not locate a FullStride client profile linked to your account yet. Please contact your practice so they can
        invite you or complete your registration.
      </p>
    </div>
  );
}
