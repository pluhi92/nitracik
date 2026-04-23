export const getAvailableSeasonTickets = (seasonTickets = [], selectedTypeObj = null) => {
  if (!selectedTypeObj) {
    return seasonTickets;
  }

  return seasonTickets.filter((ticket) =>
    Array.isArray(ticket.training_types)
      ? ticket.training_types.some((type) => type.id === selectedTypeObj.id)
      : false
  );
};
