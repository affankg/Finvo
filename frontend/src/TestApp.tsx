import React from 'react';

const TestApp = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333' }}>BS Engineering - Debug Mode</h1>
      <div style={{ 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        marginTop: '20px'
      }}>
        <h2>System Status</h2>
        <p>✅ React is working</p>
        <p>✅ Frontend server is running</p>
        <p>✅ Styling is working</p>
        
        <div style={{ marginTop: '20px' }}>
          <h3>Test Navigation</h3>
          <button 
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
            onClick={() => window.location.href = '/test-login'}
          >
            Go to Test Login
          </button>
          
          <button 
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => console.log('Button clicked!')}
          >
            Test Console
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestApp;
