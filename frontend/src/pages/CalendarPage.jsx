import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import multiMonthPlugin from '@fullcalendar/multimonth';
import {
    Calendar as CalendarIcon,
    Plus,
    Filter,
    ChevronLeft,
    ChevronRight,
    Video,
    MapPin,
    Clock,
    X,
    Edit2,
    Trash2,
    Briefcase
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ScheduleMeetingModal from '../components/ScheduleMeetingModal';
import { useSearchParams } from 'react-router-dom';

const CalendarPage = () => {
    const { user } = useAuth();
    const calendarRef = useRef(null);
    const [view, setView] = useState('dayGridMonth');
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [calendarRange, setCalendarRange] = useState({ start: null, end: null });
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        checkGoogleStatus();
        handleGoogleCallback();
    }, []);

    const checkGoogleStatus = async () => {
        try {
            const response = await api.get('auth/google/status');
            setIsGoogleConnected(response.data.isConnected);
        } catch (error) {
            console.error('Failed to check Google status:', error);
        }
    };

    const handleGoogleCallback = async () => {
        const code = searchParams.get('code');
        if (code) {
            try {
                await api.post('auth/google/tokens', { code });
                setIsGoogleConnected(true);
                alert('Successfully connected to Google Calendar!');
                // Remove code from URL
                searchParams.delete('code');
                setSearchParams(searchParams);
            } catch (error) {
                console.error('Failed to exchange Google tokens:', error);
            }
        }
    };

    const handleConnectGoogle = async () => {
        try {
            const response = await api.get('auth/google');
            window.location.href = response.data.url;
        } catch (error) {
            alert('Failed to initiate Google connection');
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [calendarRange]);

    const fetchEvents = async () => {
        if (!calendarRange.start) return;
        try {
            const response = await api.get('calendar/events', {
                params: {
                    start: calendarRange.start,
                    end: calendarRange.end
                }
            });
            setEvents(response.data);
        } catch (error) {
            console.error('Failed to fetch calendar events:', error);
        }
    };

    const handleDatesSet = (dateInfo) => {
        setCalendarRange({
            start: dateInfo.startStr,
            end: dateInfo.endStr
        });
    };

    const handleDateSelect = (selectInfo) => {
        setSelectedEvent({ start: selectInfo.startStr });
        setShowScheduleModal(true);
    };

    const handleDeleteMeeting = async (meetingId) => {
        if (!window.confirm('Are you sure you want to cancel this meeting?')) return;
        try {
            await api.delete(`meetings/${meetingId}`);
            setShowEventModal(false);
            fetchEvents();
        } catch (error) {
            alert('Failed to cancel meeting: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleEditMeeting = () => {
        setShowEventModal(false);
        setShowScheduleModal(true);
    };

    const handleEventClick = (clickInfo) => {
        setSelectedEvent(clickInfo.event);
        setShowEventModal(true);
    };

    const handleEventDrop = async (dropInfo) => {
        const { event } = dropInfo;
        try {
            if (event.extendedProps.type === 'meeting') {
                await api.patch(`meetings/${event.id}`, {
                    startTime: event.startStr,
                    endTime: event.endStr
                });
            } else {
                await api.put(`tasks/${event.id}`, {
                    startDate: event.startStr,
                    dueDate: event.endStr
                });
            }
            alert(`Successfully rescheduled: ${event.title}`);
        } catch (error) {
            dropInfo.revert();
            alert('Failed to reschedule event. Permission denied or server error.');
        }
    };

    const changeView = (newView) => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(newView);
        setView(newView);
    };

    const next = () => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.next();
    };

    const prev = () => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.prev();
    };

    const today = () => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.today();
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Events & Planning</h1>
                    <p className="text-gray-500 text-sm">Organize meetings and visualize project timelines.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className={clsx(
                            "p-2.5 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium",
                            showFilterPanel ? "bg-primary/10 border-primary text-primary" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <Filter size={18} />
                        <span className="hidden sm:inline">Filters</span>
                    </button>

                    <button
                        onClick={handleConnectGoogle}
                        className={clsx(
                            "p-2.5 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium",
                            isGoogleConnected ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                        title={isGoogleConnected ? "Google Calendar Connected" : "Connect Google Calendar"}
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                        <span className="hidden lg:inline">{isGoogleConnected ? "Connected" : "Sync with Google"}</span>
                    </button>

                    <button
                        onClick={() => setShowScheduleModal(true)}
                        className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Schedule Meeting</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Main Calendar Area */}
                <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                    {/* Custom Calendar Toolbar */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                                <button onClick={prev} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
                                    <ChevronLeft size={18} />
                                </button>
                                <button onClick={today} className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-sm font-semibold text-gray-700">
                                    Today
                                </button>
                                <button onClick={next} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                            {[
                                { id: 'dayGridMonth', label: 'Month' },
                                { id: 'timeGridWeek', label: 'Week' },
                                { id: 'timeGridDay', label: 'Day' },
                                { id: 'listWeek', label: 'List' }
                            ].map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => changeView(v.id)}
                                    className={clsx(
                                        "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                                        view === v.id ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 p-6 overflow-auto calendar-container">
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, multiMonthPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={false}
                            events={events}
                            editable={true}
                            selectable={true}
                            selectMirror={true}
                            dayMaxEvents={true}
                            weekends={true}
                            height="100%"
                            datesSet={handleDatesSet}
                            select={handleDateSelect}
                            eventClick={handleEventClick}
                            eventDrop={handleEventDrop}
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                meridiem: 'short'
                            }}
                        />
                    </div>
                </div>

                {/* Right Side Panel - Upcoming */}
                <div className="w-80 flex flex-col gap-6 hidden xl:flex">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-primary" />
                            Upcoming Meetings
                        </h3>
                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {events.filter(e => e.extendedProps?.type === 'meeting').slice(0, 5).map(meeting => (
                                <div key={meeting.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary/30 transition-all group cursor-pointer" onClick={() => { setSelectedEvent(meeting); setShowEventModal(true); }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                                            {meeting.extendedProps.type}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(meeting.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-primary transition-colors">{meeting.title}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-1">{meeting.extendedProps.room || 'Online'}</p>
                                </div>
                            ))}
                            {events.filter(e => e.extendedProps?.type === 'meeting').length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-8">No meetings scheduled.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-primary/20">
                        <h3 className="font-bold mb-2">Meeting Rooms</h3>
                        <p className="text-white/80 text-sm mb-4">View real-time availability of conference rooms.</p>
                        <button
                            className="w-full py-2.5 bg-white/20 backdrop-blur-md rounded-xl text-sm font-semibold hover:bg-white/30 transition-all border border-white/20"
                            onClick={() => setShowScheduleModal(true)}
                        >
                            Book a Room
                        </button>
                    </div>
                </div>
            </div>

            {/* Event Detail Modal */}
            {showEventModal && selectedEvent && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="h-24 bg-gradient-to-r from-primary to-indigo-600 p-6 flex items-start justify-between">
                            <div className="p-2 bg-white/20 rounded-xl">
                                {selectedEvent.extendedProps?.type === 'task' ? <Briefcase size={24} className="text-white" /> : <Video size={24} className="text-white" />}
                            </div>
                            <button onClick={() => setShowEventModal(false)} className="p-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-8 pb-8 -mt-6">
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        selectedEvent.extendedProps?.type === 'task' ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                                    )}>
                                        {selectedEvent.extendedProps?.type}
                                    </span>
                                    <div className="flex gap-2">
                                        {(selectedEvent.extendedProps?.organizerId === user?.id || user?.role === 'ADMIN') && (
                                            <>
                                                <button
                                                    onClick={handleEditMeeting}
                                                    className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                                                    title="Edit Meeting"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMeeting(selectedEvent.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Cancel Meeting"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedEvent.title}</h2>
                                <p className="text-sm text-gray-500 mb-6">{selectedEvent.extendedProps?.description || 'No description provided.'}</p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Clock size={16} className="text-gray-400" />
                                        <span>
                                            {selectedEvent.allDay
                                                ? 'All Day'
                                                : `${new Date(selectedEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(selectedEvent.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                            }
                                        </span>
                                    </div>
                                    {selectedEvent.extendedProps?.room && (
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <MapPin size={16} className="text-gray-400" />
                                            <span>{selectedEvent.extendedProps.room}</span>
                                        </div>
                                    )}
                                    {selectedEvent.extendedProps?.isOnline && (
                                        <div className="flex items-center gap-3 text-sm text-primary font-medium">
                                            <Video size={16} />
                                            <a href={selectedEvent.extendedProps.meetingLink} target="_blank" rel="noreferrer" className="hover:underline">Join Meeting</a>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                        <div className="flex -space-x-2">
                                            {selectedEvent.extendedProps?.participants?.slice(0, 5).map((p, i) => (
                                                <div
                                                    key={p.userId}
                                                    className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm"
                                                    title={p.fullName}
                                                >
                                                    {p.fullName.charAt(0)}
                                                </div>
                                            ))}
                                            {selectedEvent.extendedProps?.participants?.length > 5 && (
                                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                                                    +{selectedEvent.extendedProps.participants.length - 5}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">
                                            {selectedEvent.extendedProps?.organizer ? `Organized by ${selectedEvent.extendedProps.organizer}` : 'PMS Generated'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ScheduleMeetingModal
                isOpen={showScheduleModal}
                onClose={() => {
                    setShowScheduleModal(false);
                    setSelectedEvent(null);
                }}
                onSuccess={fetchEvents}
                initialDate={selectedEvent?.start}
                meetingData={selectedEvent?.id ? selectedEvent : null}
            />
        </div>
    );
};

export default CalendarPage;
