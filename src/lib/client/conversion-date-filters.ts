export function clearConversionDateFilters(filters: {
  status: string;
  startDate: string;
  endDate: string;
}) {
  return {
    ...filters,
    startDate: "",
    endDate: "",
    page: 1,
  };
}
