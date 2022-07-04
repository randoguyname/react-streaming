function loadIFrameAPI() {
  let tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

loadIFrameAPI();


let player;
let stateChangeListeners = [];
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    // height: "390",
    // width: "640",
    videoId: "",
    playerVars: {
      playsInline: 1,
    },
    events: {
      // onReady: onPlayerReady,
      onStateChange: (...args) => {
        stateChangeListeners.forEach(l=>l(...args))
      },
    }
  })
}
