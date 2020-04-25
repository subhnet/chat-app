import React, { useState } from 'react';
import SockJsClient from 'react-stomp';
import Input from './components/Input';
import LoginForm from './components/LoginForm';
import Messages from './components/Messages/Messages';
import { randomColor } from './utils/common';

import './App.css';
import chatAPI from './services/chatapi';

var stompClient;
const SOCKET_URL = 'http://localhost:8080/ws-chat/';

const App = () => {
  const [messages, setMessages] = useState([])
  const [user, setUser] = useState(null)

  let onConnected = () => {
    console.log("Connected!!")
    const Stomp = require('stompjs');
    const SockJS = require('sockjs-client');
    const socket = new SockJS(SOCKET_URL);
    stompClient = Stomp.over(socket);
  }

  let onMessageReceived = (msg) => {
    console.log('New Message Received!!', msg);
    setMessages(messages.concat(msg));
  }

  let onSendMessage = (message) => {
    // chatAPI.sendMessage(message).then(res => {
    //   console.log('Sent', res);
    // }).catch(err => {
    //   console.log('Error Occured while sendinf to api');
    // })



    if (stompClient) {
      // send public message
      console.log('Sending Group message...', message)

      var chatMessage = {
        sender: user.username,
        content: message
      };
      stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
    }
  }

  let handleLoginSubmit = (username) => {
    console.log(username);
    setUser({
      username: username,
      color: randomColor()
    })
  }

  return (
    <div className="App">
      {!!user ?
        (
          <>
            <SockJsClient
              url={SOCKET_URL}
              topics={['/topic/group']}
              onConnect={onConnected}
              onDisconnect={console.log("Disconnected!")}
              onMessage={(msg) => onMessageReceived(msg)}
              debug={false}
            />
            <Messages
              messages={messages}
              currentUser={user}
            />
            <Input onSendMessage={onSendMessage} />
          </>
        ) :
        <LoginForm onSubmit={handleLoginSubmit} />
      }
    </div>
  )
}

export default App;
