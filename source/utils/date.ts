const daysToMilli = (days: number) => {
    return days * 24 * 60 * 60 * 1000;
};

export const addDays = (date: string | Date, days: number) => {
    const currentTime = new Date(date).getTime();
    const updatedTime = new Date(currentTime + daysToMilli(days));
    return updatedTime;
};
