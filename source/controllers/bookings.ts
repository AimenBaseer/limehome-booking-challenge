import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { Booking } from '@prisma/client';
import { addDays } from '../utils/date';
import { isNumeric } from '../utils/checkType';

const healthCheck = async (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: 'OK',
    });
};

const createBooking = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const booking: Booking = req.body;

    let outcome = await isBookingPossible(booking);
    if (!outcome.result) {
        return res.status(400).json(outcome.reason);
    }

    let bookingResult = await prisma.booking.create({
        data: {
            guestName: booking.guestName,
            unitID: booking.unitID,
            checkInDate: new Date(booking.checkInDate),
            numberOfNights: booking.numberOfNights,
        },
    });

    return res.status(200).json(bookingResult);
};

type bookingOutcome = { result: boolean; reason: string };

async function isBookingPossible(booking: Booking): Promise<bookingOutcome> {
    // check 1 : The Same guest cannot book the same unit multiple times
    let sameGuestSameUnit = await prisma.booking.findMany({
        where: {
            AND: {
                guestName: {
                    equals: booking.guestName,
                },
                unitID: {
                    equals: booking.unitID,
                },
            },
        },
    });
    if (sameGuestSameUnit.length > 0) {
        return {
            result: false,
            reason: 'The given guest name cannot book the same unit multiple times',
        };
    }

    // check 2 : the same guest cannot be in multiple units at the same time
    let sameGuestAlreadyBooked = await prisma.booking.findMany({
        where: {
            guestName: {
                equals: booking.guestName,
            },
        },
    });
    if (sameGuestAlreadyBooked.length > 0) {
        return {
            result: false,
            reason: 'The same guest cannot be in multiple units at the same time',
        };
    }

    // check 3 : Unit is available for the check-in date
    let isUnitAvailableOnCheckInDate = await prisma.booking.findMany({
        where: {
            AND: {
                checkInDate: {
                    lte: new Date(booking.checkInDate),
                },
                checkoutDate: {
                    gte: new Date(booking.checkInDate),
                },
                unitID: {
                    equals: booking.unitID,
                },
            },
        },
    });
    if (isUnitAvailableOnCheckInDate.length > 0) {
        return {
            result: false,
            reason: 'For the given check-in date, the unit is already occupied',
        };
    }

    return { result: true, reason: 'OK' };
}

const getBookings = async (req: Request, res: Response, next: NextFunction) => {
    const bookings = await prisma.booking.findMany();

    return res.status(200).json(bookings);
};

const canExtendDate = async (booking: Booking, id: string) => {
    if (!booking.checkoutDate) {
        return {
            result: false,
            reason: 'Booking should have a checkout date',
        };
    }
    const isUnitAvailableForUpdatedCheckoutDate = await prisma.booking.findMany(
        {
            where: {
                id: {
                    not: {
                        equals: Number(id),
                    },
                },
                AND: {
                    checkInDate: {
                        lte: new Date(booking.checkoutDate),
                    },
                    checkoutDate: {
                        gt: new Date(booking.checkoutDate),
                    },
                    unitID: {
                        equals: booking.unitID,
                    },
                },
            },
        }
    );
    if (isUnitAvailableForUpdatedCheckoutDate.length > 0) {
        return {
            result: false,
            reason: 'For then updated checkout date, the unit is already occupied',
        };
    }
    return { result: true, reason: 'OK' };
};

const extendBooking = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { extendBy } = req.body;
    const { id } = req.params;

    if (!extendBy || !isNumeric(extendBy)) {
        return res
            .status(400)
            .json('extendBy field is required and should be a number');
    }
    const booking = await prisma.booking.findFirst({
        where: { id: Number(id) },
    });

    if (!booking) {
        return res.status(400).json('No booking available with provided ID');
    }

    const newBooking = { ...booking };

    newBooking.numberOfNights = booking.numberOfNights + extendBy;
    newBooking.checkoutDate = addDays(booking.checkoutDate!, extendBy);

    const extendable = await canExtendDate(newBooking, id);

    if (!extendable.result) {
        return res.status(400).json(extendable.reason);
    }

    const bookingResult = await prisma.booking.update({
        where: {
            id: Number(id),
        },
        data: newBooking,
    });

    return res.status(200).json(bookingResult);
};
export default { healthCheck, createBooking, getBookings, extendBooking };
