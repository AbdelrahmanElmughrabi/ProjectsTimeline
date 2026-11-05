import { join } from 'node:path';

export const appUrl = 'app://workspace/index.html';
export const contentSecurityPolicy = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'";

export function rendererAsset(url: string, rendererDirectory: string): string | undefined {
  const parsed = new URL(url);
  if (parsed.protocol !== 'app:' || parsed.host !== 'workspace' || parsed.username || parsed.password) return;
  // Only the build's document and hashed JS/CSS are served; no arbitrary paths reach the filesystem.
  if (parsed.pathname === '/index.html' || parsed.pathname === '/') return join(rendererDirectory, 'index.html');
  if (/^\/assets\/[A-Za-z0-9_-]+\.(js|css)$/.test(parsed.pathname)) return join(rendererDirectory, parsed.pathname.slice(1));
}

export function trustedSender(senderId: number, frame: unknown, windowId: number, mainFrame: unknown, url: string): boolean {
  return senderId === windowId && frame === mainFrame && url === appUrl;
}
