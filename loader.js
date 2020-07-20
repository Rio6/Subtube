"use strict";

var iframeId = 'iframe-player';

function loadSubtitle(params) {
  params.forEach(function (url, key) {
    if (key.startsWith('subtitle-')) {
      var language = key.replace(/^subtitle-/, '');
      fetch(url, {
        mode: 'cors'
      }).then(function (res) {
        return res.text();
      }).then(function (res) {
        return Subtube.addSubtitle(iframeId, language, res);
      })["catch"](console.error);
    }
  });
}

var params = new URLSearchParams(window.location.search);
var videoId = params.get('v').replace(/[^a-zA-Z0-9_\-]/, '');
var iframe = document.getElementById(iframeId);
iframe.addEventListener('playerready', function (e) {
  e.detail.setId(videoId);
  loadSubtitle(params);
});