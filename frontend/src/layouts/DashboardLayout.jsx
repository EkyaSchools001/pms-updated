import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Bell, LogOut, User, Mail, Briefcase, Edit2, ChevronDown, X, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import FloatingChatbot from '../components/FloatingChatbot';
import NotificationDropdown from '../components/NotificationDropdown';

// Get API base URL for images
// Get API base URL for images
// If VITE_API_URL is set, use it.
// If explicitly in production mode (import.meta.env.PROD), use relative path (empty string) so it uses current domain
// If in dev mode (localhost), use localhost:5000
const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : '');

// Helper to get full image URL
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    // Clean up base URL
    let baseUrl = API_URL;
    // Remove trailing slash if present
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    // Remove /api/v1 if present (case insensitive)
    if (baseUrl.toLowerCase().endsWith('/api/v1')) baseUrl = baseUrl.slice(0, -7);
    // Remove trailing slash again if present after removing api/v1
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
};



const DashboardLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [editFormData, setEditFormData] = useState({
        fullName: '',
        email: '',
        role: '',
        profilePicture: ''
    });
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const canEditProfile = () => {
        // Admin and Manager can edit all profiles
        // Employee and Customer can only edit their own profile
        return ['ADMIN', 'MANAGER'].includes(user?.role);
    };

    const handleEditProfile = () => {
        setShowProfileDropdown(false);

        // Check if user has permission to edit
        if (!canEditProfile() && user?.role !== 'TEAM_MEMBER' && user?.role !== 'CUSTOMER') {
            alert('You do not have permission to edit profiles.');
            return;
        }

        // Populate form with current user data
        setEditFormData({
            fullName: user?.fullName || '',
            email: user?.email || '',
            role: user?.role || '',
            profilePicture: user?.profilePicture || ''
        });
        setProfilePictureFile(null);
        setProfilePicturePreview(user?.profilePicture || '');
        setError('');
        setShowEditModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Image size should be less than 5MB');
                return;
            }
            setProfilePictureFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Validate form
            if (!editFormData.fullName.trim()) {
                setError('Full name is required');
                setIsSubmitting(false);
                return;
            }

            // Prepare update data
            const updateData = {
                fullName: editFormData.fullName.trim(),
            };

            // Handle Profile Picture Upload
            if (profilePictureFile) {
                const formData = new FormData();
                formData.append('profilePicture', profilePictureFile);

                try {
                    const uploadResponse = await api.post('users/profile-picture', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    // Update the profile picture URL in our update data
                    // Note: The upload endpoint updates the DB too, but we might want to ensure 
                    // consistent state or just use the returned URL
                    updateData.profilePicture = uploadResponse.data.user.profilePicture;

                } catch (uploadError) {
                    console.error('Failed to upload profile picture:', uploadError);
                    setError('Failed to upload profile picture. Please try again.');
                    setIsSubmitting(false);
                    return;
                }
            }

            // Only Admin and Manager can change roles and email
            if (canEditProfile()) {
                updateData.role = editFormData.role;
                if (!editFormData.email.trim()) {
                    setError('Email is required');
                    setIsSubmitting(false);
                    return;
                }
                updateData.email = editFormData.email.trim();
            }

            // Call API to update user profile (other fields)
            const response = await api.put(`users/${user.id}`, updateData);

            // Update local storage with new user data
            // We combine the upload response (if any) and the PUT response
            const updatedUser = {
                ...user,
                ...response.data,
                // Ensure profilePicture is current if we just uploaded it
                profilePicture: updateData.profilePicture || response.data.profilePicture || user.profilePicture
            };

            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Reload to reflect changes
            alert('Profile updated successfully!');
            setShowEditModal(false);
            window.location.reload();

        } catch (error) {
            console.error('Failed to update profile:', error);
            setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProfileDropdown && !event.target.closest('.profile-dropdown-container')) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileDropdown]);

    return (
        <div className="min-h-screen bg-[var(--bg-background)] flex font-sans text-[var(--text-primary)] transition-colors duration-300">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 lg:ml-72 relative min-w-0">
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-40 bg-[var(--bg-card)]/80 backdrop-blur-md border-b border-[var(--border-color)] px-4 sm:px-8 py-4 flex justify-between items-center transition-colors duration-300">

                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-[var(--text-secondary)]"
                        >
                            <Menu size={24} />
                        </button>
                        {/* Search removed as requested */}
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationDropdown />


                        <div className="h-8 w-px bg-gray-200 mx-1"></div>

                        {/* User Profile Dropdown */}
                        <div className="relative profile-dropdown-container">
                            <button
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center gap-3 px-3 py-2 bg-[var(--bg-background)] rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-card)] hover:border-primary/30 transition-colors cursor-pointer"
                            >

                                {user?.profilePicture && !imgError ? (
                                    <img
                                        src={`${getImageUrl(user.profilePicture)}?t=${new Date(user.updatedAt || Date.now()).getTime()}`}
                                        alt={user.fullName}
                                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                        {user?.fullName?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div className="hidden lg:block text-left">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{user?.fullName}</p>
                                    <p className="text-xs text-[var(--text-secondary)] capitalize">{user?.role?.toLowerCase()}</p>
                                </div>
                                <ChevronDown size={16} className={`text-[var(--text-secondary)] transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                            </button>


                            {/* Profile Dropdown Card */}
                            {showProfileDropdown && (
                                <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-color)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                                    {/* Header with gradient */}
                                    <div className="bg-gradient-to-r from-primary to-indigo-600 p-6 text-white">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                {user?.profilePicture ? (
                                                    <img
                                                        src={`${getImageUrl(user.profilePicture)}?t=${new Date(user.updatedAt || Date.now()).getTime()}`}
                                                        alt={user.fullName}
                                                        className="w-16 h-16 rounded-full object-cover border-4 border-white/30 backdrop-blur-sm"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                                                        {user?.fullName?.charAt(0) || 'U'}
                                                    </div>
                                                )}
                                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-indigo-600 rounded-full"></div>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold truncate">{user?.fullName || 'User Name'}</h3>
                                                <p className="text-sm text-white/80 capitalize">{user?.role?.toLowerCase() || 'Role'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profile Details */}
                                    <div className="p-6 space-y-4">
                                        {/* Email */}
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-[var(--bg-background)] rounded-lg">
                                                <Mail size={18} className="text-[var(--text-secondary)]" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-[var(--text-secondary)] font-medium mb-1">Email Address</p>
                                                <p className="text-sm text-[var(--text-primary)] font-medium">{user?.email || 'Not provided'}</p>
                                            </div>
                                        </div>

                                        {/* Role */}
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-[var(--bg-background)] rounded-lg">
                                                <Briefcase size={18} className="text-[var(--text-secondary)]" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-[var(--text-secondary)] font-medium mb-1">Role & Position</p>
                                                <p className="text-sm text-[var(--text-primary)] font-medium capitalize">{user?.role?.toLowerCase() || 'Not specified'}</p>
                                            </div>
                                        </div>

                                        {/* User ID */}
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-[var(--bg-background)] rounded-lg">
                                                <User size={18} className="text-[var(--text-secondary)]" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-[var(--text-secondary)] font-medium mb-1">User ID</p>
                                                <p className="text-sm text-[var(--text-primary)] font-mono">{user?.id || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {/* Edit Profile Button */}
                                        <button
                                            onClick={handleEditProfile}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30"
                                        >
                                            <Edit2 size={18} />
                                            Edit Profile
                                        </button>

                                        {/* Divider */}
                                        <div className="border-t border-gray-200 pt-4">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium border border-red-100 hover:border-red-200"
                                            >
                                                <LogOut size={18} />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-8 w-px bg-gray-200 mx-1"></div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-medium border border-red-100 hover:border-red-200"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
                    {children}
                </div>
            </main>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[var(--border-color)]">

                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-primary to-indigo-600 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Edit2 size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Edit Profile</h2>
                                    <p className="text-sm text-white/80">Update your account information</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmitEdit} className="p-6 space-y-5">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Profile Picture Upload */}
                            <div className="flex justify-center mb-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--bg-background)] shadow-lg">
                                        {profilePicturePreview ? (
                                            <img
                                                src={getImageUrl(profilePicturePreview)}
                                                alt="Profile Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[var(--bg-background)] flex items-center justify-center text-[var(--text-secondary)]">
                                                <User size={40} />
                                            </div>
                                        )}
                                    </div>
                                    <label htmlFor="profile-upload" className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary-hover shadow-md transition-all">
                                        <Edit2 size={14} />
                                        <input
                                            id="profile-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={editFormData.fullName}
                                    onChange={handleInputChange}
                                    className="input-field bg-[var(--bg-background)]"
                                    placeholder="Enter your full name"
                                    required

                                />
                            </div>

                            {/* Email - Read Only */}
                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editFormData.email}
                                    className="input-field bg-[var(--bg-background)] cursor-not-allowed text-[var(--text-secondary)] opacity-70"
                                    readOnly
                                    title="Email cannot be changed"
                                />
                                <p className="text-xs text-[var(--text-secondary)] mt-1">To change your email, please contact an administrator.</p>
                            </div>

                            {/* Role - Only editable by Admin and Manager */}
                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                                    Role
                                </label>
                                {canEditProfile() ? (
                                    <select
                                        name="role"
                                        value={editFormData.role}
                                        onChange={handleInputChange}
                                        className="input-field bg-[var(--bg-background)]"
                                    >

                                        <option value="ADMIN">Admin</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="TEAM_MEMBER">Team Member</option>
                                        <option value="CUSTOMER">Customer</option>
                                    </select>
                                ) : (
                                    <div className="input-field bg-[var(--bg-background)] cursor-not-allowed capitalize opacity-70">
                                        {editFormData.role?.toLowerCase()}
                                    </div>
                                )}
                                {!canEditProfile() && (
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                                        Only Admins and Managers can change roles
                                    </p>
                                )}
                            </div>

                            {/* Permission Notice */}
                            {!canEditProfile() && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <p className="text-sm text-amber-800">
                                        <strong>Note:</strong> You can only edit your name and email.
                                        Contact an Admin or Manager to change your role.
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 btn btn-secondary"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn btn-primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Floating Chatbot */}
            <FloatingChatbot />
        </div>

    );
};

export default DashboardLayout;
