$('#submit-btn').on('click', function() {
    var serverCall = contactServerRephrase($("#text-area").val, 'https://speakeasyextension.herokuapp.com/newsentence').then(response => {
        console.log(response);
    });
})

async function sendHttpRequest(method, url, data) {
    
    var contact = fetch(url, {
        method: method, 
        body: JSON.stringify(data), 
        headers: data ? {'Content-Type': 'application/json'} : {}
     }).then(async (response) => {
        return (await response.json());
     }) 
    return(await contact);
    
};

async function contactServerRephrase(msg, url) {

    console.log('background.js: ran contactServerRephrase()')
    var request = sendHttpRequest('POST', url, { 
        text: msg, 
        threshold: $("#tolerance-slider").val, 
    }).then(async (responseData) => {
        var dog = await responseData;
        return dog;
    });
    return await request;

}
