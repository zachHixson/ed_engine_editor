export default function awaitShared(){
    return new Promise(resolve => {
        const check = ()=>{
            if (window.Shared){
                resolve();
            }
            else{
                setTimeout(check);
            }
        }
        check();
    })
}