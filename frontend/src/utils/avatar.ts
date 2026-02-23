// Default avatar jako data URL - vždy funguje
export const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%234a5568'/%3E%3Ccircle cx='50' cy='40' r='18' fill='%23718096'/%3E%3Cellipse cx='50' cy='85' rx='28' ry='25' fill='%23718096'/%3E%3C/svg%3E";

export function getAvatarUrl(avatar: string | null | undefined): string {
  if (!avatar || avatar === '' || avatar === 'null' || avatar === 'undefined') {
    return DEFAULT_AVATAR;
  }
  return avatar;
}

