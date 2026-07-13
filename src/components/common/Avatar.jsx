import { getInitials } from "@/lib/userDisplay";

export default function Avatar({
  user,
  src,
  className = "h-10 w-10",
  fallbackClassName = "bg-brand-blue text-base font-semibold text-white"
}) {
  const imageSrc = src ?? user?.avatarUrl ?? user?.image ?? "";

  if (imageSrc) {
    return <img src={imageSrc} alt="" className={`${className} rounded-full object-cover`} />;
  }

  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full ${className} ${fallbackClassName}`}>
      {getInitials(user)}
    </span>
  );
}
