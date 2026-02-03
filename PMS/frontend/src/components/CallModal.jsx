import React, { useEffect } from 'react';
import { Phone, Video, X, Mic, MicOff, VideoOff, Check } from 'lucide-react';

const CallModal = ({
    receivingCall,
    callAccepted,
    callEnded,
    name,
    answerCall,
    leaveCall,
    myVideo,
    userVideo,
    stream,
    isCalling
}) => {

    if (!receivingCall && !isCalling && !callAccepted) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-[800px] max-w-full flex flex-col items-center">

                {/* Header */}
                <div className="text-white text-xl mb-6 font-semibold">
                    {receivingCall && !callAccepted ? `Incoming Call from ${name}` : (isCalling && !callAccepted ? 'Calling...' : 'In Call')}
                </div>

                {/* Video Area */}
                <div className="flex gap-4 w-full h-[400px] justify-center relative bg-gray-900 rounded-xl overflow-hidden mb-6">
                    {/* My Video */}
                    <div className="w-1/2 h-full bg-black relative">
                        {stream && <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />}
                        <div className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">You</div>
                    </div>
                    {/* User Video */}
                    <div className="w-1/2 h-full bg-black relative">
                        {callAccepted && !callEnded ? (
                            <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                {isCalling ? 'Waiting for answer...' : 'Connecting...'}
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">Remote</div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6">
                    {receivingCall && !callAccepted && (
                        <button
                            onClick={answerCall}
                            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition shadow-lg animate-pulse"
                        >
                            <Phone size={32} />
                        </button>
                    )}

                    <button
                        onClick={leaveCall}
                        className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition shadow-lg"
                    >
                        <X size={32} />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CallModal;
