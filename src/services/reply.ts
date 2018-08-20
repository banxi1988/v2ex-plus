import { setClipboardText } from "@/clipboard";
import { regExpService } from "@/v2ex";
import triangle_img from "@/assets/ic_triangle.jpg";
import { getSettings, Settings } from "@/settings";

let page_current_num =
  $(".page_current")
    .eq(0)
    .text() || "1";
let page_previous_num = +page_current_num - 1;
let _key_user = $(".header small a:first-of-type").text();
let _topic = $("#Main > div:nth-of-type(2)");
let _topic_content = $(".cell .topic_content", _topic);
let _topic_buttons = $(".topic_buttons");
let _reply_user_name_list = Array();
let _reply_content_list = Array();
let r_i = 1;
let maxNestDivCount = 1;
let _r_c = $("#reply_content");
let tab_switch = false;
const _upload_img_btn = $(".inputBTN2");
const _imgUpload = $("#imgUpload");
const _upload_image = $(".uploadImage");

//————————————————初始化————————————————

let _reply_textareaE = document.getElementById("reply_content")!;
_reply_textareaE.parentNode!.replaceChild(
  _reply_textareaE.cloneNode(true),
  _reply_textareaE
);
let _reply_textarea = _r_c;

_reply_textarea.attr(
  "placeholder",
  "你可以在文本框内直接粘贴截图或拖拽图片上传\n类似于 [:微笑:] 的图片标签可以优雅的移动"
);

const _reply_textarea_top_btn = _reply_textarea
  .parents(".box")
  .children(".cell:first-of-type");

$("script").each(function() {
  var $this = $(this);
  if (
    $this.attr("scr") ||
    $this.attr("type") ||
    $this.html().indexOf("textcomplete") == -1
  ) {
    return;
  }

  var script = document.createElement("script");
  script.textContent = $this.html();
  (document.head || document.documentElement).appendChild(script);
  script.parentNode!.removeChild(script);
});

/*global img_list emoticon_list triangle_img setClipboardText*/
//获取被@的用户
function get_at_name_list(comment_content) {
  const name_list = new Set(),
    patt_at_name = RegExp('@<a href="/member/(.+?)">', "g");

  let match;
  while ((match = patt_at_name.exec(comment_content))) {
    name_list.add(match[1]);
  }

  return name_list;
}

//判断是否为相关的回复
function related_reply(reply_content, _reply_user_name, _reply_at_name) {
  let reply_related = false;
  const at_name_list = get_at_name_list(reply_content);

  if (at_name_list.size === 0) {
    return true;
  }

  for (let at_name of at_name_list) {
    if (at_name == _reply_user_name || at_name == _reply_at_name) {
      reply_related = true;
    }
  }

  return reply_related;
}

//————————————————初始化————————————————

class ReplyService {
  insetImgId = 1;
  constructor() {
    this.fixReply();
    this.addFeatures();
    this.addOnPasteListener();
  }

  addOnPasteListener() {
    //从剪切板上传
    //只要粘贴就触发，不管在什么地方粘贴
    document.body.addEventListener("paste", e => {
      for (let i = 0; i < e.clipboardData.items.length; ++i) {
        const this_item = e.clipboardData.items[i];
        if (this_item.kind == "file" && /image\/\w+/.test(this_item.type)) {
          const imageFile = this_item.getAsFile();
          const fileReader = new FileReader();
          fileReader.onloadend = () => {
            this.insertImage(fileReader.result + "", this.insetImgId++);
          };
          fileReader.readAsDataURL(imageFile!);
          //阻止原有的粘贴事件以屏蔽文字
          e.preventDefault();
          //只黏贴一张图片
          break;
        }
      }
    });
  }

