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

  // Fetch orders for this user by userId or email with zero-crash fallback
  let orders: any[] = [];
  try {
    const userEmail = session.user.email?.toLowerCase();
    orders = await prisma.order.findMany({
      where: {
        OR: [
          ...(session.user.id ? [{ userId: session.user.id }] : []),
          ...(userEmail ? [{ user: { email: userEmail } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  } catch (err) {
    console.warn("Could not fetch user orders in account page:", err);
    orders = [];
  }

  return (
    <main className="min-h-screen bg-candela-cream">
      <Navigation />
      <ShoppingBag />
      <ChatWidget />
      <AccountView user={session.user} orders={orders} />
    </main>
  );
}
