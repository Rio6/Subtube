var Subtube = {

    // Fontsize relative to iframe
    baseFontSize: 0.025,

    subInfos: {},

    createSRTPlayer: function (iframe, videoId) {

        if(!iframe.id) return;
        if(Subtube.subInfos[iframe.id]) return;

        // Youtuve player API
        iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1`;
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

            let origin = -e.pageY;
            let offset = iframe.offsetHeight - srtText.offsetTop - srtText.offsetHeight;
            let pos = 0;

            let stopDrag = () => {
                document.onmousemove = null;
                iframe.style.pointerEvents = "";
            };

            document.onmousemove = e => {
                if(!e.buttons) {
                    stopDrag();
                } else {
                    pos = (-e.pageY - origin + offset);
                    if(pos > 0 && pos < iframe.offsetHeight - srtText.offsetHeight) {
                        srtText.style.bottom = pos / iframe.offsetHeight * 100 + '%';
                    }
                }
            };
            document.onmouseup = stopDrag;
        };

        // Menu div
        let menu = document.createElement('div');
        menu.className = 'subtube-menu';
        menu.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            padding: 0.1em;
            border-radius: 2px;
            transform: translate(-50%, 0);
            z-index: 2;
        `;
        menu.show = (autohide) => {
            if(menu.timeout) clearInterval(menu.timeout);
            menu.style.opacity = 100;

            if(autohide) {
                menu.timeout = setTimeout(() => {
                    if(player.getPlayerState() === YT.PlayerState.PLAYING) {
                        menu.style.opacity = 0;
                    }
                }, 3000);
            }
        };
        menu.onmouseenter = () => menu.show(false);
        menu.onmouseleave = () => menu.show(true);

        // Language selector
        let langSelect = document.createElement('select');
        langSelect.className = 'subtube-language';
        langSelect.innerHTML = `
            <option value="">Subtitle</option>
        `;
        langSelect.style.cssText = `
            font-size: 120%;
            text-align: center;
            vertical-align: top;
            margin-top: 0.25em;
        `;

        // Turns the whole container fullscreen, not just the iframe
        let fullscreenBtn = document.createElement('div');
        fullscreenBtn.title = "Fullscreen";
        fullscreenBtn.innerHTML = `
            <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%"><g><path fill="white" d="m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z"></path fill="white"></g><g><path fill="white" d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z"></path fill="white"></g><g><path fill="white" d="m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z"></path fill="white"></g><g><path fill="white" d="M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z"></path fill="white"></g></svg>
        `;
        fullscreenBtn.style.cssText = `
            width: 2em;;
            cursor: pointer;
            display: inline-block;
        `;
        fullscreenBtn.onclick = e => {
            if(document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                container.requestFullscreen();
            }
            menu.show(true);
        };

        // Add all elements to container
        container.appendChild(iframe);
        container.appendChild(srtText);
        menu.appendChild(langSelect);
        menu.appendChild(fullscreenBtn);
        container.appendChild(menu);

        if(Subtube.subInfos[iframe.id])
            clearInterval(Subtube.subInfos[iframe.id].updateInterval);

        player.addEventListener('onStateChange', ({data}) => {
            if(data.state === YT.PlayerState.PLAYING)
                menu.show(false);
            else
                menu.show(true);
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

        return player;
    },

    addSubtitle: function(id, language, text) {
        let info = Subtube.subInfos[id];

        if(!info) {
            console.warn("Trying to add subtitle to non-existent iframe");
            return;
        }

        info.subtitles[language] = Subtitle.parse(text);

        if(!info.langSelect.querySelector(`[value="${language}"]`)) {
            let option = document.createElement('option');
            option.innerText = option.value = language;
            info.langSelect.appendChild(option);
        }
    },

    removeSubtitle: function(id, language) {
        delete Subtube.subInfos[id].subtitles[language];

        let info = Subtube.subInfos[id];
        let option = info?.langSelect.querySelector(`[value="${language}"]`);
        if(!option) {
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
        elm.dispatchEvent(new CustomEvent('playerready', {
            target: elm,
            detail: {
                setId: id => Subtube.createSRTPlayer(elm, id)
            }
        }));
    });
}
(function() {
    let tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
})();
