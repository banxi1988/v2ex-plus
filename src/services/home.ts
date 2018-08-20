import { getSettings, Settings } from "@/settings";
import { regExpService } from "@/v2ex";

/**
 * 主页相关服务
 */
class HomeService {
  linkTargetConfig = "";
  constructor() {
    this.addFeatures();
  }

  async addFeatures() {
    const settings = await getSettings();
    this.addFeatureOpenTopicInNewWindow(settings);
  }

  addFeatureOpenTopicInNewWindow(settings: Settings) {
    if (settings.newWindow) {
      $(".item_title a").attr("target", "_blank");
      $(".item_hot_topic_title a").attr("target", "_blank");
      this.linkTargetConfig = "target='_blank'";
    }
  }

  addFeaturePreview(settings: Settings) {
    if (!settings.preview) return;

    $("div#Main > div:nth-of-type(2) .cell").each(function() {
      if (
        $(this)
          .find(".fade")
          .text()
          .indexOf("...") != -1
      ) {
        return;
      }
      $(this)
        .find(".topic_info, .fade")
        .append(
          " &nbsp;•&nbsp; <span class='preview'>预览</span> &nbsp;•&nbsp; <span class='pass'>忽略</span>"
        );
    });

    $(".pass").click(function() {
      var $this = $(this);
      var url =
        $this
          .parents(".cell")
          .find(".item_title a")
          .attr("href") || "";
      if (confirm("确定不想再看到这个主题？")) {
        url = url.replace("/t/", "/ignore/topic/");
        var once = /signout\?once=([0-9]+)/.exec($("#Top").html())![1];
        url = url.replace("#", "?once=" + once + "#");
        location.href = url;
      }
    });

    var btn_id = 0;
    const linkTargetConfig = this.linkTargetConfig;
    $(".preview").click(function() {
      var _this = $(this);
      var _cell = _this.parents(".cell");
      if (_this.text() == "预览") {
        _this.text("加载中...");
        _cell.after("<div class='previewWindow'></div>");
        var _href = _cell.find(".item_title a").attr("href");
        _href = location.origin + _href;
        $.get(_href, function(data) {
          var _previewWindow = _cell.next(".previewWindow");
          data = data.substr(data.indexOf("header") + 8);
          //当匹配不到topic_conten时返回-1 substring 按0处理，既显示整个标题头部
          data = data.substring(
            data.indexOf('<div class="topic_content">'),
            data.indexOf('<div class="topic_buttons">')
          );
          data = data.replace("hljs.initHighlightingOnLoad();", "");
          _this.addClass("btn_id" + btn_id);
          _previewWindow.html(
            data +
              "<p class='previewWindowEnd'>\
                                                <a class='item_node' href='" +
              _href +
              "' " +
              linkTargetConfig +
              ">详细</a>\
                                                <span class='item_node' onclick='\
                                                    $(\".btn_id" +
              btn_id +
              '").click();$("html, body").animate({scrollTop: ($(".btn_id' +
              btn_id++ +
              "\").offset().top-200)}, 600);'>收起\
                                                </span>\
                                              </p>"
          );
          var _next_cell = _previewWindow.next();
          _next_cell.css("borderTop", _next_cell.css("borderBottom"));
          _this.text("收起");
          _previewWindow.slideDown(300);
        });
      } else {
        _this.text("预览");
        var _previewWindow = _cell.next(".previewWindow");
        setTimeout(function() {
          _previewWindow.next().css("borderTop", "none");
          _previewWindow.remove();
        }, 800);
        _previewWindow.slideUp(300);
      }
    });
  }

  addFeatureAutoMission(settings: Settings) {
    //——————————————————————————————————一键领取登陆奖励——————————————————————————————————
    var _mission_btn = $("div#Rightbar > div:nth-of-type(4) a");
    if (_mission_btn.text() == "领取今日的登录奖励") {
      _mission_btn.html(
        "一键领取今日的登录奖励 by vPlus<br/>Take your passion and make it come true. "
      );
    }

    const service = this;
    //Enable Gift ClickOnce Feature from v2excellent.js
    //Standalone MIT License from https://gist.github.com/VitoVan/bf00ce496b44c56417a675c521fe67e8
    $('a[href="/mission/daily"]')
      .attr("id", "gift_v2excellent")
      .attr("href", "#")
      .click(function() {
        $("#gift_v2excellent").text("正在领取......");
        const once = RegExp("/signout(\\?once=[0-9]+)").exec(
          $("div#Top").html()
        )![1];
        var giftLink = location.origin + "/mission/daily/redeem" + once;
        $.get(giftLink, function(checkResult) {
          var $output = $("<output>").append($.parseHTML(checkResult));
          var okSign = $output.find("li.fa.fa-ok-sign");
          var keepDays = regExpService.findMissionDays($output.text());
          console.log(keepDays);
          if (okSign.length > 0) {
            $.get(location.origin + "/balance", function(result) {
              var amount = $("<output>")
                .append($.parseHTML(result))
                .find('table>tbody>tr:contains("每日登录"):first>td:nth(2)')
                .text();
              $("#gift_v2excellent").html(
                "成功领取 <strong>" + amount + "</strong> 铜币，" + keepDays
              );
              service.refreshMoney();
            });
          }
        });
        return false;
      });
  }

  // refresh money方法，来自V2EX源码中的v2ex.js文件
  refreshMoney() {
    $.post("/ajax/money", function(data) {
      $("#money").html(data);
      setTimeout(function() {
        $("#Rightbar>.sep20:nth(1)").remove();
        $("#Rightbar>.box:nth(1)").remove();
      }, 2000);
    });
  }
}

export const homeService = new HomeService();
