const iframeId = 'iframe-player';

function loadSubtitle(params) {
    params.forEach((url, key) => {
        if(key.startsWith('subtitle-')) {
            fetch(url)
                .then(res => res.text())
                .then(res => Subtube.addSubtitle(iframeId, res))
                .catch(console.error);
        }
    });
}

let params = new URLSearchParams(window.location.search);
let videoId = params.get('v').replace(/[^a-zA-Z0-9_\-]/, '');

let iframe = document.getElementById(iframeId);
iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
