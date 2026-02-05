import React, { useEffect, useState } from 'react';
import { Phone, Video, X, Mic, MicOff, VideoOff, Maximize2, Minimize2, PhoneOff } from 'lucide-react';
import clsx from 'clsx';

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
    isRinging,
    toggleAudio,
    toggleVideo
}) => {
    const [isMinimized, setIsMinimized] = useState(false);

    if (!receivingCall && !isCalling && !callAccepted) return null;

    return (
        <div className={clsx(
            "fixed z-[100] transition-all duration-500 ease-in-out font-sans",
            isMinimized
                ? "bottom-6 right-6 w-72 h-48 rounded-3xl shadow-2xl overflow-hidden border-2 border-primary/20 bg-gray-900"
                : "inset-0 bg-gray-950 flex flex-col items-center justify-center p-0 md:p-6"
        )}>
            {/* Background Blur Effect (only in fullscreen) */}
            {!isMinimized && (
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
                    <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]"></div>
                    <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-600/20 blur-[100px]"></div>
                </div>
            )}

            {/* Video Canvas Container */}
            <div className={clsx(
                "relative w-full h-full flex flex-col items-center justify-center z-10",
                !isMinimized && "max-w-6xl aspect-video md:rounded-[3rem] overflow-hidden bg-black shadow-2xl border border-white/5"
            )}>

                {/* Remote Video (Full Size) */}
                <div className="absolute inset-0 overflow-hidden bg-gray-900">
                    {callAccepted && !callEnded ? (
                        <video
                            playsInline
                            ref={userVideo}
                            autoPlay
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-950">
                            <div className="w-32 h-32 rounded-full bg-white/5 backdrop-blur-3xl flex items-center justify-center mb-6 ring-1 ring-white/10 animate-pulse">
                                <span className="text-5xl font-black text-white">{name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{name}</h2>
                            <p className="text-primary text-sm font-black uppercase tracking-[0.3em] animate-pulse">
                                {receivingCall && !callAccepted ? 'Incoming Call...' : (isRinging ? 'Ringing...' : 'Connecting...')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Local Video (Floating/PIP Style like WhatsApp) */}
                <div className={clsx(
                    "absolute transition-all duration-500 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-gray-800 z-30",
                    isMinimized
                        ? "hidden"
                        : "bottom-8 right-8 w-40 h-56 md:w-56 md:h-72 ring-1 ring-white/20"
                )}>
                    <video
                        playsInline
                        muted
                        ref={myVideo}
                        autoPlay
                        className={clsx("w-full h-full object-cover", isVideoOff && "hidden")}
                    />
                    {isVideoOff && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                            <VideoOff size={24} className="text-gray-600" />
                        </div>
                    )}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        You
                    </div>
                </div>

                {/* Controls Overlay (Always at bottom unless minimized) */}
                {!isMinimized && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-full px-6 flex flex-col items-center">
                        <div className="bg-black/20 backdrop-blur-2xl px-8 py-5 rounded-[2.5rem] border border-white/10 flex items-center gap-6 shadow-2xl">

                            {/* Toggle Audio */}
                            <button
                                onClick={toggleAudio}
                                className={clsx(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                                    isAudioMuted ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-white/10 text-white hover:bg-white/20"
                                )}
                            >
                                {isAudioMuted ? <MicOff size={22} /> : <Mic size={22} />}
                            </button>

                            {/* WhatsApp Style Accept or Reject (If receiving) */}
                            {receivingCall && !callAccepted ? (
                                <>
                                    <button
                                        onClick={answerCall}
                                        className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all animate-bounce"
                                    >
                                        <Phone size={30} />
                                    </button>
                                    <button
                                        onClick={leaveCall}
                                        className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/40 hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <X size={30} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Toggle Video */}
                                    <button
                                        onClick={toggleVideo}
                                        className={clsx(
                                            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                                            isVideoOff ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-white/10 text-white hover:bg-white/20"
                                        )}
                                    >
                                        {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                                    </button>

                                    {/* End Call */}
                                    <button
                                        onClick={leaveCall}
                                        className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/40 hover:scale-110 active:scale-95 transition-all rotate-[135deg]"
                                    >
                                        <PhoneOff size={30} />
                                    </button>
                                </>
                            )}

                        </div>
                    </div>
                )}

                {/* Top Corner Controls */}
                {!isMinimized && (
                    <div className="absolute top-8 right-8 z-40 flex gap-3">
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="p-3 bg-white/5 backdrop-blur-md rounded-2xl text-white hover:bg-white/10 transition-all border border-white/5"
                        >
                            <Minimize2 size={20} />
                        </button>
                    </div>
                )}

            </div>

            {/* Minimized View UI */}
            {isMinimized && (
                <div className="absolute inset-0 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                            {name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-white">
                            <p className="text-xs font-bold leading-none mb-1">{name}</p>
                            <p className="text-[10px] text-primary animate-pulse font-bold tracking-widest">ON CALL</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsMinimized(false)} className="p-2 bg-white/5 rounded-xl text-white"><Maximize2 size={16} /></button>
                        <button onClick={leaveCall} className="p-2 bg-red-500 rounded-xl text-white"><PhoneOff size={16} /></button>
                    </div>
                </div>
            )}

            {/* End Call Notification */}
            {callEnded && !isMinimized && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-red-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-red-500/40 animate-out fade-out zoom-out duration-1000">
                    Call Ended
                </div>
            )}
        </div>
    );
};

export default CallModal;
