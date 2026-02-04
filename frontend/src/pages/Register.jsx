import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, ArrowRight, User, Mail, Lock, Shield } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'TEAM_MEMBER'
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await register(formData);
        setIsLoading(false);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-3xl"></div>
            </div>

            <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white mb-6 shadow-lg shadow-primary/30">
                        <LayoutDashboard size={28} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h2>

                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-8 text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Full Name</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors">
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                required
                                className="input-field pl-12 py-3 bg-gray-50 focus:bg-white transition-all"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Email Address</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors">
                                <Mail size={20} />
                            </div>
                            <input
                                type="email"
                                required
                                className="input-field pl-12 py-3 bg-gray-50 focus:bg-white transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="you@company.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors">
                                <Lock size={20} />
                            </div>
                            <input
                                type="password"
                                required
                                className="input-field pl-12 py-3 bg-gray-50 focus:bg-white transition-all"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Account Role</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors">
                                <Shield size={20} />
                            </div>
                            <select
                                className="input-field pl-12 py-3 bg-gray-50 focus:bg-white transition-all appearance-none"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="TEAM_MEMBER">Team Member</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ADMIN">Admin</option>
                                <option value="CUSTOMER">Customer</option>
                            </select>
                            <div className="absolute right-4 top-4 text-gray-400 pointer-events-none">
                                <ArrowRight size={16} className="rotate-90" />
                            </div>
                        </div>
                    </div>


                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn btn-primary py-3.5 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all group mt-4"
                    >
                        {isLoading ? 'Creating account...' : 'Sign Up'}
                        {!isLoading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>

                <p className="mt-10 text-center text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary font-bold hover:text-indigo-700 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
