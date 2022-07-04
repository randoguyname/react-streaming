const ws = new WebSocket(`ws://react-streaming.herokuapp.com:8080/create`);
let code;
ws.addEventListener("message", ({data}) => {
  code = data
  document.querySelector(".code").textContent = code;
})

document.querySelector(".set-resource")?.addEventListener("click", ()=>{
  const videoId = prompt("Youtube Video Id:");

  player.loadVideoById(videoId);
  ws.send(JSON.stringify({type: "setstream", data:{
    resource: videoId,
    service: "youtube"
  }}))
})

document.querySelector(".set-host")?.addEventListener("click", ()=>{
  const channel = prompt("Host channel:");

  ws.send(JSON.stringify({type: "sethost", data:{
    resource: channel,
    service: "twitch"
  }}))
})

document.querySelector(".return")?.addEventListener("click", ()=>{

  ws.send(JSON.stringify({type: "return"}))
})

const states = {
  [-1]: "unstarted",
  0: "ended",
  1: "playing",
  2: "paused",
  3: "buffering",
  5: "video cued"
}

stateChangeListeners?.push(({data: state, target})=>{
  switch (state) {
    case 1:
      ws.send(JSON.stringify({type: "play", data:{timestamp: player.getCurrentTime()}, utc: Number(new Date())}))
      break;
    case 2:
      ws.send(JSON.stringify({type: "pause", data:{timestamp: player.getCurrentTime()}, utc: Number(new Date())}))
      break;
  }
})