  async addFeatures() {
    const settings = await getSettings();
    this.addFeatureCreatorOnly();
    this.addFeatureDragAndDropToUploadImage();
    this.addFeatureEmotion();
    this.addFeatureFixSinaImgUrl();
    this.addFeatureFoldLongTopic(settings);
    this.addFeatureHighlightLike(settings);
    this.addFeatureImageUpload();
    this.addFeatureLoadAll();
    this.addFeatureQuickLookLatestReply();
    this.addFeatureReplaceImageTag();
    this.addFeatureReplyDetail();
    this.addFeatureReplyWithNo(settings);
    this.addFeatureRotateImage();
    this.addFeatureShortcut();
    this.addFeatureSkipTopic();
    this.addFeatureWarnVideoSrc();
  }

  addFeatureLoadAll() {
    if (+page_current_num > 1) {
      //console.log('V2EX PLUS: 此主题有多页回复，正在加载所有回复。');
      const topicId = regExpService.findTopicId(window.location.href);
      $.get(
        "https://www.v2ex.com/api/replies/show.json?topic_id=" + topicId,
        function(data) {
          //console.log('V2EX PLUS: 所有回复加载完成。');
          for (var i in data) {
            _reply_user_name_list[+i + 1] = data[i].member.username;
            _reply_content_list[+i + 1] = data[i].content_rendered;
          }
          page_previous_num = 0;
        }
      );
    }

    $(".direct").click(function() {
      setClipboardText($(this).data("clipboard-text"));
    });
  }

  /**
   * 同一帖子翻页跳过主题
   */
  addFeatureSkipTopic() {
    const prevTopicId = regExpService.findTopicId(document.referrer);
    const currentTopicId = regExpService.findTopicId(window.location.href);
    if (prevTopicId && currentTopicId && prevTopicId == currentTopicId) {
      const offset = _topic_buttons.offset();
      if (offset) {
        $("html, body").animate({ scrollTop: offset.top }, 300);
      }
    }
  }

  async addFeatureFoldLongTopic(settings: Settings) {
    const topic_height = _topic.height() || 0,
      r = parseInt(settings.replyColor.substring(1, 3), 16),
      g = parseInt(settings.replyColor.substring(3, 5), 16),
      b = parseInt(settings.replyColor.substring(5, 7), 16),
      replyColor = `${r},${g},${b},${settings.replyA}`;
    $(".keyUser").css("backgroundColor", `rgba(${replyColor})`); //设置楼主回复背景颜色

    if (settings.fold) {
      //折叠超长主题
      if (topic_height > 1800) {
        _topic_content.css({
          maxHeight: "600px",
          overflow: "hidden",
          transition: "max-height 2s"
        });
        $(".subtle", _topic).hide();
        const $showTopic = $(
          "<div id='showTopic' style='padding:16px; color:#778087;'>\
                                            <span id='topicBTN'>展开主题</span>\
                                            <div style='height:10px;'></div>\
                                            <span style='font-size:0.6em'>主题超长已自动折叠，点击按钮显示完整的主题。</span>\
                                       </div>"
        );
        if (_topic_buttons.length > 0) {
          //用户未登录状态下，_topic_buttons不存在
          _topic_buttons.before($showTopic);
        } else {
          _topic.append($showTopic);
        }
        $("#topicBTN").click(function() {
          //乘2是由于当图片未加载完成时，预先记录的高度不准确（短于实际高度）
          _topic_content.css({ maxHeight: topic_height * 2 });
          //还有可能是图片及其多，一开始保存的高度数值只有很少一部分图片的高度，所以在上面的两秒动画后还得再取消高度限制
          setTimeout(function() {
            _topic_content.css({ maxHeight: "none" });
          }, 2000);
          $(".subtle", _topic).slideDown(800);
          $("#showTopic").remove();
        });
      }
      var _reply = $(".waitForFold");
      _reply.css({
        maxHeight: "300px",
        overflow: "hidden",
        transition: "max-height 2s"
      });
      _reply.after(
        "<div class='showReply' style='padding:20px 0px 10px; color:#778087; text-align:center; border-top:1px solid #e2e2e2'>\
                                            <span class='replyBTN'>展开回复</span>\
                                            <div style='height:16px;'></div>\
                                            <span>回复超长已自动折叠，点击按钮显示完整的回复。</span>\
                                  </div>"
      );
      $(".replyBTN").click(function() {
        const _this = $(this);
        const _showReply = _this.parent();
        const _reply = _showReply.prev();
        const height = +(_reply.attr("vPlus-height") || 0);
        _reply.css({ maxHeight: 2 * height + "px" });
        setTimeout(function() {
          _reply.css({ maxHeight: "none" });
        }, 2000);
        _showReply.remove();
      });
    }
  }

