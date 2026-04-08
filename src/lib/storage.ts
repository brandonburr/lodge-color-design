const USERNAME_KEY = "mcbi-username";

export function getUsername(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(USERNAME_KEY) || "";
}

export function setUsername(name: string): void {
  localStorage.setItem(USERNAME_KEY, name);
}
