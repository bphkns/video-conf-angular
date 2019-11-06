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
      console.log(track);
      this.selfConnection.addTrack(track);
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
      this.socket.emit('candidate', { id: this.socket.ioSocket.id, event: event.candidate });
    };
  }

  addRemoteICECandidate() {
    this.remoteConnection.onicecandidate = (event) => {
      this.socket.emit('candidate', { id: this.socket.ioSocket.id, event: event.candidate });
    };
  }

  setCandidate() {
    this.socket.on('candidate', data => {
      if (data.from !== this.socket.ioSocket.id) {
        this.selfConnection.addIceCandidate(data.candidate);
      }

      this.remoteConnection.addIceCandidate(data.candidate);
    });
  }

  createLocalOffer() {
    this.selfConnection.createOffer().then(desc => {
      this.socket.emit('offer', { from: this.socket.ioSocket.id, sdp: desc.sdp });
      this.selfConnection.setLocalDescription(desc);
      this.remoteConnection.setRemoteDescription(desc);
    });
  }

  getRemoteOffer() {
    this.socket.on('offer', data => {
      this.remoteConnection.setLocalDescription(data.sdp);
      this.selfConnection.setRemoteDescription(data.sdp);
      this.selfConnection.createAnswer().then(desc => {
        this.socket.emit('answer', { from: this.socket.ioSocket.id, sdp: desc.sdp });
      });
    });
  }

  getAnswer() {
    this.socket.on('answer', data => {
      this.remoteConnection.setLocalDescription(data.sdp);
      this.selfConnection.setRemoteDescription(data.sdp);
    });
  }
}
