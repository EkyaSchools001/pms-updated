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
    isCalling,
    isAudioMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo
}) => {

    if (!receivingCall && !isCalling && !callAccepted) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="bg-gray-900 rounded-3xl shadow-2xl p-8 w-[900px] max-w-[95%] flex flex-col items-center border border-white/10">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-indigo-600 mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary/20">
                        {name?.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-white text-2xl font-bold mb-1">{name}</h2>
                    <p className="text-primary font-medium animate-pulse">
                        {receivingCall && !callAccepted ? 'Incoming Call...' : (isCalling && !callAccepted ? 'Calling...' : 'In Call')}
                    </p>
                </div>

                {/* Video Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-[400px] mb-8">
                    {/* My Video */}
                    <div className="bg-gray-800 rounded-2xl overflow-hidden relative border border-white/5 ring-1 ring-white/10 shadow-inner">
                        <video playsInline muted ref={myVideo} autoPlay className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`} />
                        {isVideoOff && (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900/50">
                                <VideoOff size={48} className="mb-2 opacity-20" />
                                <span className="text-xs font-black uppercase tracking-widest opacity-40">Camera Off</span>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-wider bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            You {isAudioMuted && '(Muted)'}
                        </div>
                    </div>

                    {/* User Video */}
                    <div className="bg-gray-800 rounded-2xl overflow-hidden relative border border-white/5 ring-1 ring-white/10 shadow-inner">
                        {callAccepted && !callEnded ? (
                            <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900/50">
                                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                                    <Video size={32} className="opacity-20" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest opacity-40">
                                    {isCalling ? 'Waiting for answer...' : 'Connecting...'}
                                </span>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-wider bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                            Remote
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                    {receivingCall && !callAccepted ? (
                        <>
                            <button
                                onClick={answerCall}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl shadow-emerald-500/20 active:scale-95 group"
                            >
                                <Phone size={28} className="group-hover:rotate-12 transition-transform" />
                            </button>
                            <button
                                onClick={leaveCall}
                                className="bg-red-500 hover:bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl shadow-red-500/20 active:scale-95 group"
                            >
                                <X size={28} className="group-hover:rotate-90 transition-transform" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={toggleAudio}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border ${isAudioMuted ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
                            >
                                {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
                            </button>

                            <button
                                onClick={leaveCall}
                                className="bg-red-500 hover:bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl shadow-red-500/20 active:scale-95 group"
                            >
                                <Phone size={28} className="rotate-[135deg] group-hover:rotate-[150deg] transition-transform" />
                            </button>

                            <button
                                onClick={toggleVideo}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border ${isVideoOff ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
                            >
                                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                            </button>
                        </>
                    )}
                </div>

                {callEnded && (
                    <div className="mt-8 px-6 py-2 bg-red-500/20 text-red-400 rounded-full text-xs font-black uppercase tracking-widest border border-red-500/20">
                        Call Ended
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallModal;