  addFeatureHighlightLike(settings: Settings) {
    //————————高亮感谢————————
    $(".box .small.fade").each(function() {
      if (
        $(this)
          .text()
          .indexOf("♥") !== -1
      )
        $(this).css("color", settings.thankColor);
    });
    //————————高亮感谢————————
  }

  addFeatureEmotion() {
    _reply_textarea_top_btn.append(
      "<span class='inputBTN1'> › 表情</span><span class='inputBTN2'> › 插入图片</span><input type='file' style='display: none' id='imgUpload' accept='image/*' />"
    );
    _reply_textarea_top_btn.before(emoticon_list);
    var _emoticon = $(".emoticon");
    _reply_textarea_top_btn.after("<div class = 'uploadImage'></div>");

    $(".inputBTN1").click(function() {
      var _emoticon_switch = -1;
      _emoticon.is(":visible") || (_emoticon_switch = 1);
      _emoticon.slideToggle(300);
      $("html, body").animate(
        { scrollTop: $(document)!.scrollTop()! + 66 * _emoticon_switch },
        300
      );
    });

    $(".emoticon img").click(function() {
      var _this = $(this);
      var _emoticon_name = _this.attr("alt");
      _reply_textarea.val(function(i, origText) {
        return origText + "[:" + _emoticon_name + ":]";
      });
      _reply_textarea.focus();
    });
  }

  fixReply() {
    $("div[id^=r_]").each(function() {
      const _this = $(this);
      const _reply = _this.find(".reply_content");

      //———回复空格修复———
      _reply.css("whiteSpace", "pre-wrap").html(function(i, o) {
        return o.replace(/\n<br>/g, "\n").replace(/<br>/g, "\n");
      });
      //———回复空格修复———

      const _reply_content = _reply.html();
      const _reply_user_name = _this.find("strong a").text();
      const _reply_at_name = RegExp('<a href="/member/(.*?)">').exec(
        _reply_content
      );

      if (_key_user == _reply_user_name) {
        _this.addClass("keyUser");
      } else {
        _this.addClass("normalUser");
      }

      //判断高度是否超高
      const height = _reply.height();
      if (height && height > 1000) {
        _reply.addClass("waitForFold");
        _reply.attr("vPlus-height", height);
      }

      _reply_user_name_list[r_i] = _reply_user_name;
      _reply_content_list[r_i++] = _reply_content;
      //设置按钮名称，是否出现，出现位置
      let btn_name = "";
      if (_reply_at_name) {
        btn_name = "会话详情";
      } else {
        for (var i = r_i - 2; i; --i) {
          _reply_user_name_list[i] == _reply_user_name &&
            (btn_name = "所有回复");
          break;
        }
      }
      var _append_place;
      var _thanked = _this.find(".thanked");
      if (_thanked.text() == "感谢已发送") {
        _append_place = _thanked;
      } else {
        var itemAll = _this.find(".no");
        var item1 = itemAll[0];
        if (itemAll.length > maxNestDivCount) {
          maxNestDivCount = itemAll.length;
        }
        _append_place = _this.find(item1).prev();
      }
      if (btn_name) {
        _append_place.before(
          " &nbsp;<span class='replyDetailBTN'>" +
            btn_name +
            "</span> &nbsp; &nbsp;"
        );
      }
      // console.log(page_current_num)
      _append_place.before(
        " &nbsp;<span class='direct' data-clipboard-text='" +
          location.origin +
          location.pathname +
          "?p=" +
          page_current_num +
          "#" +
          _this.attr("id") +
          "'>楼层直链</span> &nbsp; &nbsp;"
      );
    });
  }

