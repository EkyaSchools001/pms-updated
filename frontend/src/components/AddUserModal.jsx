import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Save, User, Briefcase, Building, Mail, Lock, Calendar } from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';

const AddUserModal = ({ onClose, onSuccess, allUsers }) => {
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'TEAM_MEMBER',
        department: '',
        managerId: '',
        dateOfBirth: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = { ...formData };
            if (!payload.managerId) payload.managerId = null;

            await api.post('users', payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create user', error);
            setError(error.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const potentialManagers = allUsers.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER');

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Add Team Member</h2>
                        <p className="text-sm text-gray-500 font-medium">Create a new user profile</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    required
                                    className="input-field pl-12"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="input-field pl-12"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Initial Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="input-field pl-12"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Role</label>
                            <select
                                className="input-field"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="TEAM_MEMBER">Team Member</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ADMIN">Admin</option>
                                <option value="CUSTOMER">Customer</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Department</label>
                            <input
                                className="input-field"
                                placeholder="e.g. Sales"
                                value={formData.department}
                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                            />
                        </div>

                        <div className={formData.role === 'CUSTOMER' ? 'col-span-2' : ''}>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Date of Birth</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-3.5 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    className="input-field pl-12"
                                    value={formData.dateOfBirth}
                                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                />
                            </div>
                        </div>

                        {formData.role !== 'CUSTOMER' && (
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Reporting Manager</label>
                                <select
                                    disabled={currentUser?.role !== 'ADMIN'}
                                    className={clsx(
                                        "input-field",
                                        currentUser?.role !== 'ADMIN' && "bg-gray-50 cursor-not-allowed opacity-70"
                                    )}
                                    value={formData.managerId}
                                    onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                                >
                                    <option value="">No Manager</option>
                                    {potentialManagers.map(m => (
                                        <option key={m.id} value={m.id}>{m.fullName}</option>
                                    ))}
                                </select>
                                {currentUser?.role !== 'ADMIN' && (
                                    <p className="text-[9px] text-gray-400 mt-1 italic">* Only Admins can assign managers</p>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs mt-4"
                    >
                        {loading ? 'Creating...' : <><Save size={18} /> Create User Account</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
