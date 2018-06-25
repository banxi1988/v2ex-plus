import { V2EXUrls } from "@/v2ex";
import { getStorageItems, storage } from "@/storage";
import { postNewTopicNotification } from "@/services/notifications";
import { localStorageItems } from "@/local_storage";

//——————————————————————————————————定时任务初始化——————————————————————————————————
//——————————————————————————————————检查关注人新主题——————————————————————————————————
export async function followMsg() {
  try {
    const data = await $.get(V2EXUrls.following);
    const $html = $("<output>").append($.parseHTML(data));
    // ts-lint ignore
    window.a = $html;
    const topics = $html.find("#Main .box:nth(0) table");
    if (!topics.length) return;
    const $firstOne = topics.eq(2);
    let topicId = "";
    const link = $firstOne.find(".item_title a");
    if (link) {
      const href = link.attr("href");
      if (href) {
        topicId = href.substr(3).split("#")[0];
      }
    }
    const topic = $firstOne.find(".item_title").text();
    const author = $firstOne.find(".small.fade > strong:nth-child(3)").text();
    const settings = await getStorageItems({ followMsgTopicId: "" });
    if (settings.followMsgTopicId == topicId) {
      return;
    }
    storage.set({ followMsgTopicId: topicId });
    localStorageItems.newFollowTopicId = topicId;
    postNewTopicNotification(author, topic);
  } catch (error) {}
}