  /**
   * 添加只看楼主功能
   */
  addFeatureCreatorOnly() {
    _topic_buttons.append(
      " &nbsp;<a href='#;' id='onlyKeyUser' class='tb'>只看楼主</a>"
    );
    $("#onlyKeyUser").click(function() {
      var _this = $(this);
      if (_this.text() == "只看楼主") {
        _this.text("全部回复");
        $(".normalUser").slideUp(600);
      } else {
        _this.text("只看楼主");
        $(".normalUser").slideDown(600);
      }
    });
  }

  addFeatureImageUpload() {
    _upload_img_btn.click(function() {
      _imgUpload.click();
    });
    _imgUpload.change((e: any) => {
      var files = e.target.files || (e.dataTransfer && e.dataTransfer.files);
      if (files) {
        var img_file = files[0];
        //Chrome input file 支持 accepts 属性
        //            if(!/image\/\w+/.test(img_file.type)){
        //                alert("请上传图片文件");
        //                return false;
        //            }else{
        var reader = new FileReader();
        reader.onload = () => {
          this.insertImage(reader.result, this.insetImgId++);
        };
        reader.readAsDataURL(img_file);
        //            }
      } else {
        alert("出错了，获取不到文件。");
      }
    });
  }

  /**
   * 拖拽上传图片—
   */
  addFeatureDragAndDropToUploadImage() {
    _r_c[0].addEventListener("drop", e => {
      e.preventDefault();
      var fileReader = new FileReader();
      fileReader.onloadend = () => {
        this.insertImage(fileReader.result + "", this.insetImgId++);
      };
      fileReader.readAsDataURL(e.dataTransfer.files[0]);
    });
  }

  addFeatureRotateImage() {
    function rotateImg(img, times) {
      var scale;
      if (times & 1) {
        scale = img.height() / img.width();
      } else {
        scale = 1;
      }
      img.css(
        "transform",
        "rotate(" + 90 * times + "deg) scale(" + scale + ")"
      );
      img.attr("times", times);
      _rotateImg.css("display", "none");
    }

    $("body").append(
      "<div id='rotateImg'><span id='rotateImgLBtn'>左旋</span>&emsp;<span id='rotateImgRBtn'>右旋</span>&emsp;</div>"
    );

    var _rotateImg = $("#rotateImg");
    var _will_rotate_img;
    var _rotate_times;
    var _rotate_img = $(".reply_content img");
    _rotate_img.mouseenter(function() {
      const _this = $(this);
      const width = _this.width() || 0;
      const height = _this.height() || 0;
      if (width > 100 && height > 30) {
        _will_rotate_img = _this;
        _rotate_times =
          _this.attr("times") || (_this.attr("times", "0") && "0");
        var position = _this.offset() || { top: 0, left: 0 };
        const w =
          (_rotate_times & 1 && (height * height) / width) ||
          _this.width() ||
          0;
        const imgWidth = _rotate_img.width() || 0;
        _rotateImg.css({
          top: position.top,
          left: position.left + w - imgWidth,
          display: "block"
        });
      }
    });

    $("#rotateImgLBtn").click(function() {
      rotateImg(_will_rotate_img, --_rotate_times);
    });

    $("#rotateImgRBtn").click(function() {
      rotateImg(_will_rotate_img, ++_rotate_times);
    });

    //移出图片时隐藏按钮，暂时没想到更好的方法
    _rotate_img.mouseleave(function() {
      _rotateImg.css("display", "none");
    });

    _rotateImg.mouseenter(function() {
      _rotateImg.css("display", "block");
    });
    _rotateImg.mouseleave(function() {
      _rotateImg.css("display", "none");
    });
  }

