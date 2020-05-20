var Subtube = {

    // Fontsize relative to iframe
    baseFontSize: 0.025,

    subInfos: {},

    createSRTPlayer: function (iframe) {

        if(!iframe.id) return;

        // Youtuve player API
        let player = new YT.Player(iframe.id);

        // Create a container that hold both the iframe and subtitle
        let container = document.createElement('div');
        container.className = 'subtube-container';
        container.style.cssText = 'position: relative';
        if(iframe.width) container.style.width = iframe.width + 'px';
        if(iframe.height) container.style.height = iframe.height + 'px';

        iframe.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            padding: 0;
            margin: 0;
            border: none;
        `;
        iframe.parentNode.replaceChild(container, iframe);

        // SRT element
        let srtText = document.createElement('span');
        srtText.className = 'subtube-text';
        srtText.style.cssText = `
            position: absolute;
            left: 50%;
            bottom: 0;
            transform: translate(-50%, 0);
            text-align: center;
            padding: 1px 2px;
            user-select: none;
            z-index: 1;
            visibility: hidden;
        `;

        // Dragging
        srtText.onmousedown = e => {
            iframe.style.pointerEvents = "none";

            let origin = e.pageY;
            let pos = 0;
            let offset = srtText.offsetTop;

            let stopDrag = () => {
                document.onmousemove = null;
                iframe.style.pointerEvents = "";
            };

            document.onmousemove = e => {
                if(!e.buttons) {
                    stopDrag();
                } else {
                    pos = + e.pageY - origin + offset;
                    srtText.style.bottom = "";
                    srtText.style.top = pos / iframe.offsetHeight * 100 + '%';
                }
            };
            document.onmouseup = stopDrag;
        };

        // Language selector
        let langSelect = document.createElement('select');
        langSelect.className = 'subtube-language';
        langSelect.innerHTML = `
            <option value="">Subtitle</option>
        `;
        langSelect.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            font-size: 80%;
            text-align: center;
            transform: translate(-50%, 0);
            z-index: 2;
        `;
        langSelect.show = (autohide) => {
            if(langSelect.timeout) clearInterval(langSelect.timeout);
            langSelect.style.opacity = 100;

            if(autohide) {
                langSelect.timeout = setTimeout(() => {
                    if(player.getPlayerState() === YT.PlayerState.PLAYING) {
                        langSelect.style.opacity = 0;
                    }
                }, 3000);
            }
        };
        langSelect.onmouseenter = () => langSelect.show(false);
        langSelect.onmouseleave = () => langSelect.show(true);

        // Turns the whole container fullscreen, not just the iframe
        let fullscreenBtn = document.createElement('div');
        fullscreenBtn.title = "Fullscreen";
        fullscreenBtn.style.cssText = `
            position: absolute;
            bottom: 1px;
            right: 12px;
            width: 30px;
            height: 30px;
            z-index: 2;
            cursor: pointer;
            background-color: rgba(255, 255, 255, 0.6);
            opacity: 0;
        `;
        fullscreenBtn.onmouseenter = e => {
            fullscreenBtn.style.opacity = "100";
        };
        fullscreenBtn.onmouseleave = e => {
            fullscreenBtn.style.opacity = "0";
        };
        fullscreenBtn.onclick = e => {
            if(document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                container.requestFullscreen();
            }
            langSelect.show(true);
        };

        // Add all elements to container
        container.appendChild(iframe);
        container.appendChild(srtText);
        container.appendChild(fullscreenBtn);
        container.appendChild(langSelect);

        if(Subtube.subInfos[iframe.id])
            clearInterval(Subtube.subInfos[iframe.id].updateInterval);

        player.langSelectTimeout = null;
        player.addEventListener('onStateChange', ({data}) => {
            if(data.state === YT.PlayerState.PLAYING)
                langSelect.show(false);
            else
                langSelect.show(true);
        });

        // Store subtitle info for later use
        Subtube.subInfos[iframe.id] = {
            player: player,
            subtitles: {},
            current: 0,
            enabled: true,
            textNode: srtText,
            langSelect: langSelect,
            lastText: "",

            // Updates subtitle
            updateInterval: setInterval(() => {
                let info = Subtube.subInfos[iframe.id];
                let text = "";

                container.style.fontSize = (container.offsetWidth * Subtube.baseFontSize) + 'px';

                let subs = info.subtitles[info.langSelect.value];
                if(info.enabled && subs?.length > 0) {
                    if(!subs[info.current]) info.current = 0;

                    let time = info.player.getCurrentTime() * 1000;
                    let i = info.current;

                    while(i > 0 && subs[i].start > time) {
                        i--;
                    }

                    while(i < subs.length && subs[i].end <= time) {
                        i++;
                    }

                    while(i < subs.length
                        && subs[i].start <= time
                        && subs[i].end > time) {

                        text += subs[i].text;
                        i++;
                    }

                    info.current = i;
                }

                if(text !== info.lastText) {
                    info.lastText = text;
                    if(text !== "") {
                        info.textNode.style.visibility = 'visible';
                        info.textNode.innerText = text;
                    } else {
                        info.textNode.style.visibility = 'hidden';
                    }
                }
            }, 200)
        };
    },

    addSubtitle: function(id, language, text) {
        let info = Subtube.subInfos[id];
        info.subtitles[language] = Subtitle.parse(text);

        if(info.langSelect.querySelector(`[value="${language}"]`) === null) {
            let option = document.createElement('option');
            option.innerText = option.value = language;
            info.langSelect.appendChild(option);
        }
    },

    removeSubtitle: function(id, language) {
        delete Subtube.subInfos[id].subtitles[language];

        let info = Subtube.subInfos[id];
        let option = info?.langSelect.querySelector(`[value="${language}"]`);
        if(option !== null) {
            info.langSelect.removeChild(option);
        }
    },

    enableSubtitle: function (id, enabled=true) {
        Subtube.subInfos[id].enabled = enabled;
    },

    toggleSubtitle: function(id) {
        Subtube.subInfos[id].enabled = !Subtube.subInfos[id].enabled;
    },

    setSubtitleSize: function(id, percent) {
        Subtube.subInfos[id].textNode.style.fontSize = percent + "%";
    }
}

// Load Youtube iframe api
function onYouTubeIframeAPIReady() {
    document.querySelectorAll('iframe[subtube]').forEach(elm => {
        Subtube.createSRTPlayer(elm);
        elm.dispatchEvent(new CustomEvent('playerready', {target: elm}));
    });
}
(function() {
    let tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
})();
