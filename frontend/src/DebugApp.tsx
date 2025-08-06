const DebugApp = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Debug App - Testing</h1>
      <p>If you can see this, React is working fine!</p>
      <button onClick={() => alert('Button works!')}>Test Button</button>
    </div>
  );
};

export default DebugApp;
