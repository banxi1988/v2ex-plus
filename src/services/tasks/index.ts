import { browser } from "@/browser-shims";
import { getSettings } from "@/settings";
import { AlarmNames } from "@/services/alarms";
import { clean_msg } from "@/services/notifications";
import { checkMsg } from "@/services/tasks/checkMsg";
import { followMsg } from "@/services/tasks/followMsg";
import { collectMsg } from "@/services/tasks/collectMsg";
import autoMission from "@/services/tasks/autoMission";
import autoLoginWeibo from "@/services/tasks/autoLoginWeibo";

//——————————————————————————————————定时任务初始化、获取自定义节点——————————————————————————————————
let urlPrefix = "";
async function runMsgTasks() {
  const settings = await getSettings();
  if (settings.newMsg) {
    checkMsg();
  }
  if (settings.followMsg) {
    followMsg();
  }
  if (settings.collectMsg) {
    collectMsg();
  }
  urlPrefix = settings.customNode || "www";
  console.log(urlPrefix);
}

async function runAutoMissionTasks() {
  const settings = await getSettings();
  if (settings.autoMission) {
    autoMission();
  }
  if (settings.autoLoginWeibo) {
    autoLoginWeibo();
  }
}

browser.alarms.create(AlarmNames.checkMsg, { periodInMinutes: 5 });
browser.alarms.create(AlarmNames.autoMission, { periodInMinutes: 30 });

function handleAlarms(alarm: chrome.alarms.Alarm) {
    switch (alarm.name) {
        case AlarmNames.checkMsg:
            runMsgTasks();
            break;
        case AlarmNames.autoMission:
            runAutoMissionTasks();
            break;
    }
}

browser.alarms.onAlarm.addListener(handleAlarms);

//——————————————————————————————————通知功能——————————————————————————————————

//——————————————————————————————————通知/按钮点击反馈——————————————————————————————————



browser.commands.onCommand.addListener(clean_msg);
browser.browserAction.onClicked.addListener(clean_msg);


//——————————————————————————————————自动登陆微博——————————————————————————————————
