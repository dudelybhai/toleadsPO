import { AuthForm } from "@/components/auth-form";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <AuthForm
        mode="sign-in"
        allowSignUp={process.env.BETTER_AUTH_DISABLE_SIGN_UP === "false"}
      />
    </main>
  );
}
