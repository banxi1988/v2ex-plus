import { postNewMsgNotification } from "@/services/notifications";
import { browser } from "@/browser-shims";
import { V2EXUrls } from "@/v2ex";
//——————————————————————————————————检查收藏主题新回复——————————————————————————————————
//——————————————————————————————————通知功能——————————————————————————————————
//现在是每5分钟刷新一次状态，除非点击了browserAction
export async function checkMsg() {
  try {
    const data = await $.get(V2EXUrls.settings);
    const sign = RegExp("([0-9]*?) (条未读提醒|unread)").exec(data);
    const signText = (sign != null && sign[1]) || "未登录";
    if (signText == "未登录") {
      browser.browserAction.setIcon({ path: "icon/icon38_nologin.png" });
    } else if (signText != "0") {
      browser.browserAction.setIcon({ path: "icon/icon38_msg.png" });
      postNewMsgNotification();
    } else {
      browser.browserAction.setIcon({ path: "icon/icon38.png" });
    }
  } catch (error) {
    alert("V2EX消息获取失败：" + status);
  }
}
