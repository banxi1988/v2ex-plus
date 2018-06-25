import { browser } from "@/browser-shims";

export default function(e: chrome.runtime.InstalledDetails) {
  // Open options page to initialize localStorage
  if (e.reason === "install") browser.runtime.openOptionsPage();
  if (e.reason === "update" && e.previousVersion === "1.3.4") {
    browser.notifications.create({
      type: "basic",
      iconUrl: "icon/icon38_msg.png",
      title: "我们刚刚进行了更新",
      message: "重构了设置页UI界面，更美观大气上档次。"
    });
    // browser.runtime.openOptionsPage();
  }
}
