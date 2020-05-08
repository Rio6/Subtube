var subInfos = {};

function onYouTubeIframeAPIReady() {
    document.querySelectorAll('iframe[src^="https://www.youtube.com/embed"]').forEach(elm => {
        createSRTPlayer(elm);
    });
}

function createSRTPlayer(iframe) {

    if(!iframe.id) return;

    // Create a container that hold both the iframe and srt div
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
    let srtDiv = document.createElement('div');
    srtDiv.style.cssText = `
        position: absolute;
        pointer-events: none;
        text-align: center;
        bottom: 0;
        width: 100%;
        z-index: 1;
    `;

    let srtText = document.createElement('span');
    srtText.id = iframe.id + '-srt';
    srtText.style.cssText = `
        color: white;
        background-color: rgba(0, 0, 0, 0.85);
        padding: 1px 2px;
        visibility: hidden;
    `;

    let fullscreenBtn = document.createElement('div');
    fullscreenBtn.style.cssText = `
        position: absolute;
        bottom: 1px;
        right: 12px;
        width: 30px;
        height: 30px;
        z-index: 2;
        background: rgba(0, 0, 0, 0.6);
        cursor: pointer;
    `;
    fullscreenBtn.onmouseenter = e => {
        iframe.dispatchEvent(new MouseEvent(e.type, e));
    };
    fullscreenBtn.onclick = e => {
        if(document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen();
        }
    };

    srtDiv.appendChild(srtText);
    container.appendChild(iframe);
    container.appendChild(srtDiv);
    container.appendChild(fullscreenBtn);

    subInfos[iframe.id] = {
        player: new YT.Player(iframe.id),
        subtitles: [],
        current: 0,
        textNode: srtText,
        updateInterval: setInterval(() => {
            let info = subInfos[iframe.id];
            let text = "";

            if(info.subtitles && info.subtitles.length > 0) {
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
        }, 500)
    };
}

function addSubtitle(id, text) {
    if(!subInfos[id]) return;
    subInfos[id].subtitles = Subtitle.parse(text);
}

// Load Youtube iframe api
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);
