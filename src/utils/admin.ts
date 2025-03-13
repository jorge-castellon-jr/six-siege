export const isAdmin = () =>
  window.location.host.includes("localhost") ||
  window.location.search.includes("admin");
