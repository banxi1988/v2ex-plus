//倒三角图片
// const triangle_img = chrome.extension.getURL("img/triangle.jpg");

//关注与屏蔽
function follow_or_bolck(_target, bash, undo, default_name) {
  var v = "撤销";
  _target.attr("value") == "撤销" && (bash = undo) && (v = default_name);
  _target.attr("value", "等待");
  var url = location.origin + bash + btn_key;
  if (bash.indexOf("follow") != -1) {
    url = location.origin + bash + btn_once;
  }
  console.log(url);
  $.get(url, function(data) {
    _target.attr("value", v);
  });
}

//隐藏个人信息
function hidden_user_info() {
  _user_info.css({ marginTop: "0px", opacity: "0" });
  setTimeout(function() {
    _user_info.css("visibility", "hidden");
  }, 300);
  hidden_userInfo = null;
}

const userInfoHtml = require("./user_info.njk");

$("body").append(userInfoHtml);
var _user_info = $("#userInfo");
var _user_avatar = $("#userAvatar");
var _user_name = $("#userName");
var _user_id = $("#userId");
var _user_location = $("#userLocation");
var _user_created = $("#userCreated");
var _user_tagline = $("#userTagline");
var _user_website = $("#userWebsite");
var _user_company = $("#userCompany");
var _user_follow = $("#userFollow");
var _user_block = $("#userBlock");
var _triangle_img = $("#userInfo > img");
var avatar_src;
var btn_key;
var btn_once;
var display_loading_img;
var display_userInfo;
var hidden_userInfo;

$(".fr > a > img", ".header").css({ minWidth: "73px" });
$("#Main .avatar").mouseenter(function() {
  var _this = $(this);
  var _cell = _this.parents("div[id^=r_]");
  var _reply_user_name = _this.parent().attr("href");
  var user_name = _user_name.text();
  var info_position = [1, 0];
  _reply_user_name = _reply_user_name
    ? _reply_user_name.substr(8)
    : _cell.find("strong a").text();
  avatar_src = _this.attr("src");
  _this.attr("vPlus-src", avatar_src);
  _triangle_img.css({ bottom: "-6px", top: "auto", transform: "rotate(0deg)" });

  //判断是否已经弹出了用户信息框
  if (
    _user_info.css("visibility") == "hidden" ||
    user_name != _reply_user_name
  ) {
    display_loading_img = setTimeout(function() {
      _this.attr("src", chrome.extension.getURL("img/loading.gif"));
    }, 280);
  }
  if (_this.offset().top - $(document).scrollTop() < 200) {
    info_position = [0, 48];
    _this.height() != 48 && (info_position[1] = 75);
    _triangle_img.css({
      top: "-6px",
      bottom: "auto",
      transform: "rotate(180deg)"
    });
  }
  if (hidden_userInfo && user_name == _reply_user_name) {
    clearTimeout(hidden_userInfo);
    _user_info.css({
      top:
        _this.offset().top -
        info_position[0] * (32 + _user_info.height()) +
        info_position[1] +
        "px",
      left: _this.offset().left - 106 + "px",
      visibility: "visible",
      marginTop: "10px",
      opacity: "1"
    });
  } else if (user_name == _reply_user_name) {
    display_userInfo = setTimeout(function() {
      _user_info.css({
        top:
          _this.offset().top -
          info_position[0] * (32 + _user_info.height()) +
          info_position[1] +
          "px",
        left: _this.offset().left - 106 + "px",
        visibility: "visible",
        marginTop: "10px",
        opacity: "1"
      });
      setTimeout(function() {
        _this.attr("src", _this.attr("vPlus-src"));
      }, 280);
    }, 500);
  } else {
    display_userInfo = setTimeout(function() {
      //各种原因决定不用 API 以获得更多数据
      $.get("https://www.v2ex.com/member/" + _reply_user_name, function(data) {
        data = data.substring(
          data.indexOf('id="Main"'),
          data.indexOf('class="fl"')
        );
        //获取用户信息
        var id = RegExp("V2EX 第 ([0-9]+?) 号会员").exec(data)[1];
        var location = RegExp('maps\\?q=(.+?)"').exec(data);
        var created = RegExp("加入于 (.+?) ").exec(data)[1];
        var tagline = RegExp('bigger">(.+?)</span>').exec(data);
        var website = RegExp('"(.+?)".*?alt="Website.*?&nbsp;(.+?)<').exec(
          data
        );
        var company = RegExp(
          'building"></li> &nbsp; <strong>(.*?)</strong> (.*?)</span>'
        ).exec(data);
        var online = RegExp("ONLINE").exec(data);
        btn_key = RegExp("/([0-9]+?\\?t=[0-9]+?)';").exec(data);
        btn_once = RegExp("/([0-9]+?\\?once=[0-9]+?)';").exec(data);
        var follow = RegExp("加入特别关注").test(data);
        var block = RegExp("Block").test(data);
        if (btn_key) {
          btn_key = btn_key[1]; //鼠标悬浮在自己头像无法获取 key
          btn_once = btn_once[1];
          (follow && _user_follow.attr("value", "关注")) ||
            _user_follow.attr("value", "撤销");
          (block && _user_block.attr("value", "屏蔽")) ||
            _user_block.attr("value", "撤销");
        } else {
          _user_follow.attr("value", "本人");
          _user_block.attr("value", "本人");
        }

        setTimeout(function() {
          _this.attr("src", _this.attr("vPlus-src"));
        }, 280);
        _user_avatar.attr("src", _this.attr("vPlus-src"));
        _user_name.text(_reply_user_name);
        _user_id.text(id);
        _user_location.html(location && location[1] + "&emsp;");
        _user_created.text(created);
        _user_tagline.html(tagline && tagline[1] + "<br/>");
        _user_website.html(
          website && "<a href='" + website[1] + "'>" + website[2] + "</a><br/>"
        );
        _user_avatar.css("-webkit-filter", "grayscale(" + ~~!online + ")");
        _user_company.html(company && company[1] + company[2]);
        _user_info.css({
          top:
            _this.offset().top -
            info_position[0] * (32 + _user_info.height()) +
            info_position[1] +
            "px",
          left: _this.offset().left - 106 + "px",
          visibility: "visible",
          marginTop: "10px",
          opacity: "1"
        });
      });
    }, 500);
  }
});

_user_follow.click(function() {
  follow_or_bolck(_user_follow, "/follow/", "/unfollow/", "关注");
});

_user_block.click(function() {
  follow_or_bolck(_user_block, "/block/", "/unblock/", "屏蔽");
  confirm(
    "总免不了遇到一些糟糕的人和事，保持距离免得坏了心情: )\n是否刷新本页让屏蔽立即生效？"
  ) && location.reload();
});

$("#Main .avatar").mouseleave(function() {
  clearTimeout(display_userInfo);
  clearTimeout(display_loading_img);
  $(this).attr("src", avatar_src);
  hidden_userInfo = setTimeout(hidden_user_info, 300);
});

_user_info.mouseleave(function() {
  hidden_userInfo = setTimeout(hidden_user_info, 300);
});

_user_info.mouseenter(function() {
  clearTimeout(hidden_userInfo);
});
