import { Booking, Prisma, PrismaClient } from '@prisma/client';
import { param } from '../routes/bookings';
import { addDays } from '../utils/date';

const prisma = new PrismaClient();

export const bookingMiddleware: Prisma.Middleware<Booking> = (params, next) => {
    if (params.model !== 'Booking') return next(params);

    // Actions that trigger this middleware
    const insertActions: Prisma.PrismaAction[] = [
        'create',
        'createMany',
        'update',
        'updateMany',
    ];

    // If it's an insert action, enrich the data with checkoutDate
    if (insertActions.includes(params.action)) {
        params.args.data = Array.isArray(params.args.data)
            ? params.args.data.map(enrichBooking)
            : enrichBooking(params.args.data);
    }
    return next(params);
};

// Enrich a Booking object with a checkoutDate
function enrichBooking(booking: Booking): Booking {
    return {
        ...booking,
        checkoutDate: addDays(booking.checkInDate, booking.numberOfNights),
    };
}
