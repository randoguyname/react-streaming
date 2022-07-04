const ws = new WebSocket(`wss://react-streaming.herokuapp.com:8080/listen/${prompt("Enter code:")}`)

ws.addEventListener("message", (message)=>{
  const {type, data, ...rest} = JSON.parse(message.data);
  console.log(data);
  if ("timestamp" in data) {
    player.seekTo(data.utc ? data.timestamp + (new Date() - data.utc) / 1000 : data.timestamp);
  }
  switch (type) {
    case "pause":
      player.pauseVideo();
      break;
    case "play":
      player.playVideo(data.timestamp);
      break;
    case "info":
      if (data.stream.service == "youtube") {
        player.loadVideoById(data.stream.resource);
      }
      if (data.host.service == "twitch") {
        twitchPlayer.setChannel(data.host.resource);
      }
      break;
    case "return":
      window.location.href = `https://twitch.tv/${data.resource}`;
      break;
  }
})

