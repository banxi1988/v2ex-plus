import { PlainObject } from "@/typedef";

chrome.runtime.sendMessage({ action: "get_collectList" }, function(response) {
  const _cachedReplyCountList = response.cached;
  const _latestReplyCountList = response.latest;

  const topicList: PlainObject = {};
  const topicEl = $(".cell.item");

  for (let _topicIndex = 0; _topicIndex < topicEl.length; _topicIndex++) {
    const _replyCountEl = $(topicEl[_topicIndex]).find(
      ".count_livid,.count_orange"
    );
    const link = $(topicEl[_topicIndex]).find(
      ".item_title a"
    )[0] as HTMLAnchorElement;
    let _topicId = 0;
    if (link) {
      Number(link.href.match(/\/t\/(\d+)/)![1]);
    }

    if (_replyCountEl.length) {
      if (_cachedReplyCountList[_topicId] !== _latestReplyCountList[_topicId]) {
        $(_replyCountEl[0]).attr("class", "count_orange");
      }

      topicList[_topicId] = Number(_replyCountEl[0].innerText);
    } else {
      topicList[_topicId] = 0;
    }
  }

  const _clearAll = $('<a href="#">全部标为已读</a>');
  _clearAll.on("click", function(event) {
    event.preventDefault();
    chrome.runtime.sendMessage(
      { action: "clear_collect", list: JSON.stringify(topicList) },
      function() {
        location.reload();
      }
    );
  });
  $(".header .fr .snow").html("&nbsp;" + $(".header .fr .snow").html());
  $(".header .fr").prepend(_clearAll);
});
