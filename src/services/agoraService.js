import AgoraRTC from 'agora-rtc-sdk-ng';

class AgoraService {
  constructor() {
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    this.localAudioTrack = null;
    this.localVideoTrack = null;
    this.remoteUsers = {};
    
    // Default video configuration (Auto)
    this.videoConfig = 'auto'; 
    
    // We bind events so they can be listened to
    this.client.on("user-published", this.handleUserPublished.bind(this));
    this.client.on("user-unpublished", this.handleUserUnpublished.bind(this));
    this.client.on("user-left", this.handleUserLeft.bind(this));
    
    this.onUserJoined = null;
    this.onUserLeft = null;
    this.onTrackPublished = null;
  }

  setListeners({ onUserJoined, onUserLeft, onTrackPublished }) {
    this.onUserJoined = onUserJoined;
    this.onUserLeft = onUserLeft;
    this.onTrackPublished = onTrackPublished;
  }

  async handleUserPublished(user, mediaType) {
    await this.client.subscribe(user, mediaType);
    this.remoteUsers[user.uid] = user;
    
    if (this.onUserJoined) {
      this.onUserJoined(user);
    }
    if (this.onTrackPublished) {
      this.onTrackPublished(user, mediaType);
    }
    
    if (mediaType === "audio") {
      user.audioTrack?.play();
    }
  }

  handleUserUnpublished(user, mediaType) {
    if (this.onTrackPublished) {
      this.onTrackPublished(user, mediaType, false); // false for unpublished
    }
  }

  handleUserLeft(user) {
    delete this.remoteUsers[user.uid];
    if (this.onUserLeft) {
      this.onUserLeft(user);
    }
  }

  async joinChannel(appId, channelName, token, uid) {
    try {
      window.dispatchEvent(new CustomEvent('orvix-debug-log', {
        detail: { source: 'agoraService', title: 'AGORA_JOIN_STARTED', data: { channelName } }
      }));

      await this.client.join(appId, channelName, token, uid);
      
      window.dispatchEvent(new CustomEvent('orvix-debug-log', {
        detail: { source: 'agoraService', title: 'AGORA_JOIN_SUCCESS', data: { uid } }
      }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent('orvix-debug-log', {
        detail: { source: 'agoraService', title: 'AGORA_JOIN_ERROR', data: { error: error.message } }
      }));
      throw error;
    }
  }

  async publishLocalAudio() {
    if (!this.localAudioTrack) {
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await this.client.publish(this.localAudioTrack);
    }
    return this.localAudioTrack;
  }

  async publishLocalVideo() {
    if (!this.localVideoTrack) {
      this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
      await this.setVideoEncoderConfiguration(this.videoConfig);
      await this.client.publish(this.localVideoTrack);
    }
    return this.localVideoTrack;
  }

  async setVideoEncoderConfiguration(resolution) {
    if (!this.localVideoTrack) return;
    try {
      this.videoConfig = resolution;
      let config = {};
      switch (resolution) {
        case '360p':
          config = { width: 640, height: 360, frameRate: 15, bitrateMin: 400, bitrateMax: 800 };
          break;
        case '480p':
          config = { width: 854, height: 480, frameRate: 15, bitrateMin: 800, bitrateMax: 1200 };
          break;
        case '720p':
          config = { width: 1280, height: 720, frameRate: 24, bitrateMin: 1500, bitrateMax: 2500 };
          break;
        default:
          config = { width: { max: 1280 }, height: { max: 720 }, frameRate: { max: 30 } }; // Auto
      }
      await this.localVideoTrack.setEncoderConfiguration(config);
      
      window.dispatchEvent(new CustomEvent('orvix-debug-log', {
        detail: { source: 'agoraService', title: 'VIDEO_RESOLUTION_CHANGED', data: { resolution, config } }
      }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('orvix-debug-log', {
        detail: { source: 'agoraService', title: 'VIDEO_RESOLUTION_ERROR', data: { error: e.message } }
      }));
    }
  }

  async switchCamera() {
    if (this.localVideoTrack) {
      const devices = await AgoraRTC.getCameras();
      if (devices.length > 1) {
        // Simple toggle for mobile (facing mode) 
        // Note: SDK handles device switching natively or via setDevice
        // Assuming current is 0, we switch to 1. Realistically we should track deviceId.
        const currentDeviceId = this.localVideoTrack.getTrackLabel();
        const nextDevice = devices.find(d => d.label !== currentDeviceId) || devices[0];
        await this.localVideoTrack.setDevice(nextDevice.deviceId);
      }
    }
  }

  async leaveChannel() {
    this.localAudioTrack?.close();
    this.localVideoTrack?.close();
    
    this.localAudioTrack = null;
    this.localVideoTrack = null;
    
    this.client.removeAllListeners();
    await this.client.leave();
  }

  setAudioMuted(muted) {
    if (this.localAudioTrack) {
      this.localAudioTrack.setMuted(muted);
    }
  }

  setVideoMuted(muted) {
    if (this.localVideoTrack) {
      this.localVideoTrack.setMuted(muted);
    }
  }
}

export const agoraService = new AgoraService();
