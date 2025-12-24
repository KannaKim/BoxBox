import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardContent from "@/app/components/DashboardContent";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/register");
  }

  return <DashboardContent session={session} />;
}

