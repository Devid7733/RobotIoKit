export function getInitials(user) {
  const source = user?.name || user?.email || "Customer";
  const parts = source.replace(/@.*/, "").split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
