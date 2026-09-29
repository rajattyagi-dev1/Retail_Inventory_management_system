import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import UserForm from '../../components/admin/UserForm';

export default function AddUserPage() {
  const navigate = useNavigate();
  const { addUser } = useUsers();

  const handleFormSubmit = (formData) => {
    addUser(formData);
    navigate('/admin/users');
  };

  return (
    <div className="product-module-page">
      <div className="form-header-bar">
        <div>
          <Link to="/admin/users" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Users</span>
          </Link>
          <h2 className="form-page-title">Create User Account</h2>
          <p className="form-page-subtitle">
            Provision new user access with role permissions and organizational unit assignment.
          </p>
        </div>
      </div>

      <UserForm onSubmit={handleFormSubmit} isEdit={false} />
    </div>
  );
}
