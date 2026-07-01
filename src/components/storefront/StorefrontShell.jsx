import Footer from "@/components/layout/Footer";
import FloatingChatButton from "@/components/layout/FloatingChatButton";
import Navbar from "@/components/layout/Navbar";
import { listStorefrontCategories, toStorefrontCategory } from "@/services/productService";

export default async function StorefrontShell({ children }) {
  const rawCategories = await listStorefrontCategories();
  const categories = rawCategories.map(toStorefrontCategory);

  return (
    <div className="page-shell">
      <Navbar categories={categories} />
      <main>{children}</main>
      <Footer />
      <FloatingChatButton />
    </div>
  );
}
