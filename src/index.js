
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'


function MyPromise(executor) {
    let self = this
    self.state = PENDING
    self.value = null
    self.error = null
    self.onFulfilledCallbacks = []
    self.onRejectedCallbacks = []

    function resolve(value) {
        if (self.state === PENDING) {
            self.state = FULFILLED
            self.value = value

            self.onFulfilledCallbacks.forEach(function(fulfilledCallback) {
                fulfilledCallback()
            })
        }
    }
    function reject(error) {
        if (self.state === PENDING) {
            self.state = REJECTED
            self.error = error

            self.onRejectedCallbacks.forEach(function(rejectedCallback) {
                rejectedCallback(error)
            })
        }

    }

    try {
        executor(resolve, reject)
    } catch (e) {
        reject(e)
    }
}

MyPromise.prototype.then = function(onFulfilled, onRejected) {
    let self = this

    let promise = null

    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => {return value;};
    onRejected = typeof onRejected === 'function' ? onRejected : reason => {throw reason};

    promise = new MyPromise((resolve, reject) => {
        if (self.state === PENDING) {
            self.onFulfilledCallbacks.push(() => {
                try {
                    let val = onFulfilled(self.value)
                    self.resolvePromise(promise, val, resolve, reject)
                } catch (e) {
                    reject(e)
                }
            })
            self.onRejectedCallbacks.push(() => {
                try {
                    let err = onRejected(self.error)
                    self.resolvePromise(promise, err, resolve, reject)
                } catch (e) {
                    reject(e)
                }
            })
        }

        // 如果是同步的就直接执行了
        if (self.state === FULFILLED) {
            try {
                let val = onFulfilled(self.value)
                self.resolvePromise(promise, val, resolve, reject)
            } catch (e) {
                reject(e);
            }

        }
        if (self.state === REJECTED) {
            try {
                let err = onRejected(self.error)
                self.resolvePromise(promise, err, resolve, reject)
            } catch (e) {
                reject(e)
            }
        }
    })

    return promise

}

MyPromise.prototype.resolvePromise = function(promise, x, resolve, reject) {
    let self = this
    let called = false

    if(promise === x) {
        return reject(new TypeError("循环引用"))
    }

    if (x != null && ['[object Object]', '[object Function]'].includes(Object.prototype.toString.call(x))) {
        try {
            let then = x.then

            if (x.then instanceof Function) {
                then.call(x, (y) => {
                    if (called) return;
                    called = true;
                    self.resolvePromise(promise, y, resolve, reject)
                }, (err) => {
                    if (called) return;
                    called = true
                    reject(err)
                })
            } else {
                if (called) return;
                called = true
                resolve(x)
            }
        } catch (e) {
            if (called) return;
            called = true
            reject(e)
        }
    } else {
        resolve(x)
    }
}

MyPromise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
};

MyPromise.prototype.finally = function(fn) {
    this.then((val) => {
        fn(val)
        return val
    }, (err) => {
        fn(err)
        throw err
    })
}


MyPromise.prototype.done = function() {
    this.catch(function (err) {
        throw err
    })
}

MyPromise.all = function(promiseArr) {
    return new Promise((resolve, reject) => {
        let result = []
        promiseArr.forEach((promise, index) => {
            promise.then(value => {
                result[index] = value
                if (result.length === promiseArr.length) {
                    resolve(result)
                }
            }, reject)
        })
    })
}

MyPromise.race = function(promiseArr) {
    return new Promise((resolve, reject) => {
        promiseArr.forEach((promise) => {
            promise.then(value => {
                resolve(value)
            }, reject)
        })
    })
}

MyPromise.resolve = function(val) {
    let promise
    promise = new MyPromise((resolve, reject) => {
        this.prototype.resolvePromise(promise, val, resolve, resolve)
    })
    return promise
}

MyPromise.reject = function(err) {
    return new Promise((resolve, reject) => {
        reject(err)
    })
}


MyPromise.deferred = function() {
    let deffer = {}
    deffer.promise = new Promise((resolve, reject) => {
        deffer.resolve = resolve
        deffer.reject = reject
    })
    return deffer
}

MyPromise.prototype.stop = function() {
    return new MyPromise(function() {})
}

module.exports = MyPromise
