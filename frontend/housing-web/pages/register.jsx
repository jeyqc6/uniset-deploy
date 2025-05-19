import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../src/api";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // validate if password and confirm password match
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    const userData = {
      email,
      username,
      user_type: userType,
      password,
      confirm_password: confirmPassword,
    };

    try {
      // call register API, submit user data
      await registerUser(userData);

      // set success message
      setSuccessMessage("Registration successful! Redirecting to login...");

      // redirect to login page
      setTimeout(() => {
        navigate("/login");
      }, 1000); // delay 2 seconds to redirect
    } catch (error) {
      console.error("Backend error response:", error.response?.data);
      if (error.response && error.response.data) {
        const backendError = error.response.data.detail;
        if (Array.isArray(backendError)) {
          // if backend returns multiple errors, concatenate and display
          setErrorMessage(backendError.map((err) => err.msg).join(", "));
        } else if (typeof backendError === "string") {
          // if back end returns a string error
          setErrorMessage(backendError);
        } else {
          setErrorMessage("Registration failed. Please try again.");
        }
      } else {
        setErrorMessage("Registration failed. Please try again.");
      }
    }
  };


  const navigateToLogin = (e) => {
    e.preventDefault();
    navigate("/login"); // 跳转到登录页面
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <h2>Register</h2>
      </div>

      <div className="register-form">
        <form onSubmit={handleSubmit}>
          {/* Email input box */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Username input box */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Password input box */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm Password input box */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* user type selection */}
          <div className="form-group">
            <label>I am</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="userType"
                  value="tenant"
                  checked={userType === "tenant"}
                  onChange={(e) => setUserType(e.target.value)}
                />
                Tenant
              </label>
              <label>
                <input
                  type="radio"
                  name="userType"
                  value="landlord"
                  checked={userType === "landlord"}
                  onChange={(e) => setUserType(e.target.value)}
                />
                Landlord
              </label>
            </div>
          </div>


          {/* register button */}
          <button
            type="submit"
            className="register-button"
            disabled={!email || !password || !username || !confirmPassword}
          >
            Register
          </button>


        </form>

        {/* success or error message */}
        {successMessage && <p className="success-message">{successMessage}</p>}
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default RegisterPage;