import { signIn } from "@sellly/auth";
import { Button, Card, Input, Label } from "@sellly/ui";

async function login(formData: FormData) {
  "use server";
  await signIn("credentials", {
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: "/",
  });
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm items-center">
      <Card className="w-full">
        <h1 className="text-[20px] font-semibold tracking-tight text-primary">Platform admin</h1>
        <p className="mt-1 text-small text-muted">Sign in with a platform administrator account.</p>
        <form action={login} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </Card>
    </div>
  );
}
