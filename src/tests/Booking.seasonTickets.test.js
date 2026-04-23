import { getAvailableSeasonTickets } from './bookingSeasonTicketUtils';

describe('Booking season ticket visibility by training type', () => {
  test('returns only season tickets mapped to selected trainingTypeId (MIDI selected, MAXI ticket hidden)', () => {
    const midiType = { id: 101, name: 'MIDI' };
    const tickets = [
      {
        id: 1,
        product_name: 'Permanentka MIDI',
        training_types: [{ id: 101, name: 'MIDI' }],
      },
      {
        id: 2,
        product_name: 'Permanentka MAXI',
        training_types: [{ id: 202, name: 'MAXI' }],
      },
    ];

    const available = getAvailableSeasonTickets(tickets, midiType);

    expect(available).toHaveLength(1);
    expect(available[0].id).toBe(1);
  });

  test('returns empty list when selected training type is not mapped to any season ticket', () => {
    const midiType = { id: 101, name: 'MIDI' };
    const tickets = [
      {
        id: 2,
        product_name: 'Permanentka MAXI',
        training_types: [{ id: 202, name: 'MAXI' }],
      },
    ];

    const available = getAvailableSeasonTickets(tickets, midiType);

    expect(available).toEqual([]);
  });
});
