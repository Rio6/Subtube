const iframeId = 'iframe-player';

function loadSubtitle(params) {
    params.forEach((url, key) => {
        if(key.startsWith('subtitle-')) {
            let language = key.replace(/^subtitle-/, '');
            fetch(url, {mode: 'cors'})
                .then(res => res.text())
                .then(res => Subtube.addSubtitle(iframeId, language, res))
                .catch(console.error);
        }
    });
}

let params = new URLSearchParams(window.location.search);
let videoId = params.get('v').replace(/[^a-zA-Z0-9_\-]/, '');

let iframe = document.getElementById(iframeId);
iframe.addEventListener('playerready', e => {
    e.detail.setId(videoId);
    loadSubtitle(params);
});
