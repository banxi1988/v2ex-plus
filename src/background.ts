import { handleMessage } from "./services/handleMessage";
import onInstalled from "@/services/onInstalled";
import { setClipboardText } from "@/clipboard";
// Avoid `chrome` namespace
// TODO(banxi)
const browser = chrome;

browser.runtime.onInstalled.addListener(onInstalled);

//——————————————————————————————————接收来自页面的图片数据上传并返回——————————————————————————————————
const s = localStorage;
const storage = chrome.storage.sync;
browser.runtime.onMessage.addListener(handleMessage);

//——————————————————————————————————返回设置选项——————————————————————————————————

let urlPrefix = "";
//——————————————————————————————————右键菜单生成——————————————————————————————————
const contextMenu = {
  sov2ex: {
    id: "vplus.sov2ex",
    title: "使用 sov2ex 搜索 '%s'",
    contexts: ["selection"]
  },
  base64: {
    id: "vplus.base64",
    title: "使用 Base64 编码/解码",
    contexts: ["selection"]
  }
};

const base64SubMenu = [
  {
    title: "编码",
    id: "encode"
  },
  {
    title: "解码",
    id: "decode"
  }
];

function errorHandler() {
  if (browser.runtime.lastError) {
    console.log("Got expected error: " + browser.runtime.lastError.message);
  }
}

function createParentMenu(obj: chrome.contextMenus.CreateProperties) {
  browser.contextMenus.create(obj, errorHandler);
  if (obj.id == "vplus.base64") {
    createSubMenu(base64SubMenu, obj);
  }
}

function createSubMenu(arr: any[], parent: any) {
  for (let i = 0; i < arr.length; i++) {
    let obj = arr[i];
    if (typeof obj == "string") {
      obj = JSON.parse(obj);
    }
    let id = parent.id + "_" + obj.id;
    let title = obj.title;
    let contexts = parent.contexts;
    browser.contextMenus.create(
      {
        id: id,
        parentId: parent.id,
        title: title,
        contexts: contexts
      },
      errorHandler
    );
  }
}

function onClickedHandler(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab | undefined
) {
  switch (info.menuItemId) {
    case "vplus.sov2ex": {
      sov2exClicked(info);
      break;
    }
    case "vplus.base64_encode":
    case "vplus.base64_decode": {
      base64Clicked(info);
      break;
    }
  }
}

//onclicked operation
chrome.contextMenus.onClicked.addListener(onClickedHandler);

//initial context menu when extension updated
storage.get(function(response) {
  if (response.sov2ex) {
    createParentMenu(contextMenu.sov2ex);
  }
  if (response.base64) {
    createParentMenu(contextMenu.base64);
  }
});
//——————————————————————————————————右键菜单生成—————————————————————————————————

//——————————————————————————————————右键使用 sov2ex 搜索—————————————————————————
function sov2exClicked(info: chrome.contextMenus.OnClickData) {
  window.open("https://www.sov2ex.com/?q=" + info.selectionText);
}
//——————————————————————————————————右键使用 sov2ex 搜索——————————————————————————

//——————————————————————————————————右键使用 Base64 编码/解码——————————————————————
function base64Clicked(info: chrome.contextMenus.OnClickData) {
  if (!info.selectionText) {
    return;
  }
  if (info.menuItemId === "vplus.base64_encode") {
    const str = Base64.encode(info.selectionText);
    if (prompt("编码如下，点击确定自动复制到剪贴板 ", str))
      setClipboardText(str);
  } else {
    const str = Base64.decode(info.selectionText);
    if (prompt("解码如下，点击确定自动复制到剪贴板", str))
      setClipboardText(str);
  }
}

//点击确定，自动复制base64转码内容到剪贴板
// function copyToClipboard (str) {
// 	document.addEventListener('copy', function(e) {
// 		e.clipboardData.setData('text/plain', str);
// 		e.preventDefault();
// 	});
// 	document.execCommand('copy')
// }
//——————————————————————————————————右键使用 Base64 编码/解码——————————————————————

function onChangedHandler(changes: {
  [key: string]: chrome.storage.StorageChange;
}) {
  let keys = Object.keys(changes);
  for (let i = 0, len = keys.length; i < len; i++) {
    let index = keys[i];
    let item = changes[index];
    switch (index) {
      case "sov2ex":
      case "base64": {
        if (item.newValue) {
          let obj = contextMenu[index];
          delete (obj as any)["generatedId"];
          createParentMenu(obj);
        } else {
          browser.contextMenus.remove(contextMenu[index].id);
        }
        break;
      }
      case "customNode": {
        urlPrefix = item.newValue;
      }
    }
  }
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace !== "sync") return;
  for (let key in changes) {
    if (changes[key].oldValue == undefined) {
      //new install no operation
      delete changes[key];
    }
  }
  onChangedHandler(changes);
});

//——————————————————————————————————跳转自定义节点————————————————————————————————
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.url.indexOf(`//${urlPrefix}.v2ex.com/`) == -1) {
      let url = details.url.replace(/\/\/(.*?)\//, `//${urlPrefix}.v2ex.com/`);
      return {
        redirectUrl: url
      };
    }
  },
  {
    types: ["main_frame"],
    urls: ["*://*.v2ex.com/*"]
  },
  ["blocking"]
);
//——————————————————————————————————跳转自定义节点————————————————————————————————
