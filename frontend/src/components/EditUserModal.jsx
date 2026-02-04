import { useState, useEffect } from 'react';
import { X, Save, User, Briefcase, Building, Mail } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const EditUserModal = ({ user, onClose, onSuccess, allUsers }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: '',
        department: '',
        managerId: '',
        dateOfBirth: ''
    });

    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                role: user.role || 'TEAM_MEMBER',
                department: user.department || '',
                managerId: user.manager?.id || user.managerId || '',
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
            });
        }
    }, [user]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Filter out empty strings if necessary or send as is (backend handles optional)
            const payload = { ...formData };
            if (!payload.managerId) payload.managerId = null; // Send null to clear

            await api.put(`users/${user.id}`, payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to update user', error);
            alert(error.response?.data?.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    // Filter potential managers: exclude self and maybe lower roles if strict hierarchy (but let's keep it open for now)
    const potentialManagers = allUsers.filter(u => u.id !== user.id && (u.role === 'ADMIN' || u.role === 'MANAGER'));

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Edit Profile</h2>
                        <p className="text-sm text-gray-500 font-medium">Update team member details</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    required
                                    className="input-field pl-12"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="input-field pl-12"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Role</label>
                                <select
                                    disabled={currentUser?.role !== 'ADMIN'}
                                    className={`input-field ${currentUser?.role !== 'ADMIN' ? 'bg-gray-50 cursor-not-allowed opacity-70' : ''}`}
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="TEAM_MEMBER">Team Member</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="CUSTOMER">Customer</option>
                                </select>
                                {currentUser?.role !== 'ADMIN' && (
                                    <p className="text-[9px] text-gray-400 mt-1 italic">* Only Admins can change roles</p>
                                )}
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Department</label>
                                <div className="relative">
                                    <Building className="absolute left-4 top-3.5 text-gray-400" size={16} />
                                    <input
                                        className="input-field pl-10"
                                        placeholder="e.g. Engineering"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        list="departments"
                                    />
                                    <datalist id="departments">
                                        <option value="Engineering" />
                                        <option value="Design" />
                                        <option value="Product" />
                                        <option value="Marketing" />
                                        <option value="Sales" />
                                        <option value="HR" />
                                    </datalist>
                                </div>
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
                                    <option value="">No Manager (Independent)</option>
                                    {potentialManagers.map(m => (
                                        <option key={m.id} value={m.id}>{m.fullName} ({m.department || 'General'})</option>
                                    ))}
                                </select>
                                {currentUser?.role !== 'ADMIN' && (
                                    <p className="text-[9px] text-gray-400 mt-1 italic">* Only Admins can reassign managers</p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Date of Birth</label>
                            <input
                                type="date"
                                className="input-field"
                                value={formData.dateOfBirth}
                                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            />
                        </div>

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                        {loading ? 'Saving...' : <><Save size={18} /> Update Profile</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
