import icDelete from "@/assets/ic_delete.jpg";
/**
 * 发贴服务
 */
class PostService {
  insertImgId = 1;
  constructor() {
    this.setupImageManager();
    this.setupOnPasteListener();
    this.setupOnUploadListener();
  }

  setupImageManager() {
    const html = `
    <div id='imgFun'>
      <div id='imgManage' class='box'>
      粘贴截图或<span id='imgUploadBtn' style='cursor: pointer;'>上传图片</span>
      <input type='file' style='display:none;' id='imgUpload' accept='image/*' />
      </div>
      <div id='imgFunBtn'>&emsp;&lt; </div>
     </div>
    `;

    $("body").append(html);
    const _imgFun = $("#imgFun");
    const _imgFunBtn = $("#imgFunBtn");

    //————————————————初始化————————————————

    //————————————————弹出/收起图片管理————————————————

    _imgFunBtn.click(function() {
      if (_imgFunBtn.text() === " >") {
        _imgFun.css("left", "6px");
        _imgFunBtn.text(" <");
      } else {
        _imgFun.css("left", "-200px");
        _imgFunBtn.text(" >");
      }
    });
  }

  setupOnPasteListener() {
    //从剪切板上传
    //只要粘贴就触发，不管在什么地方粘贴
    const _imgFunBtn = $("#imgFunBtn");
    document.addEventListener("paste", (e: any) => {
      for (let item of e.clipboardData.items) {
        if (item.kind === "file" && /image\/\w+/.test(item.type)) {
          _imgFunBtn.text() === " >" && _imgFunBtn.click();
          const imageFile = item.getAsFile();

          const fileReader = new FileReader();
          fileReader.onloadend = () => {
            this.insertImage(fileReader.result + "", this.insertImgId++);
          };

          fileReader.readAsDataURL(imageFile);
          //阻止原有的粘贴事件以屏蔽文字
          e.preventDefault();
          //只黏贴一张图片
          break;
        }
      }
    });
  }

  setupOnUploadListener() {
    //————————————————选择图片上传————————————————
    const _upload_img_btn = $("#imgUploadBtn");
    const _imgUpload = $("#imgUpload");
    _upload_img_btn.click(function() {
      _imgUpload.click();
    });

    _imgUpload.change((e: any) => {
      const files = e.target.files || (e.dataTransfer && e.dataTransfer.files);
      if (files) {
        const img_file = files[0];
        const reader = new FileReader();
        reader.onload = () => {
          this.insertImage(reader.result + "", this.insertImgId++);
        };
        reader.readAsDataURL(img_file);
      } else {
        alert("出错了，获取不到文件。");
      }
    });
  }

  //插入图片
  insertImage(imgDataUrl: string, imgId: number) {
    const html = `
    <div class="imgId${imgId}">
      <div>
       <img class="imgPreview" src="${imgDataUrl}" alt="上传图片"/>
      </div>
      <input style="text" onmouseover="this.select();" />
      <img class="deleteBTN" src="${icDelete}  onclick='$(".imgId${imgId}").remove();'/>
    </div>
  `;

    $("#imgManage").append(html);

    const img_base64 = imgDataUrl.match("base64,(.*)")![1];
    chrome.runtime.sendMessage({ img_base64: img_base64 }, function(res) {
      const _img_preview = $(".imgId" + imgId),
        _url_input = _img_preview.find("input");

      if (res.img_status !== "Failed")
        _img_preview.css({
          background: "rgba(246, 246, 246, 0.5)",
          borderColor: "#A4FF94"
        });
      else alert("图片上传失败，可能是未登录微博/受 imgur 上传次数限制");
      _url_input.val(res.img_status);
    });
  }
}

export const postService = new PostService();
