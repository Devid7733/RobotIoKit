import Footer from "@/components/layout/Footer";
import FloatingChatButton from "@/components/layout/FloatingChatButton";
import Navbar from "@/components/layout/Navbar";
import { listStorefrontCategories, toStorefrontCategory } from "@/services/productService";

export default async function StorefrontShell({ children }) {
  let categories = [];
  try {
    const rawCategories = await listStorefrontCategories();
    categories = rawCategories.map(toStorefrontCategory);
  } catch {
    // categories stays [] — navbar renders without dropdown items
  }

  return (
    <div className="page-shell">
      <Navbar categories={categories} />
      <main>{children}</main>
      <Footer />
      <FloatingChatButton />
    </div>
  );
}
