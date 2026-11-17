import { useState, useEffect, useRef } from 'react';
import { loginUser, registerUser, fetchDemoUsers } from '../services/api.js';
import {
  ShieldCheck,
  Upload,
  IdCard,
  Mail,
  Lock,
  User,
  GraduationCap,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  X
} from 'lucide-react';



const COMMON_SKILLS = [
  'Canva',
  'Photoshop',
  'Python',
  'React',
  'PPT Design',
  'Notes Sharing',
  'Video Editing',
  'Event Help',
  'C++',
  'Photography'
];

const CAMPUS_LOCATIONS = [
  { name: 'Galgotias Campus', lat: 28.3664, lon: 77.5404 },
  { name: 'Tech Park (Block A)', lat: 28.3680, lon: 77.5410 },
  { name: 'Hostel Block B (Boys)', lat: 28.3650, lon: 77.5390 },
  { name: 'Hostel Block C (Girls)', lat: 28.3645, lon: 77.5415 },
  { name: 'Central Library', lat: 28.3672, lon: 77.5400 },
  { name: 'Sports Complex & Canteen', lat: 28.3690, lon: 77.5430 },
  { name: 'Gaur Yamuna City', lat: 28.3496, lon: 77.5312 },
  { name: 'Knowledge Park 3', lat: 28.4682, lon: 77.4921 },
];

export function AuthScreen({ onAuthSuccess }) {
  const [tab, setTab] = useState('login');
  const [demoUsers, setDemoUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regCollege, setRegCollege] = useState('Galgotias University (GU)');
  const [regCourse, setRegCourse] = useState('B.Tech CSE');
  const [regYear, setRegYear] = useState('2nd Year');
  const [regDepartment, setRegDepartment] = useState('Computer Science & Engineering');
  const [selectedLocation, setSelectedLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [regBio, setRegBio] = useState('');
  const [selectedSkills, setSelectedSkills] = useState(['Canva', 'PPT Design']);

  // ID Card file state
  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Load demo users for rapid testing
  useEffect(() => {
    fetchDemoUsers()
      .then(setDemoUsers)
      .catch(console.error);
  }, []);

  const handleFileChange = (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('ID Card image must be under 5 MB');
      return;
    }

    setIdCardFile(file);
    setErrorMessage(null);

    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setIdCardPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setIdCardPreview(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await loginUser({ email: loginEmail, password: loginPassword });
      onAuthSuccess(res.user);
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (user) => {
    setLoginEmail(user.email);
    setLoginPassword('password123');
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await loginUser({ email: user.email, password: 'password123' });
      onAuthSuccess(res.user);
    } catch (err) {
      setErrorMessage(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regStudentId.trim()) {
      setErrorMessage('Please fill in all mandatory fields');
      return;
    }

    if (!idCardFile) {
      setErrorMessage('Please upload your College ID Card for verification');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', regName.trim());
      formData.append('email', regEmail.trim());
      formData.append('password', regPassword);
      formData.append('student_id', regStudentId.trim());
      formData.append('college', regCollege);
      formData.append('course', regCourse);
      formData.append('year', regYear);
      formData.append('department', regDepartment);
      formData.append('location_name', selectedLocation.name);
      formData.append('latitude', selectedLocation.lat.toString());
      formData.append('longitude', selectedLocation.lon.toString());
      formData.append('bio', regBio.trim());
      formData.append('skills', JSON.stringify(selectedSkills));
      formData.append('id_card', idCardFile);

      const res = await registerUser(formData);
      setSuccessMessage('Registration successful! ID submitted for verification.');
      setTimeout(() => {
        onAuthSuccess(res.user);
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create student account');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Verification Protocol • 100% Student Only</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
            Gully Gigs 🎓⚡
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Hyper-Local Campus Micro-Gig Network
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl mb-6 border border-slate-700/60">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In to Campus
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            New Student Register & Verify
          </button>
        </div>

        {/* Error / Success Feedback Banners */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ---------------- LOGIN FORM ---------------- */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Campus Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.cse@campus.edu"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enter Campus Workspace</span>
                </>
              )}
            </button>

            {/* Quick Demo Accounts for College Review / Teacher Testing */}
            {demoUsers.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Evaluator / Demo Logins
                  </span>
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    password123
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demoUsers.slice(0, 4).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickDemoLogin(u)}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
                    >
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-700 group-hover:border-indigo-400"
                      />
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {u.course} • {u.department?.split(' ')[0]}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}

        {/* ---------------- REGISTER FORM ---------------- */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Step 1: Core Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Devdutta Nath"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Student Roll / ID No. *
                </label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 22SCSE101099"
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  College Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="dev@campus.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password (Min 6 chars) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Course
                </label>
                <select
                  value={regCourse}
                  onChange={(e) => setRegCourse(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="B.Tech CSE">B.Tech CSE</option>
                  <option value="B.Tech IT">B.Tech IT</option>
                  <option value="B.Tech Mechanical">B.Tech Mechanical</option>
                  <option value="B.Tech ECE">B.Tech ECE</option>
                  <option value="BCA / MCA">BCA / MCA</option>
                  <option value="B.Des UI/UX">B.Des UI/UX</option>
                  <option value="MBA / BBA">MBA / BBA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Year
                </label>
                <select
                  value={regYear}
                  onChange={(e) => setRegYear(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Campus Base Location
                </label>
                <select
                  value={selectedLocation.name}
                  onChange={(e) => {
                    const loc = CAMPUS_LOCATIONS.find(l => l.name === e.target.value) || CAMPUS_LOCATIONS[0];
                    setSelectedLocation(loc);
                  }}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* College, Department & Bio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  College / University
                </label>
                <input
                  type="text"
                  value={regCollege}
                  onChange={(e) => setRegCollege(e.target.value)}
                  placeholder="Galgotias University (GU)"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-3 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  placeholder="Computer Science & Engineering"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-3 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Short Bio / Headline (Optional)
              </label>
              <input
                type="text"
                value={regBio}
                onChange={(e) => setRegBio(e.target.value)}
                placeholder="e.g. 3rd year coder • Quick Canva & Python turnaround"
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-3 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            {/* MANDATORY ID CARD UPLOAD */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <IdCard className="w-4 h-4 text-amber-400" />
                  <span>College ID Card Upload (Mandatory for Campus Verification) *</span>
                </label>
                <span className="text-[10px] text-slate-400">Max 5MB (JPG, PNG, PDF)</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />

              {!idCardFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-5 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-900/60 group"
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    Click to browse or drop your student ID photo
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Ensures only registered college students can access campus gigs
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-950/80 border border-emerald-500/40 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {idCardPreview ? (
                      <img
                        src={idCardPreview}
                        alt="ID Preview"
                        className="w-12 h-12 object-cover rounded-xl border border-slate-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready for Verification</span>
                      </div>
                      <div className="text-[11px] text-slate-300 truncate max-w-[200px]">
                        {idCardFile.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {(idCardFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIdCardFile(null);
                      setIdCardPreview(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Skills selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Skills (Used by Matching Algorithm)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                      }`}
                    >
                      {skill} {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  <span>Create Account & Submit ID for Verification</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center text-xs text-slate-500">
        Strictly zero third-party spam • Powered by Gully Gigs Campus Engine
      </div>
    </div>
  );
}