  addFeatureShortcut() {
    //支持快捷键回复
    _reply_textarea.keydown(function(e) {
      const keyR = 13;
      if ((e.ctrlKey || e.metaKey) && e.which === keyR) {
        //e.preventDefault();
        _reply_textarea.parent().submit();
      }
    });

    // todo 判断是否有回复框

    $(document).keydown(function(event) {
      const keyCode = event.which;
      const digit7 = 9;
      if (keyCode == digit7) {
        if (!_r_c.attr("id") || tab_switch) {
          $("html, body").animate({ scrollTop: 0 }, 300);
          _r_c.blur();
          tab_switch = false;
        } else {
          $("html, body").animate({ scrollTop: _r_c.offset()!.top }, 300);
          _r_c.focus();
          tab_switch = true;
        }
        window.event && (window.event.returnValue = false);
      }
    });
  }

  /**
   * 回复楼层号
   */
  addFeatureReplyWithNo(settings: Settings) {
    if (!settings.replyUser) {
      return;
    }
    $('[alt="Reply"]').click(function() {
      setTimeout(() => {
        const replyContent = $("#reply_content");
        const oldContent = replyContent.val() + "";
        const prefix =
          "#" +
          $(this)
            .parent()
            .parent()
            .find(".no")
            .text() +
          " ";
        let newContent = "";
        if (oldContent.length > 0) {
          if (oldContent != prefix) {
            newContent = oldContent + prefix;
          }
        } else {
          newContent = prefix;
        }
        replyContent.focus();
        replyContent.val(newContent);
      }, 100);
    });
  }

  addFeatureFixSinaImgUrl() {
    if (location.protocol == "https:") {
      setTimeout(function() {
        $(".reply_content img").each(function() {
          const $this = $(this);
          const img = $this[0] as HTMLImageElement;
          const src = img.src;

          if (
            src.indexOf(".sinaimg.cn") != -1 &&
            src.indexOf("http://") != -1
          ) {
            img.src = "https" + src.substr(4);
          }
        });
      }, 100);
    }
  }

  addFeatureWarnVideoSrc() {
    if (location.protocol == "https:") {
      const iframe_list = _topic_content.find("iframe");
      iframe_list.each(function() {
        //判断是否为腾讯视频
        const _this = $(this);
        const videoSrc = _this.attr("src") || "";

        if (regExpService.isTencentVideoUrl(videoSrc)) {
          _this.attr("src", function(index, oldvalue) {
            return "https" + oldvalue.substring(4);
          });
          _this.before(
            "v2ex plus 提醒您：<br/>由于您以 https 访问 v2ex，已将腾讯视频链接修改为 https 现可正常观看。"
          );
          //判断是否为优酷视频
        } else if (regExpService.isYoukuVideoUrl(videoSrc)) {
          _this.before(
            "v2ex plus 提醒您：<br/>由于您以 https 访问 v2ex，无法正常显示优酷视频，您可以访问此链接观看：<br/><br/>&emsp;&emsp;&emsp;&emsp;<a href='" +
              _this.attr("src") +
              "' target='_blank'>新窗口观赏视频</a><br/><br/>"
          );
          _this.remove();
        }
      });
    }
  }

