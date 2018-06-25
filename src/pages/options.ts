import { optionKeys, Options, defaultSettings, getSettings } from "@/settings";

const style = require("@/style/options.css");

function saveChoice(e: any) {
  // Event
  //console.log(e, e.target.checked);
  let name = e.target.name;
  let checked = e.target.checked;
  let value;
  if (name === "imageHosting") {
    value = checked ? "imgur" : "weibo";
  } else {
    value = checked ? 1 : 0;
  }
  // localStorage.setItem(name, value);
  setItemByKey(name, value);
}

function setItem(obj: object) {
  //console.log(obj);
  // let obj = {};
  // obj[key] = value;
  chrome.storage.sync.set(obj);
  chrome.storage.local.set(obj);
}

function setItemByKey(key: string, value: any) {
  //console.log(key, value);
  const obj = {
    [key]: value
  };
  chrome.storage.sync.set(obj);
  chrome.storage.local.set(obj);
}

type StorageCallback = (
  items: {
    [key: string]: any;
  }
) => void;

function getItem(obj: object, callback: StorageCallback) {
  //console.log(chrome, chrome.storage);
  chrome.storage.sync.get(obj, callback);
}

function resetAll() {
  setItem(defaultSettings);
  location.reload();
}

// Show saved settings
async function restoreSetting(settingButtons: KeyHTMLElementMap) {
  const settings = await getSettings();
  console.log(settings);
  for (let name in settings) {
    let value = (settings as any)[name];
    let _button = settingButtons[name];
    if (!_button) {
      continue;
    }
    const button: HTMLInputElement = _button as HTMLInputElement;
    let checked = true;
    switch (name) {
      case Options.replyColor:
      case Options.thankColor:
      case Options.customNode:
        button.value = value;
        setItemByKey(name, value); //如果用户从未改过，则设置一个默认值
        button.onchange = function(e) {
          const input = this as HTMLInputElement;
          console.log(e, this, input.value);
          let hex = input.value.toLowerCase();
          setItemByKey(name, hex);
        };
        button.disabled = false;
        break;
      case Options.replyA:
        button.value = value;
        const replyAValueButton = settingButtons["replyAValue"]!;
        replyAValueButton.textContent = value;
        setItemByKey(name, value); //如果用户从未改过，则设置一个默认值
        button.onchange = function() {
          const input = this as HTMLInputElement;
          replyAValueButton.textContent = input.value;
          setItemByKey(name, input.value);
        };
        button.disabled = false;
        break;
      default:
        if (name === Options.imageHosting) {
          checked = value === "imgur";
          setItemByKey(name, value); //设置storage中imgHosting的默认值
        } else {
          checked = !!parseInt(value);
          setItemByKey(name, parseInt(value)); //在storage中为各选项初始一个默认值
        }
        button.checked = checked;
        button.onchange = saveChoice;
        button.disabled = false;
    }
  }
}

type KeyHTMLElementMap = { [key: string]: HTMLElement | null };

window.onload = function() {
  // const s = localStorage;
  const settingButtons: KeyHTMLElementMap = {
    replyAValue: document.getElementById("replyAValue")
  };
  for (const key of optionKeys()) {
    settingButtons[key] = document.querySelector("." + key);
  }
  settingButtons[Options.customNode] = document.getElementById("customNode");

  // function initSetting() {
  //     getItem(defaultSettings, (settings) => {
  //         setItem(settings);
  //     });
  // }
  const resetAllButton = document.getElementById("allDefault");
  if (resetAllButton) {
    resetAllButton.onclick = resetAll;
  }

  //查看屏蔽列表
  const viewBlockListButton = document.getElementById("blockList");
  if (viewBlockListButton) {
    viewBlockListButton.onclick = function() {
      chrome.runtime.sendMessage({ action: "get_blockList" });
    };
  }

  restoreSetting(settingButtons);
};
