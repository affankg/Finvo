import React from 'react';

function MinimalApp() {
  return (
    <div style={{
      padding: '40px',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{color: '#333'}}>BS Engineering - Login</h1>
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <form>
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px'}}>Username:</label>
            <input 
              type="text" 
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              placeholder="Enter username"
            />
          </div>
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px'}}>Password:</label>
            <input 
              type="password" 
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              placeholder="Enter password"
            />
          </div>
          <button 
            type="button"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => alert('Login clicked! Use admin/admin123')}
          >
            Login
          </button>
        </form>
        <p style={{marginTop: '15px', fontSize: '14px', color: '#666'}}>
          Demo: admin / admin123
        </p>
      </div>
    </div>
  );
}

export default MinimalApp;
