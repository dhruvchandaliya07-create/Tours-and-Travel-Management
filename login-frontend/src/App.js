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
  const [userEmail, setUserEmail] = useState(null);

  const login = (email) => {
    setIsAuthenticated(true);
    setUserEmail(email);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, login, logout }}>
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
      <h1>Welcome to Sky Line Tours and Travels!!</h1>
      <p>Your adventure starts here. Explore our exclusive tours.</p>
      <img src='https://www.theindiatourism.com/images/tourism-india.webp' alt='Image' width={1000} img/>
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

// ============== COMPONENT UPDATED ==============
function TourDetailPage() {
    const [tour, setTour] = useState(null);
    const { id } = useParams();
    const [showForm, setShowForm] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [formData, setFormData] = useState({ name: '', age: '', mobile: '', email: '', numberOfPeople: 1 });
    const [message, setMessage] = useState('');
    
    // NEW: State for the review form
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [reviewSubmitted, setReviewSubmitted] = useState(false);


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

    const handlePayment = async (method) => {
        try {
            const bookingDetails = { ...formData, tourId: id, tourName: tour.name, paymentMethod: method };
            const response = await axios.post("http://localhost:5000/api/book-tour", bookingDetails);
            setMessage("Booking Confirmed! " + response.data.message);
            setShowPayment(false);
            // NEW: Show the review form after successful booking
            setShowReviewForm(true); 
        } catch (error) {
            setMessage(error.response?.data?.message || "Booking failed.");
            setShowPayment(false);
        }
    };

    // NEW: Handler for submitting the review
    const handleReviewSubmit = (e) => {
        e.preventDefault();
        // In a real application, you would send this review to your backend.
        console.log("Review Submitted:", reviewText);
        setShowReviewForm(false); // Hide the review form
        setReviewSubmitted(true); // Show the thank you message
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
            
            {/* The "Book Now" button will now be hidden once the booking process starts */}
            {!showForm && !showPayment && !message && <button onClick={() => setShowForm(true)} style={{ marginTop: '1rem' }}>Book Now</button>}
            
            {message && !showReviewForm && <p style={{ marginTop: '1rem', fontWeight: 'bold', color: '#1abc9c' }}>{message}</p>}

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
                    <button onClick={() => handlePayment('Net Banking')}>Pay with Net Banking</button>
                    <button onClick={() => handlePayment('Credit Card')}>Pay with Credit Card</button>
                    <button onClick={() => handlePayment('UPI Apps')}>Pay with UPI Apps</button>
                    <button type="button" className="cancel-btn" onClick={() => setShowPayment(false)}>Cancel Payment</button>
                </div>
            )}

            {/* NEW: Review form section */}
            {showReviewForm && (
                <form onSubmit={handleReviewSubmit} className="booking-form">
                    <h3>Thank you for booking!</h3>
                    <p>We would love to hear your feedback.</p>
                    <textarea
                        rows="5"
                        placeholder="Write your review or expectations here..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        style={{ width: '100%', padding: '10px', marginTop: '10px', boxSizing: 'border-box' }}
                        required
                    />
                    <button type="submit" style={{marginTop: '10px'}}>Submit Review</button>
                </form>
            )}

            {/* NEW: Confirmation message after review is submitted */}
            {reviewSubmitted && (
                 <p style={{ marginTop: '1rem', fontWeight: 'bold', color: '#1abc9c' }}>
                    Thank you for your valuable feedback! We hope you have a wonderful trip.
                </p>
            )}
        </div>
    );
}
// ============== END OF UPDATE ==============


// src/App.js

// ... (keep all other components as they are)

function AdminDashboardPage() {
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, totalBookings: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const bookingsResponse = await axios.get("http://localhost:5000/api/all-bookings");
                const statsResponse = await axios.get("http://localhost:5000/api/admin/stats");
                
                setBookings(bookingsResponse.data);
                setStats(statsResponse.data);
            } catch (error) {
                console.error("Failed to fetch admin data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // NEW: Function to handle booking deletion
    const handleDeleteBooking = async (bookingId) => {
        // Confirm before deleting
        if (window.confirm("Are you sure you want to delete this booking permanently?")) {
            try {
                // Call the new DELETE endpoint on the backend
                await axios.delete(`http://localhost:5000/api/bookings/${bookingId}`);
                
                // Update the UI by removing the deleted booking from the state
                setBookings(bookings.filter(booking => booking._id !== bookingId));

                // Decrement the total bookings count in the stats card
                setStats(prevStats => ({
                    ...prevStats,
                    totalBookings: prevStats.totalBookings - 1
                }));

            } catch (error) {
                console.error("Failed to delete booking:", error);
                alert("Error: Could not delete the booking. Please try again.");
            }
        }
    };

    if (loading) return <h2>Loading admin data...</h2>;

    return (
        <div>
            <h2>Admin Dashboard</h2>
            <div className="stats-container">
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <p>{stats.totalUsers}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Bookings</h3>
                    <p>{stats.totalBookings}</p>
                </div>
            </div>

            <h3>All Customer Bookings</h3>
            <table className="bookings-table">
                <thead>
                    <tr>
                        <th>Tour Name</th>
                        <th>Customer Name</th>
                        <th>Mobile No.</th>
                        <th>Email</th>
                        <th># People</th>
                        <th>Payment Method</th>
                        <th>Actions</th> {/* NEW: Actions column header */}
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(booking => (
                        <tr key={booking._id}>
                            <td>{booking.tourName}</td>
                            <td>{booking.name}</td>
                            <td>{booking.mobile}</td>
                            <td>{booking.email}</td>
                            <td>{booking.numberOfPeople}</td>
                            <td>{booking.paymentMethod}</td>
                            {/* NEW: Cell with the Delete button */}
                            <td>
                                <button 
                                  onClick={() => handleDeleteBooking(booking._id)} 
                                  className="delete-button">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// 4. --- Main App Layout and Routing ---
function AppContent() {
  const { isAuthenticated, userEmail, logout } = useContext(AuthContext);
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
              {userEmail === 'owner@gmail.com' && (
                <li><Link to="/admin-dashboard">Admin Dashboard</Link></li>
              )}
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
          <Route path="/admin-dashboard" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
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
