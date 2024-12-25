export function cleanURL(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsedURL = new URL(url, "https://www.linkedin.com");
    return parsedURL.origin + parsedURL.pathname;
  } catch {
    return url;
  }
}
