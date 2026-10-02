import { redirect } from "next/navigation";

import { AppNav } from "@/components/app-nav";
import { getCurrentSession } from "@/lib/auth";

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <AppNav session={session} />
      {children}
    </>
  );
}
