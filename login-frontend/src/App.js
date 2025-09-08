// src/App.js
import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, Navigate } from "react-router-dom";
import axios from 'axios';
import './App.css';
import Login from './Login';
import Register from './Register';

// 1. --- Authentication Context ---
export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 2. --- Private Route Component ---
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// 3. --- Page Components ---
function HomePage() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Welcome to Your Dashboard!</h1>
      <p>Your adventure starts here. Explore our exclusive tours.</p>
    </div>
  );
}

function ToursPage() {
  const [tours, setTours] = useState([]);
  useEffect(() => {
    const fetchTours = async () => {
      const response = await axios.get("http://localhost:5000/api/tours");
      setTours(response.data);
    };
    fetchTours();
  }, []);

  return (
    <div>
      <h2>Our Tours</h2>
      <div className="tours-list">
        {tours.map(tour => (
          <div key={tour._id} className="tour-card">
            <img src={tour.imageUrl} alt={tour.name} />
            <h3>{tour.name}</h3>
            <p>₹{tour.price.toLocaleString('en-IN')}</p>
            <Link to={`/tours/${tour._id}`}><button>View Details</button></Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ✅ UPDATED TourDetailPage component with Payment Step
// ✅ UPDATED TourDetailPage component to save payment method
function TourDetailPage() {
    const [tour, setTour] = useState(null);
    const { id } = useParams();
    
    const [showForm, setShowForm] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [formData, setFormData] = useState({ name: '', age: '', mobile: '', email: '', numberOfPeople: 1 });
    const [message, setMessage] = useState('');

    useEffect(() => {
        setMessage('');
        const fetchTourDetails = async () => {
            const response = await axios.get(`http://localhost:5000/api/tours/${id}`);
            setTour(response.data);
        };
        fetchTourDetails();
    }, [id]);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setShowForm(false);
        setShowPayment(true);
    };

    // UPDATED: This function now accepts the chosen payment method
    const handlePayment = async (method) => {
        try {
            // Add the payment method to the data we send to the backend
            const bookingDetails = {
                ...formData,
                tourId: id,
                tourName: tour.name,
                paymentMethod: method // <-- ADD THIS LINE
            };
            const response = await axios.post("http://localhost:5000/api/book-tour", bookingDetails);
            
            setMessage("Booking Confirmed! " + response.data.message);
            setShowPayment(false);
        } catch (error) {
            setMessage(error.response?.data?.message || "Booking failed. Please try again.");
            setShowPayment(false);
        }
    };

    if (!tour) return <h2>Loading...</h2>;

    return (
        <div className="tour-detail-container">
            <img src={tour.imageUrl} alt={tour.name} />
            <h1>{tour.name}</h1>
            <div className="tour-detail-info">
                <span>Price: ₹{tour.price.toLocaleString('en-IN')}</span>
                <span>Duration: {tour.duration}</span>
            </div>
            <p>{tour.description}</p>
            
            {!showForm && !showPayment && <button onClick={() => setShowForm(true)} style={{ marginTop: '1rem' }}>Book Now</button>}
            
            {message && <p style={{ marginTop: '1rem', fontWeight: 'bold', color: '#1abc9c' }}>{message}</p>}

            {showForm && (
                <form onSubmit={handleFormSubmit} className="booking-form">
                    <h3>Booking Form for {tour.name}</h3>
                    <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} required />
                    <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleInputChange} required />
                    <input type="tel" name="mobile" placeholder="Mobile Number" value={formData.mobile} onChange={handleInputChange} required />
                    <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required />
                    <label htmlFor="numberOfPeople">Number of People:</label>
                    <input type="number" id="numberOfPeople" name="numberOfPeople" min="1" value={formData.numberOfPeople} onChange={handleInputChange} required />
                    <div className="form-buttons">
                        <button type="submit">Proceed to Payment</button>
                        <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                </form>
            )}

            {showPayment && (
                <div className="payment-options">
                    <h3>Choose a Payment Method</h3>
                    <p>Total Amount: ₹{(tour.price * formData.numberOfPeople).toLocaleString('en-IN')}</p>
                    {/* UPDATED: Buttons now pass the payment method to the handler */}
                    <button onClick={() => handlePayment('Net Banking')}>Pay with Net Banking</button>
                    <button onClick={() => handlePayment('Credit Card')}>Pay with Credit Card</button>
                    <button onClick={() => handlePayment('UPI Apps')}>Pay with UPI Apps</button>
                    <button type="button" className="cancel-btn" onClick={() => setShowPayment(false)}>Cancel Payment</button>
                </div>
            )}
        </div>
    );
}


// 4. --- Main App Layout and Routing ---
function AppContent() {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="App">
      <nav>
        <ul>
          {isAuthenticated && (
            <>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/tours">Tours</Link></li>
            </>
          )}
          {isAuthenticated ? (
            <li className="auth-links">
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </li>
          ) : (
            <>
              <li className="auth-links"><Link to="/login">Login</Link></li>
              <li className="auth-links"><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </nav>
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="/tours" element={<PrivateRoute><ToursPage /></PrivateRoute>} />
          <Route path="/tours/:id" element={<PrivateRoute><TourDetailPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

// 5. --- Final App Export ---
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;