/**
 * Created by xingo on 2017/03/06.
 */


let router = require('express').Router();
let allowCrossDomain = require('../utils/setCrossDomain.js');
let { cache, taskMap } = require('../controller/bangumi-cache.js');
let { currentUser } = require('../utils/environment.js');

router.get('/', allowCrossDomain, function (req, res, next) {
  if (cache[currentUser] && cache[currentUser].contribution) {
    return res.json(cache[currentUser].contribution);
  }
  else {
    return taskMap.getBangumiContribution.func(currentUser).then(json => {
      res.json(json);
    }).catch(err => {
      console.error(err);
      taskMap.getBangumiContribution.cycleTask(currentUser);
      return res.status(500).json({
        code: 500,
        message: 'something went wrong',
      });
    });
  }
});

router.get('/timeline', allowCrossDomain, function (req, res, next) {
  if (cache[currentUser] && cache[currentUser].timeline) {
    return res.json(cache[currentUser].timeline);
  }
  else {
    return taskMap.getBangumiRss.func(currentUser).then(json => {
      res.json(json);
    }).catch(err => {
      console.error(err);
      taskMap.getBangumiRss.cycleTask(currentUser);
      return res.status(500).json({
        code: 500,
        message: 'something went wrong',
      });
    });
  }
});


module.exports = router;