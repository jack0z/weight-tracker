// pages/index.js
import { useEffect, useState } from 'react';

const Home = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/.netlify/functions/mongodb');
      const result = await response.json();
      setData(result);
    };
    
    fetchData();
  }, []);

  return (
    <div>
      <h1>Weight Tracker</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default Home;
