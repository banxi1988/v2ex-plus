import { getStorageItems } from "@/storage";

/*
    * 重置所有设置
    * 消息提醒 默认开启
    * 图床设置 默认微博
    * 自动签到 默认关闭
    * 主题预览 默认开启
    * 自动折叠 默认开启
    * 回复楼层号 默认开启
    * 双击返回顶部 默认关闭
    * 定时激活微博 默认关闭
    * 新标签页浏览主题 默认关闭
    * 使用sov2ex搜索 默认关闭
    * 自动签到提醒 默认开启
    * 自定义节点 默认www(国内1)
    * Base64加密/解密 默认关闭
*/
export const defaultSettings = {
  newMsg: 1,
  imageHosting: "weibo",
  autoMission: 0,
  preview: 1,
  fold: 1,
  dblclickToTop: 0,
  replyUser: 1,
  autoLoginWeibo: 0,
  followMsg: 1,
  collectMsg: 0,
  autoMissionMsg: 1,
  newWindow: 0,
  replyColor: "#fffff9",
  replyA: 0.4,
  thankColor: "#cccccc",
  sov2ex: 0,
  customNode: "www",
  base64: 0
};

export type Settings = typeof defaultSettings;
/**
 * 选项键枚举
 */
export enum Options {
  newMsg = "newMsg",
  imageHosting = "imageHosting",
  autoMission = "autoMission",
  preview = "preview",
  fold = "fold",
  dblclickToTop = "dblclickToTop",
  replyUser = "replyUser",
  autoLoginWeibo = "autoLoginWeibo",
  followMsg = "followMsg",
  collectMsg = "collectMsg",
  autoMissionMsg = "autoMissionMsg",
  newWindow = "newWindow",
  replyColor = "replyColor",
  replyA = "replyA",
  thankColor = "thankColor",
  sov2ex = "sov2ex",
  customNode = "customNode",
  base64 = "base64"
}

export function optionKeys(): string[] {
  return Object.keys(Options).map(k => Options[k as any]);
}

/**
 * 返回用户偏好设置
 */
export async function getSettings(): Promise<Settings> {
  const items = await getStorageItems(defaultSettings);
  return items as Settings;
}
