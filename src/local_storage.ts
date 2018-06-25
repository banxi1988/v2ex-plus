function getValueByKey(key: string) {
  const item = localStorage.getItem(key);
  if (item) {
    return JSON.parse(item);
  }
  return null;
}

function setValueByKey(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 *
 * @param defaultValue 默认值，必须指定
 */
function asStorageItem(defaultValue: any) {
  return function(target: any, propertyKey: any) {
    const key = propertyKey;
    Object.defineProperty(target, propertyKey, {
      get: function() {
        return getValueByKey(key) || defaultValue;
      },
      set: function(value) {
        setValueByKey(key, value);
      }
    });
  } as any;
}

type PlainObject = { [key: string]: any };

/**
 *
 *  本地存储
 */
class LocalStorageItems {
  @asStorageItem({})
  collectTopicCachedReplyCountList: PlainObject = {};
  @asStorageItem({})
  collectTopicLatestReplyCountList: PlainObject = {};

  @asStorageItem(false)
  collectNotified = false;

  @asStorageItem("") newFollowTopicId = "";

  @asStorageItem(0) preview = 0;
  @asStorageItem(0) newWindow = 0;
  @asStorageItem(0) replyUser = 0;
  @asStorageItem(0) dblclickToTop = 0;
  @asStorageItem(0) fold = 0;
  @asStorageItem("") replyColor = "";
  @asStorageItem("") replyA = "";
  @asStorageItem("") thankColor = "";

}

export const localStorageItems = new LocalStorageItems();
