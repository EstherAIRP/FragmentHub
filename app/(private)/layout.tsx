import { redirect } from "next/navigation";

import { AppNav } from "@/components/app-nav";
import { isAuthenticated } from "@/lib/auth";

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  return (
    <>
      <AppNav />
      {children}
    </>
  );
}