  addFeatureQuickLookLatestReply() {
    //————————————————快速查看最近一条回复————————————————

    $("body").append("<div id='closeReply'></div>");
    var _close_reply = $("#closeReply");
    var _reply_link = $(".reply_content a");
    var display_foMouse;
    _reply_link.mouseenter(function() {
      var _this = $(this);
      var _no =
        ~~_this
          .closest("td")
          .find(".no")
          .text() -
        page_previous_num * 100;
      const memberName = regExpService.findMemberName(_this.attr("href") || "");
      if (memberName) {
        display_foMouse = setTimeout(function() {
          _close_reply.html(
            "<div style='padding-bottom:6px;'>" +
              1 +
              "层至" +
              _no +
              "层间未发现该用户的回复</div>" +
              "<img class='triangle' src='" +
              triangle_img +
              "' />"
          );
          // 判断 @ 之后是否跟了 # 号
          var result = RegExp("@" + _this.text() + " #(\\d+)").exec(
            _this.parent().text()
          );
          if (result && _reply_user_name_list[+result[1]] == _this.text()) {
            var i = +result[1];
            _close_reply.html(
              _reply_content_list[i] +
                "<p class='bubbleName' style='text-align:right; padding-right:0px;'>\
                                                " +
                _reply_user_name_list[i] +
                "&emsp;回复于" +
                (i + page_previous_num * 100) +
                "层&emsp;\
                                            </p><img class='triangle' src='" +
                triangle_img +
                "' />"
            );
          } else {
            for (let i = _no - 1; i > 0; --i) {
              if (_reply_user_name_list[i] == memberName[1]) {
                _close_reply.html(
                  _reply_content_list[i] +
                    "<p class='bubbleName' style='text-align:right; padding-right:0px;'>\
                                                " +
                    _reply_user_name_list[i] +
                    "&emsp;回复于" +
                    (i + page_previous_num * 100) +
                    "层&emsp;\
                                            </p><img class='triangle' src='" +
                    triangle_img +
                    "' />"
                );
                break;
              }
            }
          }
          //判断弹出位置
          var _fo_triangle = $(".triangle", _close_reply);
          var reply_position = [1, 0];
          _fo_triangle.css({
            bottom: "-6px",
            top: "auto",
            transform: "rotate(0deg)"
          });
          //上方空间不够且下方空间足够则向下弹出
          const offset = _this.offset() || { top: 0, left: 0 };
          const width = _this.width() || 0;
          const $doc = $(document);
          const $win = $(window);
          const docScollTop = $doc.scrollTop() || 0;
          const replyHeight = _close_reply.height() || 0;
          const winHeight = $win.height() || 0;
          const replyFullHeight = replyHeight + 50;
          if (
            replyFullHeight > offset.top - docScollTop &&
            replyFullHeight < docScollTop + winHeight - offset.top
          ) {
            reply_position = [0, 16];
            _fo_triangle.css({
              top: "-6px",
              bottom: "auto",
              transform: "rotate(180deg)"
            });
          }
          _close_reply.css({
            top:
              offset.top -
              reply_position[0] * (34 + replyHeight) +
              reply_position[1] +
              "px",
            left: offset.left - 80 + width / 2 + "px",
            visibility: "visible",
            opacity: "1",
            marginTop: "10px"
          });
        }, 300);
      }
    });

    _reply_link.mouseleave(function() {
      clearTimeout(display_foMouse);
      _close_reply.css({ opacity: "0", marginTop: "0px" });
      setTimeout(function() {
        _close_reply.css("visibility", "hidden");
      }, 300);
    });
  }

