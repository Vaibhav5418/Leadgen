import API from '../api/axios';

const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

export function validatePasswordReset(formData) {
  if (!formData.email.trim()) return 'Email address is required';
  if (!EMAIL_PATTERN.test(formData.email.trim())) return 'Please enter a valid email address';
  if (!formData.newPassword.trim()) return 'New password is required';
  if (formData.newPassword.length < 6) return 'Password must be at least 6 characters long';
  if (formData.newPassword !== formData.confirmPassword) return 'Passwords do not match';
  return '';
}

export function resetPassword(email, newPassword) {
  return API.post('/auth/reset-password', {
    email: email.trim(),
    newPassword: newPassword.trim()
  });
}

export function getPasswordResetError(error) {
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
    return 'Cannot connect to server. Please make sure the backend server is running.';
  }
  return error.response?.data?.error || error.message || 'Failed to reset password';
}
