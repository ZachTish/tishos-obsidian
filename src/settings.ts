import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type TishOsPlugin from "./main";
import { validateAppLink } from "./app-actions";

export class TishOsSettingsTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: TishOsPlugin) {
    super(app, plugin);
  }

  display(): void {
    this.containerEl.empty();
    let draft = this.plugin.settings.appLink;
    new Setting(this.containerEl)
      .setName("App link")
      .setDesc("Used by “Open TishOS app”. Paste a link supported by the native app, then save. Saving does not open the app.")
      .addText(text => {
        text.inputEl.setAttribute("aria-label", "TishOS app link");
        text.setPlaceholder("App link or HTTPS link")
          .setValue(draft)
          .onChange(value => { draft = value; });
      })
      .addButton(button => button.setButtonText("Save").onClick(async () => {
        let appLink: string;
        try {
          appLink = draft.trim() ? validateAppLink(draft) : "";
        } catch (error) {
          new Notice((error as Error).message);
          return;
        }
        const settings = { ...this.plugin.settings, appLink };
        try {
          await this.plugin.saveData(settings);
          this.plugin.settings = settings;
          new Notice(appLink ? "App link saved." : "App link cleared.");
        } catch {
          new Notice("Could not save the app link. Try saving again.");
        }
      }));
  }
}
