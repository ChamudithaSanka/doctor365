import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import '../styles/AgoraVideoCall.css'; // Ensure this file exists

/**
 * AgoraVideoCall Component
 * Handles real-time video calling using Agora RTC SDK
 * 
 * Props:
 * - sessionData: Object containing { appId, agoraChannelName, doctorToken, patientToken, doctorUid, patientUid, ... }
 * - userRole: 'doctor' or 'patient'
 * - onLeave: Callback function when user leaves the call
 */
const AgoraVideoCall = ({ sessionData, userRole, onLeave }) => {
  // State management
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localUserInfo, setLocalUserInfo] = useState(null);

  // Refs to prevent race conditions from React StrictMode
  const clientRef = useRef(null);
  const joinedRef = useRef(false);
  const joiningRef = useRef(false);
  const listenersSetupRef = useRef(false);
  const localTracksRef = useRef([]);
  const localContainerRef = useRef(null);
  const remoteContainersRef = useRef({});

  /**
   * Initialize Agora Client and Join Channel
   */
  const initializeAndJoin = async () => {
    if (joiningRef.current || joinedRef.current) {
      console.log('Already joining or joined. Skipping...');
      return;
    }

    joiningRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Debug: Log received session data
      console.log('📡 Session Data Received:', sessionData);
      console.log('   appId:', sessionData?.appId);
      console.log('   channelName:', sessionData?.agoraChannelName);
      console.log('   doctorToken:', sessionData?.doctorToken ? '✓ Present' : '✗ Missing');
      console.log('   patientToken:', sessionData?.patientToken ? '✓ Present' : '✗ Missing');
      console.log('   userRole:', userRole);

      // Validate session data
      if (!sessionData?.appId) {
        throw new Error('Missing appId - backend did not include Agora App ID in response');
      }

      if (!sessionData?.agoraChannelName) {
        throw new Error('Missing agoraChannelName - channel name not provided');
      }

      if (!sessionData?.doctorToken && !sessionData?.patientToken) {
        throw new Error('Missing RTC tokens for this session');
      }

      const token = userRole === 'doctor' ? sessionData.doctorToken : sessionData.patientToken;
      const uid = userRole === 'doctor' ? sessionData.doctorUid : sessionData.patientUid;

      if (!token) {
        throw new Error(`Missing ${userRole} token`);
      }

      if (!uid && uid !== 0) {
        throw new Error(`Missing ${userRole} UID`);
      }

      console.log(`🎥 Joining Agora channel as ${userRole}`);
      console.log(`   App ID: ${sessionData.appId}`);
      console.log(`   Channel: ${sessionData.agoraChannelName}`);
      console.log(`   Token: ${token.substring(0, 20)}...`);
      console.log(`   UID: ${uid}`);

      // Create Agora RTC client (only once)
      if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({
          mode: 'rtc',
          codec: 'vp8'
        });
      }

      const client = clientRef.current;

      // Setup event listeners (only once)
      if (!listenersSetupRef.current) {
        setupEventListeners(client);
        listenersSetupRef.current = true;
      }

      // Join the channel
      console.log(`🔗 Calling client.join() with:`);
      console.log(`   appId: ${sessionData.appId}`);
      console.log(`   appId type: ${typeof sessionData.appId}`);
      console.log(`   appId length: ${sessionData.appId?.length}`);
      console.log(`   channel: ${sessionData.agoraChannelName}`);
      console.log(`   uid: ${uid}`);
      
      // CRITICAL: Verify appId is not undefined, null, or empty
      if (!sessionData.appId || sessionData.appId.length === 0) {
        throw new Error(`CRITICAL: appId is ${sessionData.appId} (${typeof sessionData.appId})`);
      }

      await client.join(sessionData.appId, sessionData.agoraChannelName, token, uid);
      console.log(`✅ Successfully joined channel: ${sessionData.agoraChannelName}`);

      // Create audio and video tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = [audioTrack, videoTrack];

      // Set local user info
      setLocalUserInfo({
        uid,
        role: userRole,
        audioTrack,
        videoTrack,
      });

      // Publish local tracks
      await client.publish([audioTrack, videoTrack]);
      console.log('✅ Local audio and video published');

      // Render local video
      if (localContainerRef.current) {
        videoTrack.play(localContainerRef.current);
      }

      joinedRef.current = true;
      setIsJoined(true);
    } catch (err) {
      console.error('❌ Failed to join channel:', err);
      setError(`Failed to join call: ${err.message}`);
      joinedRef.current = false;
    } finally {
      joiningRef.current = false;
      setIsLoading(false);
    }
  };

  /**
   * Setup Agora event listeners
   */
  const setupEventListeners = (client) => {
    // When a remote user publishes media
    client.on('user-published', async (user, mediaType) => {
      console.log(`👤 User ${user.uid} published ${mediaType}`);
      
      // Subscribe to the remote user
      await client.subscribe(user, mediaType);

      // Update remote users state
      setRemoteUsers(prevUsers => {
        const userExists = prevUsers.some(u => u.uid === user.uid);
        if (!userExists) {
          return [...prevUsers, user];
        }
        return prevUsers;
      });

      // Render remote video if it's a video track
      if (mediaType === 'video' && user.videoTrack) {
        const remoteContainer = document.getElementById(`remote-user-${user.uid}`);
        if (remoteContainer) {
          user.videoTrack.play(remoteContainer);
        }
      }

      // Play remote audio
      if (mediaType === 'audio' && user.audioTrack) {
        user.audioTrack.play();
      }
    });

    // When a remote user unpublishes media
    client.on('user-unpublished', (user, mediaType) => {
      console.log(`👤 User ${user.uid} unpublished ${mediaType}`);
    });

    // When a remote user leaves the channel
    client.on('user-left', (user) => {
      console.log(`👤 User ${user.uid} left the channel`);
      
      // Remove remote user from state
      setRemoteUsers(prevUsers =>
        prevUsers.filter(u => u.uid !== user.uid)
      );

      // Clean up remote container
      const remoteContainer = document.getElementById(`remote-user-${user.uid}`);
      if (remoteContainer) {
        remoteContainer.innerHTML = '';
      }
    });

    // Connection state change
    client.on('connection-state-change', (curState, prevState, reason) => {
      console.log(`🔗 Connection state: ${prevState} → ${curState}`);
      if (reason === 'NETWORK_ERROR' || reason === 'NETWORK_FAILURE') {
        setError(`Network error: ${reason}`);
      }
    });
  };

  /**
   * Handle leaving the call
   */
  const handleLeaveCall = async () => {
    try {
      setIsLoading(true);

      // Stop and close local tracks
      localTracksRef.current.forEach(track => {
        track?.stop();
        track?.close();
      });
      localTracksRef.current = [];

      // Leave channel
      const client = clientRef.current;
      if (client) {
        await client.leave();
      }

      // Reset refs
      joinedRef.current = false;
      joiningRef.current = false;
      listenersSetupRef.current = false;
      clientRef.current = null;

      // Reset state
      setIsJoined(false);
      setRemoteUsers([]);
      setLocalUserInfo(null);
      setIsMuted(false);
      setIsVideoOff(false);

      console.log('✅ Successfully left the channel');

      // Call the onLeave callback
      if (onLeave) {
        onLeave();
      }
    } catch (err) {
      console.error('❌ Error leaving call:', err);
      setError(`Error leaving call: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle audio mute
   */
  const toggleMute = async () => {
    try {
      if (localTracksRef.current[0]) {
        await localTracksRef.current[0].setEnabled(!isMuted);
        setIsMuted(!isMuted);
        console.log(`🎤 Audio ${!isMuted ? 'enabled' : 'muted'}`);
      }
    } catch (err) {
      console.error('Error toggling audio:', err);
      setError(`Error toggling audio: ${err.message}`);
    }
  };

  /**
   * Toggle video on/off
   */
  const toggleVideo = async () => {
    try {
      if (localTracksRef.current[1]) {
        await localTracksRef.current[1].setEnabled(isVideoOff);
        setIsVideoOff(!isVideoOff);
        console.log(`📹 Video ${isVideoOff ? 'enabled' : 'disabled'}`);
      }
    } catch (err) {
      console.error('Error toggling video:', err);
      setError(`Error toggling video: ${err.message}`);
    }
  };

  /**
   * useEffect: Initialize and join on component mount
   */
  useEffect(() => {
    initializeAndJoin();

    // Cleanup on unmount
    return () => {
      if (joinedRef.current) {
        handleLeaveCall();
      }
    };
  }, [sessionData?.agoraChannelName]); // Rejoin if channel changes

  return (
    <div className="agora-video-call-container">
      {/* Header */}
      <div className="agora-header">
        <h2>Video Call - {userRole === 'doctor' ? 'Doctor' : 'Patient'}</h2>
        <span className={`status-badge ${isJoined ? 'connected' : 'disconnected'}`}>
          {isJoined ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Video Container */}
      <div className="video-container">
        {/* Local Video */}
        <div className="local-video-wrapper">
          <div 
            ref={localContainerRef} 
            id="local-user-container"
            className="video-frame local"
          >
            {!isJoined && (
              <div className="placeholder">
                {isLoading ? 'Connecting...' : 'Waiting for connection...'}
              </div>
            )}
          </div>
          <div className="video-label">You ({userRole})</div>
        </div>

        {/* Remote Videos */}
        <div className="remote-videos-grid">
          {remoteUsers.length === 0 && isJoined && (
            <div className="no-remote-users">
              <p>Waiting for {userRole === 'doctor' ? 'patient' : 'doctor'} to join...</p>
            </div>
          )}

          {remoteUsers.map(user => (
            <div key={user.uid} className="remote-video-wrapper">
              <div
                id={`remote-user-${user.uid}`}
                className="video-frame remote"
              >
                <div className="placeholder">
                  {user.videoTrack ? 'Video loading...' : 'No video'}
                </div>
              </div>
              <div className="video-label">
                {userRole === 'doctor' ? 'Patient' : 'Doctor'} ({user.uid})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="call-controls">
        <button
          className={`control-btn ${isMuted ? 'active' : ''}`}
          onClick={toggleMute}
          disabled={!isJoined || isLoading}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          <span>{isMuted ? '🔇' : '🎤'}</span>
          <span>{isMuted ? 'Muted' : 'Mute'}</span>
        </button>

        <button
          className={`control-btn ${isVideoOff ? 'active' : ''}`}
          onClick={toggleVideo}
          disabled={!isJoined || isLoading}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          <span>{isVideoOff ? '📹' : '📷'}</span>
          <span>{isVideoOff ? 'Camera Off' : 'Camera On'}</span>
        </button>

        <button
          className="control-btn end-call-btn"
          onClick={handleLeaveCall}
          disabled={isLoading}
        >
          <span>📞</span>
          <span>End Call</span>
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
};

export default AgoraVideoCall;
