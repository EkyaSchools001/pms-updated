import { useState, useEffect } from 'react';
import { Users, Mail, Briefcase, Calendar, Search, Filter, Building, ChevronRight, Edit2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EditUserModal from '../components/EditUserModal';
import AddUserModal from '../components/AddUserModal';


const TeamMembers = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('ALL');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);


    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showFilterDropdown && !event.target.closest('.filter-dropdown-container')) {
                setShowFilterDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showFilterDropdown]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [usersRes, projectsRes] = await Promise.all([
                api.get('users'),
                api.get('projects')
            ]);
            setUsers(usersRes.data);
            setProjects(projectsRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
            setError(error.response?.data?.message || 'Failed to load team members. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'MANAGER': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'EMPLOYEE': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'CUSTOMER': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const getUserProjects = (userId) => {
        return projects.filter(p => p.managerId === userId);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;

        return matchesSearch && matchesRole;
    });

    const roleStats = {
        ADMIN: users.filter(u => u.role === 'ADMIN').length,
        MANAGER: users.filter(u => u.role === 'MANAGER').length,
        EMPLOYEE: users.filter(u => u.role === 'EMPLOYEE').length,
        CUSTOMER: users.filter(u => u.role === 'CUSTOMER').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-100"></div>
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Team Members</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={fetchData}
                        className="btn btn-primary"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Grouping Logic
    const groupedUsers = filteredUsers.reduce((groups, user) => {
        if (user.role === 'CUSTOMER') {
            if (!groups['External / Customers']) groups['External / Customers'] = [];
            groups['External / Customers'].push(user);
        } else {
            const dept = user.department || 'General Staff';
            if (!groups[dept]) groups[dept] = [];
            groups[dept].push(user);
        }
        return groups;
    }, {});

    // Sort Departments so 'General Staff' or Unassigned is last if preferred, but alphabetical is fine.
    // Customers are handled separately or via group key.

    return (

        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-[var(--border-color)]">
                <div>
                    <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-2">Team Directory</h1>
                    <p className="text-[var(--text-secondary)] text-lg">Manage departments, hierarchy, and roles.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-[var(--text-secondary)] font-medium mr-2">Total: {users.length} members</span>
                    {currentUser?.role === 'ADMIN' && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <Users size={18} />
                            Add Member
                        </button>
                    )}
                </div>
            </div>

            {/* Role Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Admins', count: roleStats.ADMIN, icon: Users, color: 'purple' },
                    { label: 'Managers', count: roleStats.MANAGER, icon: Briefcase, color: 'blue' },
                    { label: 'Employees', count: roleStats.EMPLOYEE, icon: Users, color: 'emerald' },
                    { label: 'Customers', count: roleStats.CUSTOMER, icon: Users, color: 'amber' }
                ].map((stat, i) => (
                    <div key={i} className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)] font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.count}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)] shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-[var(--text-secondary)]" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email, department or manager..."
                        className="input-field pl-10 bg-[var(--bg-background)] border-transparent focus:bg-[var(--bg-card)] text-[var(--text-primary)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative filter-dropdown-container">
                    <button
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className={`btn ${selectedRole !== 'ALL' ? 'btn-primary' : 'btn-secondary'} relative`}
                    >
                        <Filter size={18} />
                        {selectedRole === 'ALL' ? 'All Roles' : selectedRole}
                    </button>
                    {showFilterDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] rounded-xl shadow-xl border border-[var(--border-color)] z-50 overflow-hidden">
                            <div className="p-2 space-y-1">
                                <p className="px-3 py-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Filter by Role</p>
                                {['ALL', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => { setSelectedRole(r); setShowFilterDropdown(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedRole === r ? 'bg-primary text-white' : 'text-[var(--text-primary)] hover:bg-[var(--bg-background)]'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium capitalize">{r === 'ALL' ? 'All Roles' : r.toLowerCase()}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Department Groups */}
            {Object.entries(groupedUsers).map(([dept, members]) => (
                <div key={dept} className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-[var(--border-color)]"></div>
                        <span className="px-4 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                            <Building size={14} />
                            {dept}
                            <span className="bg-[var(--bg-background)] text-[var(--text-primary)] px-1.5 rounded-full">{members.length}</span>
                        </span>
                        <div className="h-px flex-1 bg-[var(--border-color)]"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map(user => {
                            const userProjects = getUserProjects(user.id);
                            return (
                                <div key={user.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm hover:shadow-lg transition-all group overflow-hidden">
                                    <div className="bg-[var(--bg-card)] p-6 border-b border-[var(--border-color)]">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border-2 border-[var(--bg-background)] shadow-sm">
                                                    {user.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[var(--text-primary)] leading-tight">{user.fullName}</h3>
                                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleColor(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </div>
                                            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && (
                                                <button onClick={() => setEditingUser(user)} className="p-2 text-[var(--text-secondary)] hover:text-primary hover:bg-[var(--bg-background)] rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-1">
                                            <Mail size={14} />
                                            <span className="truncate">{user.email}</span>
                                        </div>
                                        {/* Manager Info */}
                                        {user.manager && (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-background)] p-2 rounded-lg">
                                                <span className="font-bold text-[var(--text-secondary)] uppercase tracking-wider">Reports to:</span>
                                                <span className="font-semibold text-[var(--text-primary)]">{user.manager.fullName}</span>
                                            </div>
                                        )}


                                        {user.dateOfBirth && (
                                            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)] pl-1">
                                                <Calendar size={12} className="text-primary" />
                                                <span className="font-medium text-[var(--text-secondary)]">Birthday: {new Date(user.dateOfBirth).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
                                            </div>
                                        )}

                                        {!user.manager && user.role !== 'CUSTOMER' && user.role !== 'ADMIN' && (
                                            <div className="mt-3 text-[10px] text-[var(--text-secondary)] italic pl-1 opacity-70">
                                                Direct Report / No Manager
                                            </div>
                                        )}
                                    </div>

                                    {user.role !== 'CUSTOMER' && (
                                        <div className="p-4 bg-[var(--bg-background)]">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Active Projects</span>
                                                <span className="text-xs font-bold text-primary">{userProjects.length}</span>
                                            </div>
                                            {userProjects.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {userProjects.slice(0, 3).map(p => (
                                                        <span key={p.id} className="text-[10px] px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded shadow-sm text-[var(--text-primary)] truncate max-w-[150px]">
                                                            {p.name}
                                                        </span>
                                                    ))}
                                                    {userProjects.length > 3 && <span className="text-[10px] text-[var(--text-secondary)] px-1">+{userProjects.length - 3}</span>}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-[var(--text-secondary)] italic opacity-70">No assigned projects</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {filteredUsers.length === 0 && (
                <div className="text-center py-20 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                    <Users size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No team members found</h3>
                </div>
            )}

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    allUsers={users}
                    onClose={() => setEditingUser(null)}
                    onSuccess={fetchData}
                />
            )}

            {showAddModal && (
                <AddUserModal
                    allUsers={users}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
};

export default TeamMembers;

