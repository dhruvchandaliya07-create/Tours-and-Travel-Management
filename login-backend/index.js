// backend/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Using your provided database connection string
mongoose.connect("mongodb+srv://Dhruv_Jain:dhruvjain07@cluster0.lhfmild.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => {
        console.log("MongoDB connected");
        app.listen(5000, () => {
            console.log("Server running on http://localhost:5000");
        });
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });

// --- MODELS ---
const UserSchema = new mongoose.Schema({ email: String, password: String });
const User = mongoose.model("User", UserSchema);

const TourSchema = new mongoose.Schema({ name: String, description: String, price: Number, duration: String, imageUrl: String });
const Tour = mongoose.model("Tour", TourSchema);

const BookingSchema = new mongoose.Schema({
    tourName: String, tourId: String, name: String, age: Number,
    mobile: String, email: String, numberOfPeople: Number, paymentMethod: String,
    bookingDate: { type: Date, default: Date.now }
});
const Booking = mongoose.model("Booking", BookingSchema);

// --- API ROUTES ---
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) {
        res.send({ message: "Login successful!" });
    } else {
        res.status(401).send({ message: "Invalid credentials" });
    }
});

app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).send({ message: "User already exists" });
    }
    const newUser = new User({ email, password });
    await newUser.save();
    res.send({ message: "Registration successful!" });
});

app.get("/api/tours", async (req, res) => {
    const tours = await Tour.find({});
    res.json(tours);
});

app.get("/api/tours/:id", async (req, res) => {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
        return res.status(404).send({ message: "Tour not found" });
    }
    res.json(tour);
});

app.post("/api/book-tour", async (req, res) => {
    try {
        const newBooking = new Booking(req.body);
        await newBooking.save();
        res.status(201).send({ message: "We will contact you shortly." });
    } catch (error) {
        res.status(500).send({ message: "Server error. Please try again." });
    }
});

app.get("/api/all-bookings", async (req, res) => {
    try {
        const bookings = await Booking.find({}).sort({ bookingDate: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch bookings." });
    }
});

// NEW: ADD THIS ROUTE TO DELETE A BOOKING
app.delete("/api/bookings/:id", async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).send({ message: "Booking not found." });
        }
        res.send({ message: "Booking deleted successfully." });
    } catch (error) {
        res.status(500).send({ message: "Server error. Could not delete booking." });
    }
});

app.get("/api/admin/stats", async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalBookings = await Booking.countDocuments();
        res.json({
            totalUsers: totalUsers,
            totalBookings: totalBookings,
        });
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch stats." });
    }
});

// The Seeder Route (Updated with verified Indian Tour images)
app.get("/api/seed", async (req, res) => {
  try {
    // This deletes all old tours before adding the new list
    await Tour.deleteMany({});

    // The new array now contains 6 Indian tours
    const sampleTours = [
      {
        name: "Golden Triangle Journey",
        description: "Discover the icons of India. This classic tour covers the vibrant capital Delhi, the magnificent Taj Mahal in Agra, and the historic Pink City of Jaipur.",
        price: 45000,
        duration: "7 Days / 6 Nights",
        imageUrl: "https://www.royalindiatours.com/tour_more_images/agra_1710304291.webp"
      },
      {
        name: "Kerala Backwaters Escape",
        description: "Relax and unwind on a traditional houseboat as you cruise through the serene backwaters of Alleppey. Experience lush landscapes and authentic local cuisine.",
        price: 35000,
        duration: "5 Days / 4 Nights",
        imageUrl: "https://media2.thrillophilia.com/images/photos/000/145/214/original/1550142212_houseboat4.png?w=753&h=450&dpr=1.5"
      },
      {
        name: "Himalayan Adventure in Ladakh",
        description: "Journey to the 'Land of High Passes'. Witness breathtaking mountain scenery, visit ancient monasteries, and drive through the stunning Nubra Valley.",
        price: 60000,
        duration: "8 Days / 7 Nights",
        imageUrl: "https://mysterioushimachal.wordpress.com/wp-content/uploads/2024/09/ladakh-bike-tour-package-banner.jpg"
      },
      {
        name: "Royal Rajasthan Expedition",
        description: "Explore the majestic forts and opulent palaces of Rajasthan. This tour takes you through the blue city of Jodhpur and the romantic lake city of Udaipur.",
        price: 55000,
        duration: "7 Days / 6 Nights",
        imageUrl: "https://cdn.kimkim.com/files/a/images/ff5478e8187d22713965a9294eb1df9fb7fcbc22/original-8575b02337523bb26c3593a62313bd75.jpg"
      },
      {
        name: "Vibrant Gujarat Heritage",
        description: "Explore the rich culture of Gujarat, from the white desert of the Rann of Kutch to the Asiatic lions of Gir National Park and the historic city of Ahmedabad.",
        price: 48000,
        duration: "6 Days / 5 Nights",
        imageUrl: "https://www.godigit.com/content/dam/godigit/directportal/en/contenthm/champaner-pavagadh-archaeological-park.jpg"
      },
      {
        name: "Blissful Goa Getaway",
        description: "Relax on the sun-kissed beaches of Goa. Enjoy the vibrant nightlife, Portuguese architecture, and delicious seafood this coastal paradise has to offer.",
        price: 30000,
        duration: "4 Days / 3 Nights",
        imageUrl: "https://avathioutdoors.gumlet.io/live/cover_13499.jpg?q=70&upscale=true"
      }
    ];

    await Tour.insertMany(sampleTours);
    res.send({ message: "Database seeded successfully with 6 Indian tours!" });
  } catch (error) {
    res.status(500).send({ message: "Error seeding database", error: error.message });
  }
});