

class EmailStore {

    constructor() {
        this._data = {}
        this._email = 'watchmachine.post@gmail.com'
        this._password = 'rmhmfpahyldafglr'
    }

    getCode(email) {
        return this._data[email]
    }

    removeData(email) {
        delete this._data[email]
    }

    pushData(email, code) {
        this._data[email] = code
        setTimeout(() => {
            this.removeData(email)
        }, 1000 * 60 * 10)
    }

    get email() {
        return this._email
    }

    get password() {
        return this._password
    }
}


module.exports = new EmailStore()
