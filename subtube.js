"use strict";

var Subtube = {
  // Fontsize relative to iframe
  baseFontSize: 0.025,
  subInfos: {},
  createSRTPlayer: function createSRTPlayer(iframe, videoId) {
    if (!iframe.id) return;
    if (Subtube.subInfos[iframe.id]) return; // Youtuve player API

    iframe.src = "https://www.youtube.com/embed/".concat(videoId, "?enablejsapi=1&playsinline=1");
    var player = new YT.Player(iframe.id); // Create a container that hold both the iframe and subtitle

    var container = document.createElement('div');
    container.className = 'subtube-container';
    container.style.cssText = 'position: relative';
    if (iframe.width) container.style.width = iframe.width + 'px';
    if (iframe.height) container.style.height = iframe.height + 'px';
    iframe.style.cssText = "\n            position: absolute;\n            width: 100%;\n            height: 100%;\n            top: 0;\n            left: 0;\n            padding: 0;\n            margin: 0;\n            border: none;\n        ";
    iframe.parentNode.replaceChild(container, iframe); // SRT element

    var srtText = document.createElement('span');
    srtText.className = 'subtube-text';
    srtText.style.cssText = "\n            position: absolute;\n            left: 50%;\n            bottom: 0;\n            transform: translate(-50%, 0);\n            text-align: center;\n            white-space: nowrap;\n            padding: 1px 2px;\n            user-select: none;\n            z-index: 1;\n            visibility: hidden;\n        "; // Dragging

    srtText.onmousedown = function (e) {
      iframe.style.pointerEvents = "none";
      var origin = -e.pageY;
      var offset = iframe.offsetHeight - srtText.offsetTop - srtText.offsetHeight;
      var pos = 0;

      var stopDrag = function stopDrag() {
        document.onmousemove = null;
        iframe.style.pointerEvents = "";
      };

      document.onmousemove = function (e) {
        if (!e.buttons) {
          stopDrag();
        } else {
          pos = -e.pageY - origin + offset;

          if (pos > 0 && pos < iframe.offsetHeight - srtText.offsetHeight) {
            srtText.style.bottom = pos / iframe.offsetHeight * 100 + '%';
          }
        }
      };

      document.onmouseup = stopDrag;
    }; // Menu div


    var menu = document.createElement('div');
    menu.className = 'subtube-menu';
    menu.style.cssText = "\n            position: absolute;\n            bottom: 40px;\n            right: 10px;\n            border-radius: 2px;\n            font-size: 20px;\n            z-index: 2;\n        ";

    menu.show = function (autohide) {
      if (menu.timeout) clearInterval(menu.timeout);
      menu.style.opacity = 100;

      if (autohide) {
        menu.timeout = setTimeout(function () {
          if (player.getPlayerState() === YT.PlayerState.PLAYING) {
            menu.style.opacity = 0;
          }
        }, 3000);
      }
    };

    menu.onmouseenter = function () {
      return menu.show(false);
    };

    menu.onmouseleave = function () {
      return menu.show(true);
    }; // Language selector


    var langSelect = document.createElement('select');
    langSelect.className = 'subtube-language';
    langSelect.innerHTML = "\n            <option value=\"\">Subtitle</option>\n        ";
    langSelect.style.cssText = "\n            text-align: center;\n            vertical-align: top;\n            padding-top: 6px;\n        "; // Turns the whole container fullscreen, not just the iframe

    var fullscreenBtn = document.createElement('div');
    fullscreenBtn.title = "Fullscreen";
    fullscreenBtn.innerHTML = "\n            <svg height=\"100%\" version=\"1.1\" viewBox=\"0 0 36 36\" width=\"100%\"><g><path fill=\"white\" d=\"m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z\"></path fill=\"white\"></g><g><path fill=\"white\" d=\"m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z\"></path fill=\"white\"></g><g><path fill=\"white\" d=\"m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z\"></path fill=\"white\"></g><g><path fill=\"white\" d=\"M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z\"></path fill=\"white\"></g></svg>\n        ";
    fullscreenBtn.style.cssText = "\n            width: 1.5em;\n            cursor: pointer;\n            display: inline-block;\n        ";

    fullscreenBtn.onclick = function (e) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }

      menu.show(true);
    }; // Add all elements to container


    container.appendChild(iframe);
    container.appendChild(srtText);
    menu.appendChild(langSelect);
    menu.appendChild(fullscreenBtn);
    container.appendChild(menu);
    if (Subtube.subInfos[iframe.id]) clearInterval(Subtube.subInfos[iframe.id].updateInterval);
    player.addEventListener('onStateChange', function (_ref) {
      var data = _ref.data;
      if (data.state === YT.PlayerState.PLAYING) menu.show(false);else menu.show(true);
    }); // Store subtitle info for later use

    Subtube.subInfos[iframe.id] = {
      player: player,
      subtitles: {},
      current: 0,
      enabled: true,
      textNode: srtText,
      langSelect: langSelect,
      lastText: "",
      // Updates subtitle
      updateInterval: setInterval(function () {
        var info = Subtube.subInfos[iframe.id];
        var text = "";
        container.style.fontSize = container.offsetWidth * Subtube.baseFontSize + 'px';
        var subs = info.subtitles[info.langSelect.value];

        if (info.enabled && (subs === null || subs === void 0 ? void 0 : subs.length) > 0) {
          if (!subs[info.current]) info.current = 0;
          var time = info.player.getCurrentTime() * 1000;
          var i = info.current;

          while (i > 0 && subs[i].start > time) {
            i--;
          }

          while (i < subs.length && subs[i].end <= time) {
            i++;
          }

          while (i < subs.length && subs[i].start <= time && subs[i].end > time) {
            text += subs[i].text;
            i++;
          }

          info.current = i;
        }

        if (text !== info.lastText) {
          info.lastText = text;

          if (text !== "") {
            info.textNode.style.visibility = 'visible';
            info.textNode.innerText = text;
          } else {
            info.textNode.style.visibility = 'hidden';
          }
        }
      }, 200)
    };
    return player;
  },
  addSubtitle: function addSubtitle(id, language, text) {
    var info = Subtube.subInfos[id];

    if (!info) {
      console.warn("Trying to add subtitle to non-existent iframe");
      return;
    }

    info.subtitles[language] = Subtitle.parse(text);

    if (!info.langSelect.querySelector("[value=\"".concat(language, "\"]"))) {
      var option = document.createElement('option');
      option.innerText = option.value = language;
      info.langSelect.appendChild(option);
    }
  },
  removeSubtitle: function removeSubtitle(id, language) {
    delete Subtube.subInfos[id].subtitles[language];
    var info = Subtube.subInfos[id];
    var option = info === null || info === void 0 ? void 0 : info.langSelect.querySelector("[value=\"".concat(language, "\"]"));

    if (!option) {
      info.langSelect.removeChild(option);
    }
  },
  enableSubtitle: function enableSubtitle(id) {
    var enabled = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    Subtube.subInfos[id].enabled = enabled;
  },
  toggleSubtitle: function toggleSubtitle(id) {
    Subtube.subInfos[id].enabled = !Subtube.subInfos[id].enabled;
  },
  setSubtitleSize: function setSubtitleSize(id, percent) {
    Subtube.subInfos[id].textNode.style.fontSize = percent + "%";
  }
}; // Load Youtube iframe api

function onYouTubeIframeAPIReady() {
  document.querySelectorAll('iframe[subtube]').forEach(function (elm) {
    elm.dispatchEvent(new CustomEvent('playerready', {
      target: elm,
      detail: {
        setId: function setId(id) {
          return Subtube.createSRTPlayer(elm, id);
        }
      }
    }));
  });
}

(function () {
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();