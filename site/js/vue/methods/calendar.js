import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';

export const calendarMethods = {

    setYear (year) {
        this.year = year;
        this.firstWeekdayOfMonth = []
        this.daysInMonth = []
        for (let m = 1; m <= 12; m++) {
            this.firstWeekdayOfMonth.push(DateTime.local(year,m, 1).weekday);
            this.daysInMonth.push(DateTime.local(year,m).daysInMonth);
        }
    },

     navigateToYear(){
        if (!isNaN(parseInt(this.nyear))){
            this.year = parseInt(this.nyear.substr(0,4));
            this.nyear = '';
            window.location.href = window.location.origin +'?uid='+this.uid+'&year='+this.year;
        }
    },
}
