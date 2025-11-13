import React, {useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {changeUserRole, createAdminAccount} from '../lib/api';
import '../../styles/adminManagement.css';
import {Link} from 'react-router-dom';

const AdminManagement: React.FC = () => {
  const [targetUsername, setTargetUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>('user');
  const [roleError, setRoleError] = useState('');
  const [roleSuccess, setRoleSuccess] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const changeRoleMutation = useMutation({
    mutationFn: () => changeUserRole(targetUsername.trim(), selectedRole),
    onSuccess: () => {
      setRoleSuccess(`User role updated successfully to ${selectedRole}`);
      setRoleError('');
      setTargetUsername('');
    },
    onError: (error: any) => {
      setRoleError(error?.message || 'Failed to change user role');
      setRoleSuccess('');
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: () => createAdminAccount({username: newUsername.trim(), email: newEmail.trim()}),
    onSuccess: () => {
      setCreateSuccess('Admin account created successfully. Password reset email sent.');
      setCreateError('');
      setNewUsername('');
      setNewEmail('');
    },
    onError: (error: any) => {
      setCreateError(error?.message || 'Failed to create admin account');
      setCreateSuccess('');
    },
  });

  const handleChangeRole = e => {
    e.preventDefault();
    setRoleError('');
    setRoleSuccess('');
    if (!targetUsername.trim()) {
      setRoleError('Please enter a username');
      return;
    }
    changeRoleMutation.mutate();
  };

  const handleCreateAdmin = e => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    if (!newUsername.trim() || !newEmail.trim()) {
      setCreateError('Please fill in all fields');
      return;
    }
    createAdminMutation.mutate();
  };

  return (
    <div className="settings-wrapper">
      <div className="settings-container">
        <Link to="/" className="back-link">
          <span className="back-arrow" />
          <span>Back to Home</span>
        </Link>

        <div className="settings-header">
          <h1 className="settings-title">Admin Management</h1>
          <p className="settings-subtitle">Manage user roles and create admin accounts</p>
        </div>

        <div className="settings-form">
          <section className="settings-section">
            <h2 className="section-title">Change User Role</h2>
            <p className="section-description">Modify the role of an existing user account</p>

            {roleError && <div className="error-message">{roleError}</div>}
            {roleSuccess && <div className="success-message">{roleSuccess}</div>}

            <div className="form-group">
              <label htmlFor="targetUsername">Username</label>
              <input
                id="targetUsername"
                type="text"
                className="form-input"
                placeholder="Enter username"
                value={targetUsername}
                onChange={e => setTargetUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">New Role</label>
              <select
                id="role"
                className="form-input"
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as 'user' | 'admin')}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="button"
              className="save-button"
              disabled={changeRoleMutation.isPending}
              onClick={handleChangeRole}
            >
              {changeRoleMutation.isPending ? 'Updating...' : 'Change Role'}
            </button>
          </section>

          <section className="settings-section">
            <h2 className="section-title">Create Admin Account</h2>
            <p className="section-description">
              Create a new admin account. A password reset email will be sent.
            </p>

            {createError && <div className="error-message">{createError}</div>}
            {createSuccess && <div className="success-message">{createSuccess}</div>}

            <div className="form-group">
              <label htmlFor="newUsername">Username</label>
              <input
                id="newUsername"
                type="text"
                className="form-input"
                placeholder="Enter username"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newEmail">Email</label>
              <input
                id="newEmail"
                type="email"
                className="form-input"
                placeholder="Enter email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="save-button"
              disabled={createAdminMutation.isPending}
              onClick={handleCreateAdmin}
            >
              {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
