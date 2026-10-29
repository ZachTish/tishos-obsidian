import { Notice } from "obsidian";

interface AppAction {
  id: string;
  name: string;
  /** An app-supported deep link. Omit to use the link saved in settings. */
  link?: string;
}

// Add an entry only after the native app supports its link. IDs stay stable.
export const APP_ACTIONS: readonly AppAction[] = [
  { id: "open-app", name: "Open TishOS app" },
];

export function validateAppLink(input: string): string {
  const link = input.trim();
  if (!link) throw new Error("Set an app link in TishOs settings first.");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(link) || /\s/.test(link)) {
    throw new Error("Use an app link such as appname:// or a complete HTTPS link. Encode spaces as %20.");
  }
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    throw new Error("Enter a valid app link.");
  }
  if (["http:", "javascript:", "data:", "file:", "blob:", "about:", "vbscript:"].includes(url.protocol)
    || url.username || url.password) {
    throw new Error("Use a native app link or an HTTPS link without embedded credentials.");
  }
  // Preserve the app's exact URL, including its encoded parameters.
  return link;
}

export function openAppLink(input: string): void {
  let link: string;
  try {
    link = validateAppLink(input);
  } catch (error) {
    new Notice((error as Error).message);
    return;
  }
  try {
    // Obsidian routes external URLs through the device. A null return does not
    // tell us whether a native app opened, so do not infer success or failure.
    window.open(link);
  } catch {
    new Notice("Could not open the app link. Check that the app is installed and supports this link.");
  }
}
