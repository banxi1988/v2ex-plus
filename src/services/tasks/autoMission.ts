import { getSettings } from "@/settings";
import { storage } from "@/storage";
import { postAutoMissionSuccessNotification } from "@/services/notifications";
import { V2EXUrls, regExpService } from "@/v2ex";

//——————————————————————————————————通知/按钮点击反馈——————————————————————————————————
//——————————————————————————————————自动签到——————————————————————————————————
export default async function autoMission() {
  const settings = await getSettings();
  if (settings.autoMission == new Date().getUTCDate()) {
    //console.log('今天已经成功领取奖励了');
    return;
  }
  console.log("开始签到");
  try {
    const homePage = await $.ajax({ url: V2EXUrls.home });
    let sign = homePage.match("/signout(\\?once=[0-9]+)");
    sign = (sign != null && sign[1]) || "未登录";

    if (sign == "未登录") {
      return;
    }
    const data = await $.ajax({
      url: V2EXUrls.redeem + sign
    });
    if (data.search("查看我的账户余额")) {
      let days = regExpService.findMissionDays(data);
      if (days && settings.autoMissionMsg) {
        postAutoMissionSuccessNotification(days);
      }
      storage.set({ autoMission: new Date().getUTCDate() });
    } else {
      alert(
        "罕见错误！基本可以忽略，如果你遇见两次以上请联系开发者，当该提示已打扰到您，请关闭扩展的自动签到功能。"
      );
    }
  } catch (error) {
    console.error(error);
    alert("网络错误！今日奖励领取失败，等待一小时后自动重试或现在手动领取。");
  }
}
