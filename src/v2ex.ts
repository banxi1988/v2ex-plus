export const enum V2EXUrls {
  home = "https://www.v2ex.com/",
  redeem = "https://www.v2ex.com/mission/daily/redeem",
  settings = "https://www.v2ex.com/settings",
  following = "https://www.v2ex.com/my/following",
  myTopics = "https://www.v2ex.com/my/topics",
  member = "https://www.v2ex.com/member/",
  balance = "https://www.v2ex.com/balance",
  notifications = "https://www.v2ex.com/notifications"
}

export function makeTopicUrl(topicId:number|string){
  return `https://www.v2ex.com/t/${topicId}?p=1`;
}

class RegExpService {
  /**
   * 用于 提取 topicId的正则表达式
   * @example
   * https://www.v2ex.com/t/481114#reply11
   */
  topicId = RegExp("/t/(d+)");

  findTopicId(source: string) {
    const reArr = this.topicId.exec(source);
    if (reArr) {
      return reArr[0];
    }
  }

  /**
   * 用于提取成员用户名
   * @example /member/llrg222
   */
  memberName = RegExp("/member/(.+)");
  findMemberName(source: string) {
    const reArr = this.memberName.exec(source);
    if (reArr) {
      return reArr[0];
    }
  }

  tencentVideoUrl = RegExp("http://v.qq.com/");
  isTencentVideoUrl(url: string) {
    return this.tencentVideoUrl.test(url);
  }

  youkuVideoUrl = RegExp("http://player.youku.com/");
  isYoukuVideoUrl(url: string) {
    return this.youkuVideoUrl.test(url);
  }

  missionDays =  /已连续登录 (\d+?) 天/
  /**
   * 提取签到天数
   */
  findMissionDays(source:string){
    const reArr = source.match(this.missionDays)
    if(reArr){
      return reArr[0]
    }
  }
}

export const regExpService = new RegExpService();

/**
 * V2ex 正则表达式
 */
export const v2exRegExps = {};
