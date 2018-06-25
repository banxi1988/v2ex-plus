import { browser } from "@/browser-shims";

export function resetAlarm(
  name: string,
  delayInMillisec: number,
  periodInMinutes: number
) {
  browser.alarms.clear(name);
  setTimeout(function() {
    browser.alarms.create(name, { periodInMinutes: periodInMinutes });
    console.log(name + "定时任务重建完成");
  }, delayInMillisec); //多少毫秒后重建定时任务
}

export const enum AlarmNames {
  checkMsg = "checkMsg",
  autoMission = "autoMission"
}


