// Example fetch call in your frontend component
import { useEffect, useState } from 'react';

const FetchData = () => {
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
      <h1>MongoDB Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default FetchData;
