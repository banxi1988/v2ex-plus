import { V2EXUrls } from "@/v2ex";
import { postTopicReplyNotification } from "@/services/notifications";
import { localStorageItems } from "@/local_storage";

//——————————————————————————————————检查关注人新主题——————————————————————————————————
//——————————————————————————————————检查收藏主题新回复——————————————————————————————————
export async function collectMsg() {
  $.get(V2EXUrls.myTopics, function(data) {
    var $html = $("<output>").append($.parseHTML(data));
    var topics = $html.find("div.cell.item");
    if (!topics.length) return;
    var cachedReplyCountList =
      localStorageItems.collectTopicCachedReplyCountList;
    var latestReplyCountList =
      localStorageItems.collectTopicLatestReplyCountList;
    const topicIds: number[] = [];
    var newReply = false;
    var topicIndex;
    for (topicIndex = 0; topicIndex < topics.length; topicIndex++) {
      var topic = topics[topicIndex];
      const [topicReplyCount, topicId] = parseTopicStats(topic);
      topicIds.push(topicId);
      if (cachedReplyCountList[topicId] === undefined) {
        cachedReplyCountList[topicId] = topicReplyCount;
      }
      if (latestReplyCountList[topicId] === undefined) {
        latestReplyCountList[topicId] = topicReplyCount;
      } else if (latestReplyCountList[topicId] != topicReplyCount) {
        latestReplyCountList[topicId] = topicReplyCount;
        newReply = true;
      }
    }
    for (topicIndex in cachedReplyCountList) {
      if (topicIds.indexOf(Number(topicIndex)) === -1) {
        delete cachedReplyCountList[topicIndex];
      }
    }
    for (topicIndex in latestReplyCountList) {
      if (topicIds.indexOf(Number(topicIndex)) === -1) {
        delete latestReplyCountList[topicIndex];
      }
    }
    localStorageItems.collectTopicCachedReplyCountList = cachedReplyCountList;
    localStorageItems.collectTopicLatestReplyCountList = latestReplyCountList;
    if (!localStorageItems.collectNotified && newReply) {
      localStorageItems.collectNotified = true;
      postTopicReplyNotification();
      //20分钟内最多提示一次
      setTimeout(function() {
        localStorageItems.collectNotified = false;
      }, 1200000);
    }
  });
}

function parseTopicStats(topic: any) {
  const topicReplyCountEl = $(topic).find(".count_livid, .count_orange");
  const topicReplyCount = topicReplyCountEl.length
    ? Number(topicReplyCountEl[0].innerText)
    : 0;
  let topicId = 0;
  const link = $(topic).find(".item_title a")[0];
  if (link) {
    const href = (link as HTMLAnchorElement).href;
    if (href) {
      const matches = href.match(/\/t\/(\d+)/);
      if (matches) {
        topicId = Number(matches[1]);
      }
    }
  }
  return [topicReplyCount, topicId];
}
