// Better Timer (Larger time interval)
class Timer {
    #timer;
    #callback;
    #params;

    constructor() {
        this.#timer = null;
        this.#callback = null;
        this.#params = null;
    }

    /**
     * 
     * @param {function} callback Callback function after timeout
     * @param {Number} time time by which timer goes off in ms
     * @param {Number} interval the interval in which the clock ticks
     * @param {Array} params callback parameters
     */
    SetTimer(callback, time, interval, ...params) {   
        let time_passed = 0;

        this.#params = params;
        this.#callback = callback;

        this.#timer = setInterval(() => {
            time_passed += interval;

            // Stop the timer if time passed >= time out time
            if(time_passed >= time) {
                this.ExecuteTimer();
            }
        }, interval);
    }

    ExecuteTimer() {
        clearInterval(this.#timer);
        this.#callback(...this.#params);
    }

    StopTimer() {
        clearInterval(this.#timer);
    }
}

export default Timer;