var subInfos = {};

function onYouTubeIframeAPIReady() {
    document.querySelectorAll('iframe[subtube]').forEach(elm => {
        createSRTPlayer(elm);
    });
}

function createSRTPlayer(iframe) {

    if(!iframe.id) return;

    // Create a container that hold both the iframe and subtitle
    let container = document.createElement('div');
    container.style.cssText = `
        position: relative;
        width: ${iframe.width}px;
        height: ${iframe.height}px;
    `;

    iframe.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    `;
    iframe.parentNode.replaceChild(container, iframe);

    // SRT element
    let srtText = document.createElement('span');
    srtText.style.cssText = `
        position: absolute;
        left: 50%;
        bottom: 0;
        transform: translate(-50%, 0);
        color: white;
        background-color: rgba(0, 0, 0, 0.8);
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

    let fullscreenBtn = document.createElement('div');
    fullscreenBtn.style.cssText = `
        position: absolute;
        bottom: 1px;
        right: 12px;
        width: 30px;
        height: 30px;
        z-index: 2;
        cursor: pointer;
    `;
    fullscreenBtn.onclick = e => {
        if(document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen();
        }
    };

    container.appendChild(iframe);
    container.appendChild(srtText);
    container.appendChild(fullscreenBtn);

    if(subInfos[iframe.id])
        clearInterval(subInfos[iframe.id].updateInterval);

    subInfos[iframe.id] = {
        player: new YT.Player(iframe.id),
        subtitles: [],
        current: 0,
        enabled: true,
        textNode: srtText,

        // Updates subtitle
        updateInterval: setInterval(() => {
            let info = subInfos[iframe.id];
            let text = "";

            if(info.enabled && info.subtitles && info.subtitles.length > 0) {
                if(!info.subtitles[info.current]) info.current = 0;

                let time = info.player.getCurrentTime() * 1000;
                let i = info.current;

                while(i > 0 && info.subtitles[i].start > time) {
                    i--;
                }

                while(i < info.subtitles.length && info.subtitles[i].end <= time) {
                    i++;
                }

                while(i < info.subtitles.length
                    && info.subtitles[i].start <= time
                    && info.subtitles[i].end > time) {

                    text += info.subtitles[i].text;
                    i++;
                }

                info.current = i;
            }

            if(text !== "") {
                info.textNode.style.visibility = 'visible';
                info.textNode.innerText = text;
            } else {
                info.textNode.style.visibility = 'hidden';
            }
        }, 200)
    };
}

function addSubtitle(id, text) {
    subInfos[id].subtitles = Subtitle.parse(text);
}

function enableSubtitle(id, enabled=true) {
    subInfos[id].enabled = enabled;
}

function toggleSubtitle(id) {
    subInfos[id].enabled = !subInfos[id].enabled;
}

function setSubtitleSize(id, percent) {
    subInfos[id].textNode.style.fontSize = percent + "%";
}

// Load Youtube iframe api
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);
