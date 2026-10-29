import { Plugin } from "obsidian";
import { APP_ACTIONS, openAppLink } from "./app-actions";
import { TishOsSettingsTab } from "./settings";

export default class TishOsPlugin extends Plugin {
  settings = { appLink: "" };

  async onload(): Promise<void> {
    const saved = await this.loadData();
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      this.settings = {
        ...saved,
        appLink: typeof saved.appLink === "string" ? saved.appLink : "",
      };
    }

    for (const action of APP_ACTIONS) {
      this.addCommand({
        id: action.id,
        name: action.name,
        callback: () => openAppLink(action.link ?? this.settings.appLink),
      });
    }
    this.addSettingTab(new TishOsSettingsTab(this.app, this));
  }
}
