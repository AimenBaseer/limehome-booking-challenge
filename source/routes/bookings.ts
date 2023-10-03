import express from 'express';
import controller from '../controllers/bookings';
const router = express.Router();

router.get('/', controller.healthCheck);
router.get('/api/v1/booking/', controller.getBookings);
router.post('/api/v1/booking/', controller.createBooking);

export = router;
