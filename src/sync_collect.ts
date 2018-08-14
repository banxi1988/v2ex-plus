chrome.runtime.sendMessage({ action: "get_collectList" }, function(response) {
  const _topicId = Number(document.location.href.match(/\/t\/(\d+)/)![1]);

  const _cachedReplyCountList = response.cached;

  const _latestReplyCountList = response.latest;

  if (_cachedReplyCountList[_topicId] !== undefined) {
    const replayCountEl = $(".box .cell .gray");
    const replayCount = Number(
      replayCountEl[0].innerText.match(/(\d+) 回复/)![1]
    );
    let shouldSync = false;

    if (replayCount !== _cachedReplyCountList[_topicId]) {
      _cachedReplyCountList[_topicId] = replayCount;
      shouldSync = true;
    }

    if (replayCount !== _latestReplyCountList[_topicId]) {
      _latestReplyCountList[_topicId] = replayCount;
      shouldSync = true;
    }

    if (shouldSync) {
      chrome.runtime.sendMessage({
        action: "sync_collect",
        cached: _cachedReplyCountList,
        latest: _latestReplyCountList
      });
    }
  }
});
