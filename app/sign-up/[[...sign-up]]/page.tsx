import { AuthForm } from "@/components/auth-form";
import { redirect } from "next/navigation";

export default function SignUpPage() {
  if (process.env.BETTER_AUTH_DISABLE_SIGN_UP !== "false") {
    redirect("/sign-in");
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <AuthForm mode="sign-up" />
    </main>
  );
}
