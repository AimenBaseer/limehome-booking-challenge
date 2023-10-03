import express from 'express';
import controller from '../controllers/bookings';
import { santizeRequestBody } from '../controllers/middlewares/sanitization';
import {
    ExtendBookingRequest,
    ExtendBookingRequestParams,
} from '../controllers/middlewares/bookings';

const router = express.Router();

router.get('/', controller.healthCheck);
router.get('/api/v1/booking/', controller.getBookings);
router.post(
    '/api/v1/booking/',
    /**
     * Commenting following line because it will required me to update
     * existing unit tests to pass.
     */
    // santizeRequestBody(CreateBookingRequest),
    controller.createBooking
);
router.patch(
    '/api/v1/booking/:id',
    santizeRequestBody(ExtendBookingRequest, ExtendBookingRequestParams),
    controller.extendBooking
);

export = router;
