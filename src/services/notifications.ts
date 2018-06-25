import { browser } from "@/browser-shims";
import { AlarmNames, resetAlarm } from "@/services/alarms";
import { localStorageItems } from "@/local_storage";

export const enum NotificationIds {
  newMsg = "newMsg",
  autoMission = "autoMission",
  newFollowTopic = "newFollowTopic",
  newCollectTopicReply = "newCollectTopicReply"
}

//清除通知图标，打开通知地址
export function clean_msg() {
  browser.browserAction.setIcon({ path: "icon/icon38.png" });
  browser.tabs.create({ url: `https://www.v2ex.com/notifications` });
}

function handleNotifications(notificationId: string) {
  switch (notificationId) {
    case NotificationIds.newMsg:
      clean_msg();
      break;
    case NotificationIds.autoMission:
      browser.tabs.create({ url: `https://www.v2ex.com/balance` });
      break;
    case NotificationIds.newFollowTopic:
      const topicId = localStorageItems.newFollowTopicId;
      browser.tabs.create({
        url: `https://www.v2ex.com/t/${topicId}?p=1`
      });
      break;
    case NotificationIds.newCollectTopicReply:
      browser.tabs.create({ url: `https://www.v2ex.com/my/topics` });
      break;
  }
  browser.notifications.clear(notificationId);
}

browser.notifications.onClicked.addListener(handleNotifications);
browser.notifications.onButtonClicked.addListener((notificationId, btnIdx) => {
  if (btnIdx === 0) {
    resetAlarm(AlarmNames.checkMsg, 1500000, 5); //25min后重建定时任务
    browser.notifications.clear(notificationId);
  } else if (btnIdx === 1) {
    resetAlarm(AlarmNames.checkMsg, 3300000, 5); //55min后重建定时任务
    browser.notifications.clear(notificationId);
  }
});

export function postAutoMissionSuccessNotification(days: string) {
  browser.notifications.create(NotificationIds.autoMission, {
    type: "basic",
    iconUrl: "icon/icon38_msg.png",
    title: "v2ex plus 提醒您",
    message: `签到成功，${days}。\nTake your passion and make it come true.`
  });
}

export function postNewMsgNotification() {
  browser.notifications.create(NotificationIds.newMsg, {
    type: "basic",
    iconUrl: "icon/icon38_msg.png",
    title: "v2ex plus 提醒您",
    message: "您有 V2EX 的未读新消息，点击查看。",
    buttons: [
      {
        title: "半小时内免打扰"
      },
      {
        title: "一小时内免打扰"
      }
    ]
  });
}

export function postNewTopicNotification(author: string, topic: string) {
  browser.notifications.create(NotificationIds.newFollowTopic, {
    type: "basic",
    iconUrl: "icon/icon38_msg.png",
    title: "v2ex plus 提醒您",
    message: `${author} 创作了新主题：${topic}`,
    buttons: [
      {
        title: "半小时内免打扰"
      },
      {
        title: "一小时内免打扰"
      }
    ]
  });
}

export function postTopicReplyNotification() {
  browser.notifications.create("newCollectTopicReply", {
    type: "basic",
    iconUrl: "icon/icon38_msg.png",
    title: "v2ex plus 提醒您",
    message: "您收藏的主题有了新回复，点击查看",
    buttons: [
      {
        title: "半小时内免打扰"
      },
      {
        title: "一小时内免打扰"
      }
    ]
  });
}
