const azureLink = "https://speakeasy.azurewebsites.net/"; //base link for azure paas server
var lastTrigger = 0; //index for keeping track of how many cycles of n milliseconds it has been since last trigger of server call
var lastText = ""; //most recent text for the edtior box before new trigger
var triggerThreshold = 5; //threshold for how many times the n millisecond loop must continue without any text change before a server call
var loopTime = 4000; //milliseconds before loop recurses
 
//prevent text in the editor box from being too long
$("#homepage-editor").on("input keypress paste", function(event) {  
    if ($(this).html().length > 420) {
        event.preventDefault();
        return false;
    }
})

//recursive function to trigger message to server every n milliseconds
function timer(amount) {
    $("#homepage-editor").trigger('message');
    messageTimeout = setTimeout(() => {
        timer(amount);
        lastTrigger++;
    }, amount);
}

//starting recursive loop for n milliseconds
timer(loopTime);

//listener for message every n milliseconds
$("#homepage-editor").on('message', function() {
    //get rid of excessive spaces, might be erroneous, check this out later
    text = $(this).html().replaceAll("   ", "")
    text = text.replaceAll("\n", "")
    
    // if the text as changed or it has been triggerThreshold * n milliseconds
    if (text != lastText || lastTrigger > triggerThreshold) {
        //setting new value for lastText and resetting last trigger index
        lastText = text;
        lastTrigger = 0;

        var serverCall = contactServerRephrase(text, azureLink + 'rephrase')
            .catch((error) => {
                console.log(error);
            })
            .then(response => {
                console.log(response);
            }
        );

    } else {
        lastTrigger++;
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