  addFeatureReplyDetail() {
    var btn_id = 0;
    $(".replyDetailBTN").click(function() {
      if (maxNestDivCount > 1) {
        alert("可能与其他脚本或扩展有冲突，会话详情暂不可用！");
        return;
      }
      var _this = $(this);
      var _cell = _this.parents("div[id^=r_]"); //由于最后一条回复 class 为 inner 所以还是匹配 id 完整些
      var _reply_user_name = _cell.find("strong a").text();
      var _reply_content = _cell.find(".reply_content").html();
      var btn_name = _this.text();
      var _bubble, _replyDetail;
      _this.css("visibility", "visible");

      //————————————————会话详情功能————————————————

      if (btn_name == "会话详情") {
        _this.text("加载中...");
        _cell.after("<div class='replyDetail'></div>");

        _replyDetail = _cell.next(".replyDetail");
        var _reply_at_name_list = get_at_name_list(_reply_content);

        _replyDetail.append(
          "<div class='smartMode' onclick=\"$(this).children('span').toggleClass('checked');$(this).siblings('.unrelated').slideToggle(300);\"><span class='checked'>智能模式</span></div>"
        );

        for (let at_name of _reply_at_name_list) {
          r_i = 1;
          var _no = ~~_this
            .closest("td")
            .find(".no")
            .text();
          var have_main_reply = false;
          _replyDetail.append(
            "<p class='bubbleTitle' style='margin-top: 20px;padding-top: 20px;'>本页内 " +
              _reply_user_name +
              " 与 " +
              at_name +
              " 的会话：</p>"
          );
          while (_reply_user_name_list[r_i]) {
            if (_reply_user_name_list[r_i] == _reply_user_name) {
              _bubble = "<div class='rightBubble";
              !related_reply(
                _reply_content_list[r_i],
                _reply_user_name,
                at_name
              ) && (_bubble += " unrelated");
              _bubble +=
                "' style='text-align: right;'>\
                                <div>\
                                    " +
                _reply_content_list[r_i] +
                "\
                                    <p class='bubbleName' style='text-align:right;'>\
                                        <span class='unrelatedTip'><span>&emsp;回复于" +
                (r_i + page_previous_num * 100) +
                "层&emsp;" +
                _reply_user_name +
                "\
                                    </p>\
                                </div></div>";
              _replyDetail.append(_bubble);
            } else if (_reply_user_name_list[r_i] == at_name) {
              _bubble = "<div class='leftBubble";
              (!related_reply(
                _reply_content_list[r_i],
                _reply_user_name,
                at_name
              ) &&
                (_bubble += " unrelated")) ||
                (have_main_reply = true);
              _bubble +=
                "' style='text-align: left;'>\
                                <div>\
                                    " +
                _reply_content_list[r_i] +
                "\
                                    <p class='bubbleName' style=''>\
                                        " +
                at_name +
                "&emsp;回复于" +
                (r_i + page_previous_num * 100) +
                "层&emsp;<span class='unrelatedTip'><span>\
                                    </p>\
                                </div></div>";
              _replyDetail.append(_bubble);
            }
            //如果被@用户只有一条回复但回复是@其他不相干用户则显示这条回复
            const bubbleNameSource = _replyDetail
              .children(".leftBubble")
              .last()
              .find(".bubbleName")
              .text();
            const reArr = /(\S+?) 回复于\d+层/.exec(bubbleNameSource);
            if (
              _no - 1 == r_i &&
              !have_main_reply &&
              reArr &&
              reArr[1] == at_name
            ) {
              _replyDetail
                .children(".leftBubble")
                .last()
                .removeClass("unrelated");
            }

            ++r_i;
          }
        }
        _this.addClass("btn_id" + btn_id);
        _replyDetail.append(
          "<p class='bubbleName' style='margin-top: 20px;'><span class='replyDetailEnd item_node' \
                                        onclick='$(\".btn_id" +
            btn_id +
            '").click();\
                                                 $("html, body").animate({scrollTop: ($(".btn_id' +
            btn_id++ +
            "\").offset().top-200)}, 600);'>\
                                        收起会话\
                                 </span></p>"
        );
        _this.text("收起会话");
        _replyDetail.slideDown(800);

        //————————————————会话详情功能————————————————

        //————————————————所有回复功能————————————————
      } else if (btn_name == "所有回复") {
        _this.text("加载中...");
        _cell.after("<div class='replyDetail'></div>");

        _replyDetail = _cell.next(".replyDetail");

        r_i = 1;
        _replyDetail.append(
          "<p class='bubbleTitle' style='margin-top: 20px;padding-top: 20px;'>本页内 " +
            _reply_user_name +
            " 的所有回复：</p>"
        );
        while (_reply_user_name_list[r_i]) {
          if (_reply_user_name_list[r_i] == _reply_user_name) {
            _bubble =
              "<div class='rightBubble' style='text-align: right;'>\
                                        <div>\
                                            " +
              _reply_content_list[r_i] +
              "\
                                            <p class='bubbleName' style='text-align:right;'>\
                                                <span class='unrelatedTip'><span>&emsp;回复于" +
              (r_i + page_previous_num * 100) +
              "层&emsp;" +
              _reply_user_name +
              "\
                                            </p>\
                                        </div>\
                                   </div>";
            _replyDetail.append(_bubble);
          }
          ++r_i;
        }

        _this.addClass("btn_id" + btn_id);
        _replyDetail.append(
          "<p class='bubbleName' style='margin-top: 20px;'>\
                                    <span class='replyDetailEnd item_node' \
                                        onclick='$(\".btn_id" +
            btn_id +
            '").click();$("html, body").animate({scrollTop: ($(".btn_id' +
            btn_id++ +
            "\").offset().top-200)}, 600);'>\
                                        收起回复\
                                    </span>\
                                 </p>"
        );
        _this.text("收起回复");
        _replyDetail.slideDown(800);

        //————————————————所有回复功能————————————————

        //————————————————收起功能————————————————
      } else {
        _this.css("visibility", "");
        (btn_name == "收起会话" && _this.text("会话详情")) ||
          _this.text("所有回复");
        _replyDetail = _cell.next(".replyDetail");
        setTimeout(function() {
          _replyDetail.remove();
        }, 800);
        _replyDetail.slideUp(800);
      }
    });
  }

