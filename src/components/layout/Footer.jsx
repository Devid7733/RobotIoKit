import Link from "next/link";

const footerColumns = [
  {
    title: "Quick Links",
    links: [
      { label: "Home", href: "/" },
      { label: "All Products", href: "/products" },
      { label: "Robot Kits", href: "/robot-kits" },
      { label: "My Orders", href: "/orders" },
      { label: "Cart", href: "/cart" }
    ]
  },
  {
    title: "Categories",
    links: [
      { label: "Controllers", href: "/products?category=controllers" },
      { label: "Sensors", href: "/products?category=sensors" },
      { label: "Motor Drivers", href: "/products?category=motor-drivers" },
      { label: "Motors", href: "/products?category=motors" },
      { label: "Power", href: "/products?category=power" },
      { label: "IoT Modules", href: "/products?category=iot-modules" }
    ]
  }
];

const socialLinks = [
  { label: "Facebook", href: "#", className: "bg-blue-600" },
  { label: "YouTube", href: "#", className: "bg-red-500" },
  { label: "WhatsApp", href: "#", className: "bg-emerald-500" }
];

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-slate-200">
      <div className="storefront-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr,0.9fr,0.9fr,1.1fr]">
          <div>
            <div className="font-display text-[2rem] font-bold tracking-tight text-white">
              Robot<span className="text-brand-orange">Io</span>Kit
            </div>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
              Your trusted source for robotics components, development boards, sensors, and
              complete robot kits for engineers, students, and hobbyists.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-label={link.label}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${link.className}`}
                >
                  {link.label.charAt(0)}
                </Link>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-white">{column.title}</h3>
              <div className="mt-5 space-y-3 text-sm">
                {column.links.map((link) => (
                  <Link key={link.label} href={link.href} className="block text-slate-300 transition hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold text-white">Contact Us</h3>
            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <p>Street 271, Phnom Penh, Cambodia</p>
              <p>+855 12 345 678</p>
              <p>hello@robotiokit.com</p>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <div className="font-medium text-white">Store Hours</div>
              <p className="mt-2">Mon - Sat: 8:00 AM - 6:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div>© 2026 RobotIoKit. All rights reserved.</div>
          <Link href="/privacy" className="transition hover:text-white">
            Privacy Notice
          </Link>
          <div>Built for Robotics Engineers & Enthusiasts</div>
        </div>
      </div>
    </footer>
  );
}
