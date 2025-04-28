import React, { useState } from "react";
export default function TestForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form onSubmit={e => { e.preventDefault(); console.log("STANDALONE FORM SUBMIT"); }}>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" />
      <button type="submit">Test Submit</button>
    </form>
  );
}