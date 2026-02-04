import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { getSocket } from '../services/socketService';

const useWebRTC = () => {
    const [stream, setStream] = useState(null);
    const [me, setMe] = useState('');
    const [call, setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('');
    const [isCalling, setIsCalling] = useState(false);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        setMe(socket.id); // Or use user ID from auth

        socket.on('call_user', ({ from, name: callerName, signal }) => {
            setCall({ isReceivingCall: true, from, name: callerName, signal });
        });

        socket.on('call_ended', () => {
            leaveCall();
        });

        return () => {
            socket.off('call_user');
            socket.off('call_ended');
            socket.off('call_accepted');
        };
    }, []);

    const enableStream = async (video = true, audio = true) => {
        try {
            // Stop any existing tracks before starting a new stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const currentStream = await navigator.mediaDevices.getUserMedia({
                video: video ? { width: 640, height: 480 } : false,
                audio
            });

            setStream(currentStream);
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }
            return currentStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            alert('Could not access camera/microphone. Please check permissions.');
        }
    };

    const answerCall = () => {
        setCallAccepted(true);
        const socket = getSocket();

        const peer = new Peer({ initiator: false, trickle: false, stream });

        peer.on('signal', (data) => {
            socket.emit('answer_call', { signal: data, to: call.from });
        });

        peer.on('stream', (currentStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = currentStream;
                userVideo.current.play().catch(e => console.error("Error playing user video:", e));
            }
        });

        peer.signal(call.signal);
        connectionRef.current = peer;
    };

    const callUser = (chatId) => {
        setIsCalling(true);
        const socket = getSocket();

        const peer = new Peer({ initiator: true, trickle: false, stream });

        peer.on('signal', (data) => {
            socket.emit('call_user', {
                chatId: chatId,
                signalData: data,
                from: me,
                name: name
            });
        });

        peer.on('stream', (currentStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = currentStream;
                userVideo.current.play().catch(e => console.error("Error playing user video:", e));
            }
        });

        socket.on('call_accepted', (signal) => {
            setCallAccepted(true);
            peer.signal(signal);
        });

        connectionRef.current = peer;
    };

    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

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
        setCallEnded(true);
        setIsCalling(false);

        const socket = getSocket();
        if (socket && call.from) {
            socket.emit('end_call', { to: call.from });
        }

        if (connectionRef.current) {
            connectionRef.current.destroy();
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        setStream(null);
        setCallAccepted(false);
        setCall({});

        // Reset video sources
        if (myVideo.current) myVideo.current.srcObject = null;
        if (userVideo.current) userVideo.current.srcObject = null;

        setTimeout(() => setCallEnded(false), 2000);
    };

    return {
        call,
        callAccepted,
        myVideo,
        userVideo,
        stream,
        name,
        setName,
        callEnded,
        me,
        callUser,
        answerCall,
        leaveCall,
        enableStream,
        isCalling,
        isAudioMuted,
        isVideoOff,
        toggleAudio,
        toggleVideo
    };
};

export default useWebRTC;
