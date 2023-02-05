
const azureLink = "https://speakeasy.azurewebsites.net/";


//prevent text in the editor box from being too long
$("#homepage-editor").on("input keypress paste", function(event) {  
    if ($(this).html().length > 420) {
        event.preventDefault();
        return false;
    } else {
        var serverCall = contactServerRephrase($(this).html(), azureLink + 'newsentence').then(response => {
            console.log(response);
        });
    }
})

async function sendHttpRequest(method, url, data) {
    var contact = fetch(url, {
        method: method, 
        body: JSON.stringify(data), 
        mode: 'cors',
        headers: data ? {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://granthough.github.io'} : {}
     }).then(async (response) => {
        return (await response.json());
     }) 
    return(await contact);
    
};

async function contactServerRephrase(msg, url) {
        var request = sendHttpRequest('POST', url, { 
            text: msg,
            threshold: 1, 
        }).then(async (responseData) => {
            var dog = await responseData;
            return dog;
        });
        return await request;
}

