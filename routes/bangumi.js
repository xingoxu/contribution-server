/**
 * Created by xingo on 2017/03/06.
 */

let httpClient = require('request');
let domEnv = require('jsdom').env,
    jQInit = require('jquery');
function fetchTimeline(username, page) {
  return new Promise((resolve, reject) => {
    httpClient.get({
      url: `https://bgm.tv/user/${username}/timeline?type=all&page=${page}&ajax=1`,
      headers: {
        'User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36`,
        'Upgrade-Insecure-Requests': 1,
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Accept-Language': 'en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4,ja;q=0.2,zh-TW;q=0.2',
        'Referer': `https://bgm.tv/user/${username}/timeline`,
      }
    }, (err, response, body) => {
      if (err)
        return reject(err);
      resolve(body)
    })
  });
}

function fetchWindow(username) {
  return new Promise((resolve, reject) => {
    httpClient.get({
      url: `https://bgm.tv/user/${username}/timeline`,
      headers: {
        'User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36`,
        'Upgrade-Insecure-Requests': 1,
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Accept-Language': 'en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4,ja;q=0.2,zh-TW;q=0.2',
      }
    }, (err, response, body) => {
      if (err)
        return reject(err);
      resolve(body)
    })
  }).then(body => {
    return new Promise((resolve, reject) => {
      domEnv(body, (errors, window) => {
        if (errors)
          return reject(errors);
        let $ = jQInit(window);

        resolve($);
      })
    })
  })
}


let moment = require('moment');
function setDate($, body, dateObj) {
  let timeline = $(body);
  let shouldStop = false;
  timeline.children('h4.Header').each(function (index) {
    let date = $(this).text();
    date == '今天' ? date = moment().format('YYYY-MM-DD') : date = moment(date, 'YYYY-M-D').format('YYYY-MM-DD');
    if (moment().diff(moment(date), 'days') > 371) {
      shouldStop = true;
      return false;
    }
    dateObj[date] = $(this).next().children('li').length;
  });
  return shouldStop;
}

function fetchTimelinePromise(username, page, jquery, dateObj) {
  return fetchTimeline(username, page).then(body => {
    if (setDate(jquery, body, dateObj)) {
      return dateObj;
    }
    else {
      return fetchTimelinePromise(username, page + 1, jquery, dateObj);
    }
  })
}

function getBangumiTimelineJSON(username) {
  return fetchWindow(username).then(jquery => {
    let page = 1;
    let dateObj = {};

    return fetchTimelinePromise(username, page, jquery, dateObj);
  }).then(dateObj => {
    let day = 0;
    let json = {
      max: 0,
      data: [],
    };
    let momentObj = moment().subtract(day, 'days');
    while (!(momentObj.day() == 6 && day >= 365)) {
      let date = momentObj.format('YYYY-MM-DD');
      let count = dateObj[date];
      count = count ? count : 0;
      json.data.push({
        count: count ? count : 0,
        date: date,
      });

      if (count > json.max)
        json.max = count;

      momentObj = moment().subtract(++day, 'days');
    }
    return json;
  })
}

let cache = {};
function getBangumiTimeline(username) {
  return getBangumiTimelineJSON(username)
      .then(json => {
        return cache[username] = json;
      })
}

function clearCache() {
  setTimeout(() => {
    cache = {};
    clearCache();
  }, moment().endOf('day').toDate().valueOf() - Date.now());
}
clearCache();

let router = require('express').Router();
let currentUser = 'xingo';
getBangumiTimeline(currentUser);
router.get('/', function (req, res, next) {
  res.append('Access-Control-Allow-Origin', 'https://blog.xingoxu.com');
  if (cache[currentUser]) {
    return res.json(cache[currentUser]);
  }
  else {
    return getBangumiTimeline(currentUser)
        .then(json => {
          res.json(json);
        })
        .catch(err => {
          return res.status(500).json({
            code: 500,
            message: 'something went wrong',
          });
        });
  }
});

module.exports = router;