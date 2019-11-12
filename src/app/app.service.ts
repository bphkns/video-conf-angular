import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
@Injectable({
  providedIn: 'root'
})
export class AppService {

  selfConnection: RTCPeerConnection;
  remoteConnection: RTCPeerConnection;

  constructor(private socket: Socket) { }


  setupLocalStream(stream: MediaStream) {
    this.selfConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:167.71.226.201:3478'
        }
        ,
        {
          urls: 'turn:167.71.226.201:3478',
          username: 'test',
          credential: 'test'
        }
      ]
    });

    this.remoteConnection = new RTCPeerConnection({
      iceServers: [{
        urls: 'stun:167.71.226.201:3478'
      },
      {
        urls: 'turn:167.71.226.201:3478',
        username: 'test',
        credential: 'test'
      }
      ]
    });

    stream.getTracks().forEach(track => {
      this.selfConnection.addTrack(track, stream);
    });
    this.addLocalICECandidate();
    this.addRemoteICECandidate();
    this.setCandidate();
    this.createLocalOffer();
    this.checkForNew();
    this.getRemoteOffer();
    this.getAnswer();
  }

  addLocalICECandidate() {
    this.selfConnection.onicecandidate = (event) => {
      this.socket.emit('candidate', { from: this.socket.ioSocket.id, candidate: event.candidate, type: 'local' });
    };
  }

  addRemoteICECandidate() {
    this.remoteConnection.onicecandidate = (event) => {
      this.socket.emit('candidate', { from: this.socket.ioSocket.id, candidate: event.candidate, type: 'remote' });
    };

    this.remoteConnection.oniceconnectionstatechange = () => {
      console.log(this.remoteConnection.iceConnectionState);
    };
  }

  setCandidate() {
    this.socket.on('candidate', data => {
      if (data.candidate !== null) {
        switch (data.type) {
          case 'local':
            console.log(`setting Ice candidate local`);
            this.remoteConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;

          case 'remote':
            console.log(`setting Ice candidate remote`);
            this.selfConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
        }
      }
    });
  }

  createLocalOffer() {
    this.selfConnection.createOffer().then(desc => {
      console.log(`Setting Local local Desc`);
      this.selfConnection.setLocalDescription(new RTCSessionDescription(desc));
      this.socket.emit('offer', { from: this.socket.ioSocket.id, desc: this.selfConnection.localDescription });
    });
  }

  checkForNew() {
    this.socket.emit('newUser', { from: this.socket.ioSocket.id });
    this.socket.on('newUser', data => {
      console.log(`Creating offer Again`);
      this.createLocalOffer();
    });
  }

  getRemoteOffer() {
    this.socket.on('offer', data => {
      console.log(`Setting remote remote Desc`);
      this.remoteConnection.setRemoteDescription(new RTCSessionDescription(data.desc));
      this.remoteConnection.createAnswer().then(desc => {
        console.log(`Setting remote Local Desc`);
        this.remoteConnection.setLocalDescription(new RTCSessionDescription(desc));
        this.socket.emit('answer', { from: this.socket.ioSocket.id, desc: this.remoteConnection.localDescription });
      });
    });
  }

  getAnswer() {
    this.socket.on('answer', data => {
      console.log(`Setting local remote Desc`);
      this.selfConnection.setRemoteDescription(new RTCSessionDescription(data.desc));
    });
  }
}
