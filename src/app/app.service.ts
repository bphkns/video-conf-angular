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
          urls: 'stun:stun2.1.google.com:19302'
        }
      ]
    });

    this.remoteConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun2.1.google.com:19302'
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
  }

  setCandidate() {
    this.socket.on('candidate', data => {
      if (data.candidate !== null) {
        switch (data.type) {
          case 'local':
            this.remoteConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;

          case 'remote':
            this.selfConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
        }
      }
    });
  }

  createLocalOffer() {
    this.selfConnection.createOffer().then(desc => {
      this.socket.emit('offer', { from: this.socket.ioSocket.id, desc });
      this.selfConnection.setLocalDescription(new RTCSessionDescription(desc));
    });
  }

  getRemoteOffer() {
    this.socket.on('offer', data => {
      this.remoteConnection.setRemoteDescription(new RTCSessionDescription(data.desc));
      this.remoteConnection.createAnswer().then(desc => {
        this.remoteConnection.setLocalDescription(new RTCSessionDescription(desc));
        this.socket.emit('answer', { from: this.socket.ioSocket.id, desc });
      });
    });
  }

  getAnswer() {
    this.socket.on('answer', data => {
      this.selfConnection.setRemoteDescription(new RTCSessionDescription(data.desc));
    });
  }
}
