"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 space-y-4 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center">Welcome to News29</h1>
        <p className="text-gray-600 text-center">Sign in to manage your personas and timelines</p>
        <Button
          className="w-full"
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
        >
          Sign in with GitHub
        </Button>
      </Card>
    </div>
  );
}
