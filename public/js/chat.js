const socket = io();

//elements
const messageForm = document.querySelector(".msgForm");
const messageFormInput = document.querySelector("#msg");
const messageFormButton = document.querySelector("#btn");
const sendLocationButton = document.querySelector("#send-location");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const leaveBtn = document.getElementById("leave-btn");
const messages = document.querySelector("#messages");

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;

//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  //new message element
  const newMessage = messages.lastElementChild;

  //get the height of the new message
  const newMessageStyle = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyle.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  //visible height
  const visibleHeight = messages.offsetHeight;

  //height of messages container
  const containerHeight = messages.scrollHeight;

  //how far i have scrolled
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

leaveBtn.addEventListener("click", () => {
  const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
  if (leaveRoom) {
    window.location = "../index.html";
  }
});

socket.on("locationMessage", (locationMessage) => {
  const html = Mustache.render(locationTemplate, {
    username: locationMessage.username,
    url: locationMessage.url,
    createdAt: moment(locationMessage.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  //disable
  messageFormButton.setAttribute("disabled", "disabled");

  socket.emit("sendMessage", messageFormInput.value, (error) => {
    //enable
    messageFormButton.removeAttribute("disabled");
    if (error) {
      return console.log(error);
    }
  });
  messageFormInput.value = "";
  messageFormInput.focus();
});

sendLocationButton.addEventListener("click", (e) => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    const data = {
      lat: position.coords.latitude,
      long: position.coords.longitude,
    };
    socket.emit("sendLocation", data, () => {
      sendLocationButton.removeAttribute("disabled");
    });
  });
});

socket.emit("join", { username, room }, (error, users) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

socket.on("roomUsers", ({ room, users }) => {
  outputUserRoom(room);
  outputUsers(users);
});

function outputUserRoom(room) {
  roomName.innerHTML = room;
}

function outputUsers(users) {
  // userList.innerHTML = `
  // ${users.map((user) => `<li>${user.username}</li>`).join()}`;

  let finalHTML = "";
  users
    .map((user) => {
      finalHTML = finalHTML + `<li>${user.username}</li>`;
    })
    .join();

  userList.innerHTML = finalHTML;
}
