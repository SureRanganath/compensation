import React, { useState } from 'react';
import { changePassword } from '../utils/api';

/**
 * ChangePasswordModal — Allows the authenticated user to change their password
 * Requires old password verification, then new password with confirmation.
 */
export default function ChangePasswordModal({ onClose, onPasswordChanged }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const validate = () => {
    if (!form.currentPassword) return 'Current password is required';
    if (!form.newPassword) return 'New password is required';
    if (form.newPassword.length < 6) return 'New password must be at least 6 characters';
    if (form.newPassword.length > 128) return 'New password must be at most 128 characters';
    if (form.newPassword === form.currentPassword) return 'New password must be different from current password';
    if (!form.confirmPassword) return 'Please confirm your new password';
    if (form.newPassword !== form.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const validationError = validate();
    if (validationError) return setError(validationError);

    setLoading(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      if (onPasswordChanged) onPasswordChanged();
      // Close modal after brief success display
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [touched, setTouched] = useState({});
  const inputClass = (field) =>
    `w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm text-slate-900 font-medium outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 ${
      touched[field] && !form[field] ? 'border-red-300 bg-red-50' : 'border-slate-300'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
                <p className="text-xs text-slate-500">Update your account password</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {success ? (
          <div className="px-6 pb-6">
            <div className="p-6 rounded-xl bg-green-50 border border-green-200 text-center">
              <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-green-800 mb-1">Password Updated</h3>
              <p className="text-sm text-green-600">Your password has been changed successfully.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-6">
            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 font-medium flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-3">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={form.currentPassword}
                    onChange={e => { update('currentPassword', e.target.value); setTouched(t => ({...t, currentPassword: true})); }}
                    placeholder="Enter current password"
                    className={inputClass('currentPassword')}
                    autoComplete="current-password"
                    autoFocus
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                    aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {showCurrent ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={form.newPassword}
                    onChange={e => { update('newPassword', e.target.value); setTouched(t => ({...t, newPassword: true})); }}
                    placeholder="Enter new password (min 6 chars)"
                    className={inputClass('newPassword')}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                    aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {showNew ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      )}
                    </svg>
                  </button>
                </div>
                {/* Password strength hint */}
                <div className="mt-1.5 flex items-center gap-1">
                  {[1, 2, 3, 4].map(level => {
                    const len = form.newPassword.length;
                    const filled = level === 1 ? len >= 6 : level === 2 ? len >= 8 : level === 3 ? len >= 10 : len >= 12;
                    return (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${
                        form.newPassword ? (filled ? 'bg-green-500' : 'bg-slate-200') : 'bg-slate-100'
                      }`} />
                    );
                  })}
                  <span className="text-[10px] text-slate-400 ml-1 w-16">
                    {form.newPassword.length === 0 ? '' : form.newPassword.length < 6 ? 'Too short' : form.newPassword.length < 8 ? 'Weak' : form.newPassword.length < 10 ? 'Fair' : 'Strong'}
                  </span>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => { update('confirmPassword', e.target.value); setTouched(t => ({...t, confirmPassword: true})); }}
                    placeholder="Re-enter new password"
                    className={inputClass('confirmPassword')}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {showConfirm ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      )}
                    </svg>
                  </button>
                </div>
                {/* Match indicator */}
                {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                )}
                {form.confirmPassword && form.newPassword === form.confirmPassword && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Passwords match
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Update Password</span>
                  </>
                )}
              </button>
              <button type="button" onClick={onClose} disabled={loading}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition disabled:opacity-50">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
