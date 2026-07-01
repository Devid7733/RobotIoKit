import Link from "next/link";

export default function AuthCard({ title, subtitle, buttonLabel, alternateLabel, alternateHref, alternateText }) {
  return (
    <div className="surface-card w-full max-w-md p-8">
      <div className="text-center">
        <Link href="/" className="font-display text-4xl font-bold text-brand-blue">
          Robot<span className="text-brand-orange">Io</span>Kit
        </Link>
        <h1 className="mt-6 font-display text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>
      <form className="mt-8 space-y-4">
        {title === "Create your account" ? (
          <input className="input-base" placeholder="Full name" type="text" />
        ) : null}
        <input className="input-base" placeholder="Email address" type="email" />
        <input className="input-base" placeholder="Password" type="password" />
        {title === "Create your account" ? (
          <>
            <input className="input-base" placeholder="Phone number" type="text" />
            <select className="input-base text-slate-500" defaultValue="">
              <option value="" disabled>
                Select province
              </option>
              <option>Phnom Penh</option>
              <option>Kandal</option>
              <option>Siem Reap</option>
            </select>
          </>
        ) : (
          <div className="text-right text-sm">
            <Link href="#" className="font-medium text-brand-blue">
              Forgot password?
            </Link>
          </div>
        )}
        <button type="submit" className="button-blue w-full">
          {buttonLabel}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        {alternateText}{" "}
        <Link href={alternateHref} className="font-semibold text-brand-blue">
          {alternateLabel}
        </Link>
      </p>
    </div>
  );
}