  /**
   * 替换图片标签
   */
  addFeatureReplaceImageTag() {
    if (_reply_textarea.val()) {
      _reply_textarea_top_btn.append(
        '&emsp;<span style="color:red;">之前如有上传的图片则已丢失，请重新上传。</span>'
      );
      //还原图片链接为标签
      _reply_textarea.val(function(i, origText) {
        for (var img_key_name in img_list) {
          origText = origText.replace(
            new RegExp(img_list[img_key_name], "g"),
            "[:" + img_key_name + ":]"
          );
        }
        return origText;
      });
    }
    //#1是用来调试的，点击 textarea 模拟显示上传的字符串
    //_reply_textarea.click(function( e ){//#1
    _reply_textarea.parent().submit(function(e) {
      if (_upload_img_btn.text().indexOf("正在上传") === -1) {
        _reply_textarea.val(function(i, origText) {
          origText = origText.replace(
            new RegExp("\\[:(.+?):\\]", "g"),
            function(i, k) {
              const img_url = img_list[k];
              if (img_url) {
                return img_url;
              } else {
                e.preventDefault();
                return "[:此图片标签已失效删除后请重新上传" + k + ":]";
              }
            }
          );
          return origText;
        });
      } else {
        confirm(
          "仍有图片未上传完成，确定要直接回复？\n未上传的图片将不被发送"
        ) || e.preventDefault();
      }
    });
  }

  //插入图片
  insertImage(input_img_base64, this_img_id) {
    _upload_image.append(
      "<div class='imgId" +
        this_img_id +
        "'>\
                                <div><img src='" +
        input_img_base64 +
        "' alt='上传图片'/></div>\
                                <span>上传中</span>\
                          </div>"
    );
    _upload_image.slideDown(700);

    const img_base64 = input_img_base64.match("base64,(.*)")[1];
    chrome.runtime.sendMessage({ img_base64: img_base64 }, function(res) {
      const _img_preview = $(".imgId" + this_img_id);

      if (res.img_status !== "Failed") {
        img_list["图片" + this_img_id] = ` ${res.img_status} `;
        _reply_textarea &&
          _reply_textarea.val(
            (i, origText) => origText + "[:图片" + this_img_id + ":]"
          );
        _img_preview.find("span").text("[:图片" + this_img_id + ":]");
        _img_preview.css({
          background: "rgba(246, 246, 246, 0.5)",
          borderColor: "#A4FF94"
        });
      } else {
        alert("图片上传失败，可能是未登录微博/受 imgur 上传次数限制");
        _img_preview.find("span").text("请重新上传");
      }
      _upload_img_btn.text(" › 插入图片");
    });
  }
}

export const replyService = new ReplyService();
