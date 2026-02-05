import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { getSocket } from '../services/socketService';
import CallModal from '../components/CallModal';
import { useAuth } from './AuthContext';

const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const { user } = useAuth();
    const [stream, setStream] = useState(null);
    const [call, setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [callerName, setCallerName] = useState('');
    const [isCalling, setIsCalling] = useState(false);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isRinging, setIsRinging] = useState(false);
    const [activeChatId, setActiveChatId] = useState(null);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    // Re-attach listeners whenever the user (and thus socket) might change
    useEffect(() => {
        let socket = getSocket();

        const handleIncomingCall = ({ from, name, signal }) => {
            console.log('📞 Incoming call from:', name, 'SocketID:', from);
            setCall({ isReceivingCall: true, from, signal });
            setCallerName(name);
            const s = getSocket();
            if (s) s.emit('ringing', { to: from });
        };

        const handleCallEndedEvent = () => {
            console.log('🔴 Call ended by remote');
            handleCallEnded();
        };

        const handleRingingEvent = () => {
            console.log('🔔 Remote is ringing');
            setIsRinging(true);
        };

        const setupListeners = (s) => {
            if (!s) return;
            console.log('🔌 [CallContext] Setting up socket listeners on:', s.id);
            s.off('call_user', handleIncomingCall);
            s.off('call_ended', handleCallEndedEvent);
            s.off('ringing', handleRingingEvent);

            s.on('call_user', handleIncomingCall);
            s.on('call_ended', handleCallEndedEvent);
            s.on('ringing', handleRingingEvent);
        };

        if (socket) {
            setupListeners(socket);
        } else if (user) {
            // If user is logged in but socket isn't ready, try briefly
            const retryInterval = setInterval(() => {
                const s = getSocket();
                if (s) {
                    setupListeners(s);
                    clearInterval(retryInterval);
                }
            }, 1000);
            return () => clearInterval(retryInterval);
        }

        return () => {
            const s = getSocket();
            if (s) {
                s.off('call_user', handleIncomingCall);
                s.off('call_ended', handleCallEndedEvent);
                s.off('ringing', handleRingingEvent);
            }
        };
    }, [user]);

    const enableStream = async (video = true, audio = true) => {
        try {
            console.log('📹 Enabling stream: video=', video, 'audio=', audio);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const currentStream = await navigator.mediaDevices.getUserMedia({
                video: video ? { width: 1280, height: 720 } : false,
                audio
            });

            setStream(currentStream);
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }
            return currentStream;
        } catch (error) {
            console.error('❌ Error accessing media devices:', error);
            alert('Could not access camera/microphone. Please ensure you have granted permissions and are on HTTPS (or localhost).');
            return null;
        }
    };

    const answerCall = async () => {
        console.log('✅ Answering call...');
        const currentStream = await enableStream(true, true);
        if (!currentStream) {
            console.error('❌ Cannot answer call: Stream not available');
            return;
        }

        setCallAccepted(true);
        const socket = getSocket();

        const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });

        peer.on('signal', (data) => {
            console.log('📡 Sending answer signal to:', call.from);
            socket.emit('answer_call', { signal: data, to: call.from });
        });

        peer.on('stream', (remoteStream) => {
            console.log('🌊 Received remote stream (Answerer)');
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        peer.on('error', (err) => console.error('🔥 Peer Error (Answerer):', err));

        peer.signal(call.signal);
        connectionRef.current = peer;
    };

    const callUser = async (chatId, name, isVideo = true) => {
        console.log('📞 Initiating call to chat:', chatId, 'name:', name);
        const currentStream = await enableStream(isVideo, true);
        if (!currentStream) {
            console.error('❌ Cannot initiate call: Stream not available');
            return;
        }

        setIsCalling(true);
        setCallerName(name);
        setActiveChatId(chatId);
        const socket = getSocket();
        if (!socket) {
            console.error('❌ Cannot initiate call: Socket not connected');
            return;
        }

        const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });

        peer.on('signal', (data) => {
            console.log('📡 Sending calling signal for chat:', chatId);
            socket.emit('call_user', {
                chatId: chatId,
                signalData: data,
                from: socket.id,
                name: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).fullName : 'User'
            });
        });

        peer.on('stream', (remoteStream) => {
            console.log('🌊 Received remote stream (Caller)');
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        peer.on('error', (err) => console.error('🔥 Peer Error (Caller):', err));

        const handleCallAccepted = ({ signal, from }) => {
            console.log('✅ Call accepted by remote:', from);
            setCallAccepted(true);
            setIsRinging(false);
            setCall(prev => ({ ...prev, from })); // Store responder's ID for hangup
            peer.signal(signal);
        };

        socket.on('call_accepted', handleCallAccepted);

        // Save clean up ref
        connectionRef.current = peer;
        connectionRef.current.socketCleanup = () => socket.off('call_accepted', handleCallAccepted);
    };

    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const leaveCall = () => {
        const socket = getSocket();
        if (socket) {
            socket.emit('end_call', {
                to: call.from,
                chatId: activeChatId
            });
        }
        handleCallEnded();
    };

    const handleCallEnded = () => {
        console.log('🧹 Cleaning up call state');
        setCallEnded(true);
        setIsCalling(false);

        if (connectionRef.current) {
            if (connectionRef.current.socketCleanup) connectionRef.current.socketCleanup();
            connectionRef.current.destroy();
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        setStream(null);
        setCallAccepted(false);
        setCall({});
        setIsAudioMuted(false);
        setIsVideoOff(false);
        setIsRinging(false);
        setActiveChatId(null);

        if (myVideo.current) myVideo.current.srcObject = null;
        if (userVideo.current) userVideo.current.srcObject = null;

        setTimeout(() => setCallEnded(false), 2000);
    };

    return (
        <CallContext.Provider value={{
            call,
            callAccepted,
            callEnded,
            myVideo,
            userVideo,
            stream,
            name: callerName,
            isCalling,
            isAudioMuted,
            isVideoOff,
            isRinging,
            callUser,
            answerCall,
            leaveCall,
            toggleAudio,
            toggleVideo
        }}>
            {children}
            <CallModal
                receivingCall={call.isReceivingCall}
                callAccepted={callAccepted}
                callEnded={callEnded}
                name={callerName}
                answerCall={answerCall}
                leaveCall={leaveCall}
                myVideo={myVideo}
                userVideo={userVideo}
                stream={stream}
                isCalling={isCalling}
                isAudioMuted={isAudioMuted}
                isVideoOff={isVideoOff}
                isRinging={isRinging}
                toggleAudio={toggleAudio}
                toggleVideo={toggleVideo}
            />
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
