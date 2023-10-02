import { z } from 'zod';

const CreateBookingRequest = z.object({
    guestName: z.string(),
    unitID: z.string(),
    checkInDate: z.date(),
    numberOfNights: z.number().int().positive(),
});

const ExtendBookingRequest = z.object({
    extendBy: z.number(),
});

const ExtendBookingRequestParams = z.object({
    id: z.string(),
});

export {
    CreateBookingRequest,
    ExtendBookingRequest,
    ExtendBookingRequestParams,
};
