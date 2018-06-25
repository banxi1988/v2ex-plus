import { browser } from "@/browser-shims";
import { localStorageItems } from "@/local_storage";
import { getSettings } from "@/settings";
import { V2EXUrls } from "@/v2ex";

class ImgUploader {
  constructor(
    readonly postUrl: string,
    readonly pattId: string,
    readonly urlPrefix: string,
    readonly urlSuffix: string,
    readonly imgBase64: string
  ) {}

  get isImgurHost(): boolean {
    return this.postUrl.includes("imgur");
  }

  get data() {
    if (this.isImgurHost) {
      return { image: this.imgBase64 };
    } else {
      return { b64_data: this.imgBase64 };
    }
  }

  extractImgStatus(res: string) {
    try {
      const groups = RegExp(this.pattId).exec(res);
      if (groups) {
        return this.urlPrefix + groups[1] + this.urlSuffix;
      }
      //console.log("Succeed: "+ img_status);
    } catch (e) {
      //console.error("Field not found");
    }
    return "Failed";
  }

  randImgUrlClientId() {
    return [
      "442b04f26eefc8a",
      "59cfebe717c09e4",
      "60605aad4a62882",
      "6c65ab1d3f5452a",
      "83e123737849aa9",
      "9311f6be1c10160",
      "c4a4a563f698595",
      "81be04b9e4a08ce"
    ].sort(_ => 0.5 - Math.random())[0];
  }

  async upload(): Promise<string> {
    try {
      const res = await $.ajax({
        url: this.postUrl,
        method: "POST",
        data: this.data,
        dataType: "text",
        beforeSend: xhr => {
          if (this.isImgurHost) {
            const clientId = this.randImgUrlClientId();
            xhr.setRequestHeader("Authorization", "Client-ID " + clientId);
          }
        }
      });
      return this.extractImgStatus(res);
    } catch (error) {
      return "Failed";
    }
  }
}

async function uploadImg(imgBase64: string) {
  const settings = await getSettings();
  let uploader: ImgUploader;
  if (settings.imageHosting == "weibo") {
    uploader = new ImgUploader(
      "http://picupload.service.weibo.com/interface/pic_upload.php?\
                    ori=1&mime=image%2Fjpeg&data=base64&url=0&markpos=1&logo=&nick=0&marks=1&app=miniblog",
      'pid":"(.*?)"',
      "https://ws2.sinaimg.cn/large/",
      ".jpg",
      imgBase64
    );
  } else {
    uploader = new ImgUploader(
      "https://api.imgur.com/3/image",
      'id":"(.*?)"',
      "https://i.imgur.com/",
      ".png",
      imgBase64
    );
  }
  return uploader.upload();
}

const s = localStorageItems;
export function handleMessage(
  request: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  //——————————————————————————————————接收来自页面的图片数据上传并返回——————————————————————————————————
  if (request.img_base64) {
    uploadImg(request.img_base64).then(img_status => {
      sendResponse({ img_status: img_status });
    });
    return true;
  }
  //——————————————————————————————————返回设置选项——————————————————————————————————
  switch (request.action) {
    case "get_preview_status":
      sendResponse({ preview_status: s.preview });
      break;
    case "get_dblclickToTop":
      sendResponse({ dblclickToTop: s.dblclickToTop });
      break;
    case "get_replySetting":
      sendResponse({
        replyColor: s.replyColor,
        replyA: s.replyA,
        fold: s.fold,
        thankColor: s.thankColor
      });
      break;
    case "get_newWindow_status":
      sendResponse({ newWindow_status: s.newWindow });
      break;
    case "get_replyUser":
      sendResponse({ replyUser: s.replyUser });
      break;
    case "get_blockList":
      openBlockListPage();
      sendResponse({ blockList: "get" });
      break;
    case "get_collectList":
      localStorageItems.collectNotified = false;
      sendResponse({
        cached: localStorage.collectTopicCachedReplyCountList,
        latest: localStorage.collectTopicLatestReplyCountList
      });
      break;
    case "clear_collect":
      localStorage.collectTopicCachedReplyCountList = request.list;
      localStorage.collectTopicLatestReplyCountList = request.list;
      sendResponse(null);
      break;
    case "sync_collect":
      localStorage.collectTopicCachedReplyCountList = request.cached;
      localStorage.collectTopicLatestReplyCountList = request.latest;
      break;
    default:
      throw "invaild action";
  }
}

function openBlockListPage() {
  $.get(V2EXUrls.home).then(function(data, status) {
    if (status != "success") {
      alert("扩展没有获取到任何信息 : (\n很有可能是网络问题，请稍后再试");
      return;
    }
    const blockGroups = /blocked = \[(.*?)\];/.exec(data);
    const usernameGroups = /首页<\/a>&nbsp;&nbsp;&nbsp;<a href="\/member\/(.+?)"/.exec(
      data
    );
    if (blockGroups && usernameGroups) {
      const block_list = blockGroups[1];
      const username = usernameGroups[1];
      browser.tabs.create({
        url: "/page/block_list.html#" + username + "=" + block_list
      });
    } else {
      alert("扩展没有获取到任何信息 : (\n或许是您未登录 V2EX 账号");
    }
  });
}
