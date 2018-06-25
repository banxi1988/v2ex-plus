export const storage = chrome.storage.sync;
export type StorageItems = { [key: string]: any };
export function getStorageItems(defaults: StorageItems): Promise<StorageItems> {
  return new Promise(function(resolve, reject) {
    chrome.storage.sync.get(defaults, settings => {
      resolve(settings);
    });
  });
}

export function setStorageItems(items: StorageItems) {
  chrome.storage.sync.set(items);
}
