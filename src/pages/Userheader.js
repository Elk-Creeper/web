import React from 'react';

function UserHeader({ user }) {
    return (
        <header className="user-header">
            <img src={user.profilePicture} alt={user.name} />
            <div className="user-info">
                <h2>{user.name}</h2>
                <p>{user.email}</p>
            </div>
        </header>
    );
}

export default UserHeader;
