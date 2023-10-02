import axios, { AxiosError } from 'axios';
import { startServer, stopServer } from '../source/server';
import { PrismaClient } from '@prisma/client';

const GUEST_A_UNIT_1 = {
    unitID: '1',
    guestName: 'GuestA',
    checkInDate: new Date().toISOString().split('T')[0],
    numberOfNights: 5,
};

const GUEST_A_UNIT_2 = {
    unitID: '2',
    guestName: 'GuestA',
    checkInDate: new Date().toISOString().split('T')[0],
    numberOfNights: 5,
};

const GUEST_B_UNIT_1 = {
    unitID: '1',
    guestName: 'GuestB',
    checkInDate: new Date().toISOString().split('T')[0],
    numberOfNights: 5,
};

const prisma = new PrismaClient();

beforeEach(async () => {
    // Clear any test setup or state before each test
    await prisma.booking.deleteMany();
});

beforeAll(async () => {
    await startServer();
});

afterAll(async () => {
    await prisma.$disconnect();
    await stopServer();
});

describe('Booking API', () => {
    test('Create fresh booking', async () => {
        const response = await axios.post(
            'http://localhost:8000/api/v1/booking',
            GUEST_A_UNIT_1
        );
        expect(response.status).toBe(200);
        expect(response.data.guestName).toBe(GUEST_A_UNIT_1.guestName);
        expect(response.data.unitID).toBe(GUEST_A_UNIT_1.unitID);
        expect(response.data.numberOfNights).toBe(
            GUEST_A_UNIT_1.numberOfNights
        );
    });

    test('Same guest same unit booking', async () => {
        // Create first booking
        const response1 = await axios.post(
            'http://localhost:8000/api/v1/booking',
            GUEST_A_UNIT_1
        );
        expect(response1.status).toBe(200);
        expect(response1.data.guestName).toBe(GUEST_A_UNIT_1.guestName);
        expect(response1.data.unitID).toBe(GUEST_A_UNIT_1.unitID);

        // Guests want to book the same unit again
        let error: any;
        try {
            await axios.post(
                'http://localhost:8000/api/v1/booking',
                GUEST_A_UNIT_1
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(AxiosError);
        expect(error.response.status).toBe(400);
        expect(error.response.data).toEqual(
            'The given guest name cannot book the same unit multiple times'
        );
    });

    test('Same guest different unit booking', async () => {
        // Create first booking
        const response1 = await axios.post(
            'http://localhost:8000/api/v1/booking',
            GUEST_A_UNIT_1
        );
        expect(response1.status).toBe(200);
        expect(response1.data.guestName).toBe(GUEST_A_UNIT_1.guestName);
        expect(response1.data.unitID).toBe(GUEST_A_UNIT_1.unitID);

        // Guest wants to book another unit
        let error: any;
        try {
            await axios.post(
                'http://localhost:8000/api/v1/booking',
                GUEST_A_UNIT_2
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(AxiosError);
        expect(error.response.status).toBe(400);
        expect(error.response.data).toEqual(
            'The same guest cannot be in multiple units at the same time'
        );
    });

    test('Different guest same unit booking', async () => {
        // Create first booking
        const response1 = await axios.post(
            'http://localhost:8000/api/v1/booking',
            GUEST_A_UNIT_1
        );
        expect(response1.status).toBe(200);
        expect(response1.data.guestName).toBe(GUEST_A_UNIT_1.guestName);
        expect(response1.data.unitID).toBe(GUEST_A_UNIT_1.unitID);

        // GuestB trying to book a unit that is already occupied
        let error: any;
        try {
            await axios.post(
                'http://localhost:8000/api/v1/booking',
                GUEST_B_UNIT_1
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(AxiosError);
        expect(error.response.status).toBe(400);
        expect(error.response.data).toEqual(
            'For the given check-in date, the unit is already occupied'
        );
    });

    test('Different guest same unit booking different date', async () => {
        // Create first booking
        const response1 = await axios.post(
            'http://localhost:8000/api/v1/booking',
            GUEST_A_UNIT_1
        );
        expect(response1.status).toBe(200);
        expect(response1.data.guestName).toBe(GUEST_A_UNIT_1.guestName);

        // GuestB trying to book a unit that is already occupied
        let error: any;
        try {
            await axios.post('http://localhost:8000/api/v1/booking', {
                unitID: '1',
                guestName: 'GuestB',
                checkInDate: new Date(
                    new Date().getTime() + 24 * 60 * 60 * 1000
                )
                    .toISOString()
                    .split('T')[0],
                numberOfNights: 5,
            });
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(AxiosError);
        expect(error.response.status).toBe(400);
        expect(error.response.data).toBe(
            'For the given check-in date, the unit is already occupied'
        );
    });

    test('Extend number of stays to a date that is not already occupied', async () => {
        // Guest A created 1st booking
        const response1 = await axios.post(
            'http://localhost:8000/api/v1/booking',
            GUEST_A_UNIT_1
        );

        // GuestB creates a booking 5 days after guest 1 leaves
        const nextAvailableDate = new Date(
            new Date(response1.data.checkoutDate).getTime() +
                5 * 24 * 60 * 60 * 1000
        );

        await axios.post('http://localhost:8000/api/v1/booking', {
            unitID: '1',
            guestName: 'GuestB',
            checkInDate: nextAvailableDate.toISOString().split('T')[0],
            numberOfNights: 5,
        });

        // Guest 1 want to update the booking by 2 days
        const extendNights = 2;
        const response2 = await axios.patch(
            `http://localhost:8000/api/v1/booking/${response1.data.id}`,
            { extendBy: extendNights }
        );
        expect(response2.status).toBe(200);
        expect(response2.data.success).toBe(true);
        expect(response2.data.data.numberOfNights).toBe(
            GUEST_A_UNIT_1.numberOfNights + extendNights
        );
    });
    test('Extend number of stays to a date that is already occupied', async () => {
        // Guest A created 1st booking
        const response1 = await axios.post(
            'http://localhost:8000/api/v1/booking',
            GUEST_A_UNIT_1
        );

        // GuestB to creates a booking 5 days after guest 1 leaves
        const nextAvailableDate = new Date(
            new Date(response1.data.checkoutDate).getTime() +
                5 * 24 * 60 * 60 * 1000
        );

        await axios.post('http://localhost:8000/api/v1/booking', {
            unitID: '1',
            guestName: 'GuestB',
            checkInDate: nextAvailableDate.toISOString().split('T')[0],
            numberOfNights: 5,
        });

        // Guest 1 want to update the booking by 7 days
        const extendNights = 7;
        let error: any;
        try {
            await axios.patch(
                `http://localhost:8000/api/v1/booking/${response1.data.id}`,
                { extendBy: extendNights }
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(AxiosError);
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.message).toEqual(
            'For the updated checkout date, the unit is already occupied'
        );
    });

    test('Provided booking ID is invalid', async () => {
        const extendNights = 2;
        const randomId = 100;
        let error: any;
        try {
            await axios.patch(
                `http://localhost:8000/api/v1/booking/${randomId}`,
                { extendBy: extendNights }
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(AxiosError);
        expect(error.response.status).toBe(404);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.message).toEqual('Booking not found');
    });
    test('extendBy value not provided', async () => {
        // Guest 1 booked a unit
        const response1 = await axios.post(
            'http://localhost:8000/api/v1/booking',
            GUEST_A_UNIT_1
        );
        expect(response1.status).toBe(200);
        expect(response1.data.guestName).toBe(GUEST_A_UNIT_1.guestName);

        // Guest 1 want to update the booking by 2 days
        let error: any;
        try {
            await axios.patch(
                `http://localhost:8000/api/v1/booking/${response1.data.id}`
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(AxiosError);
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.message).toEqual(
            'Data not in correct shape'
        );
    });
    test('Provided extendBy value is not valid', async () => {
        // Guest 1 booked a unit
        const response1 = await axios.post(
            'http://localhost:8000/api/v1/booking',
            GUEST_A_UNIT_1
        );
        expect(response1.status).toBe(200);
        expect(response1.data.guestName).toBe(GUEST_A_UNIT_1.guestName);

        // Guest 1 want to update the booking by 2 days
        let error: any;
        try {
            await axios.patch(
                `http://localhost:8000/api/v1/booking/${response1.data.id}`,
                {
                    extendBy: 'abc',
                }
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(AxiosError);
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.message).toEqual(
            'Data not in correct shape'
        );
    });
});
