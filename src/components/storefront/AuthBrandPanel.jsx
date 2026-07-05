import Icon from "@/components/common/Icon";

const features = [
  "Track orders in real time",
  "Curated robot kits & components",
  "Robot kits for every skill level"
];

export default function AuthBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-blue to-[#101a33] lg:flex lg:flex-col lg:justify-center lg:px-16 lg:py-12">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-orange/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <div className="relative">
        <span className="font-display text-4xl font-bold tracking-tight text-white">
          Robot<span className="text-brand-orange">Io</span>Kit
        </span>
        <p className="mt-6 max-w-sm text-lg leading-8 text-white/80">
          Robotics kits, curated components, and fast delivery — all in one place.
        </p>

        <ul className="mt-10 space-y-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-white/90">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Icon name="checkCircle" className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
