import { LoginForm } from "./login-form";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return <LoginForm notice={searchParams.error === "denied" ? "That account doesn't have Sellly staff access." : undefined} />;
}
