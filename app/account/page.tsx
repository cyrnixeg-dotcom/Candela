import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Navigation from "@/components/store/Navigation";
import ShoppingBag from "@/components/store/ShoppingBag";
import ChatWidget from "@/components/store/ChatWidget";
import AccountView from "@/components/store/AccountView";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch orders for this user
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: true }
      }
    }
  });

  return (
    <main className="min-h-screen bg-candela-cream">
      <Navigation />
      <ShoppingBag />
      <ChatWidget />
      <AccountView user={session.user} orders={orders} />
    </main>
  );
}
