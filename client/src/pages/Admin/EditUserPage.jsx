import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import UserForm from '../../components/admin/UserForm';
import EmptyState from '../../components/common/EmptyState';

export default function EditUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUserById, updateUser } = useUsers();

  const user = getUserById(id);

  if (!user) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="User Account Not Found"
          message={`No account matching identifier "${id}" exists in the directory.`}
          action={
            <Link to="/admin/users" className="btn-sm btn-primary">
              <ArrowLeft size={15} />
              <span>Back to Users</span>
            </Link>
          }
        />
      </div>
    );
  }

  const handleFormSubmit = (formData) => {
    updateUser(user.id, formData);
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
          <h2 className="form-page-title">Edit User — {user.name}</h2>
          <p className="form-page-subtitle">
            Update role assignments, departmental allocations, and account access status.
          </p>
        </div>
      </div>

      <UserForm initialData={user} onSubmit={handleFormSubmit} isEdit={true} />
    </div>
  );
}
