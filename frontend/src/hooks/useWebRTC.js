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
            setCallEnded(true);
            leaveCall();
            window.location.reload(); // Simple cleanup for MVP
        });

        return () => {
            socket.off('call_user');
            socket.off('call_ended');
        };
    }, []);

    const enableStream = async (video = true, audio = true) => {
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video, audio });
            setStream(currentStream);
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }
            return currentStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
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
            }
        });

        socket.on('call_accepted', (signal) => {
            setCallAccepted(true);
            peer.signal(signal);
        });

        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);
        if (connectionRef.current) {
            connectionRef.current.destroy();
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
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
        isCalling
    };
};

export default useWebRTC;
