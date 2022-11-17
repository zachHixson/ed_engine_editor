const callbackQueue = [];

new Promise(resolve => {
    const check = ()=>{
        if (window.Shared){
            resolve();
        }
        else{
            setTimeout(check);
        }
    };
    check();
}).then(()=>{
    for (let i = 0; i < callbackQueue.length; i++){
        callbackQueue[i]();
    }

    //override the awaitShared method so that it just immediately executes the code instead
    awaitShared = (callback)=>{
        callback();
    }
});

export default function awaitShared(callback){
    callbackQueue.push(callback);
    return Symbol.for('Waiting on Shared Library');
}