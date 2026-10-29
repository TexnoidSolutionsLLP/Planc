import { LoginForm } from "./login-form";

const NOTICES: Record<string, string> = {
  suspended: "This account is suspended. Contact Sellly support if you think this is a mistake.",
  staff: "Sellly staff accounts can't sign in to the merchant dashboard. Use the platform admin app.",
  link: "That link has expired or was already used. Log in, or request a new reset link.",
};

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return <LoginForm notice={searchParams.error ? NOTICES[searchParams.error] : undefined} />;
}
